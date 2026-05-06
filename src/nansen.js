import { config } from "./config.js";

const BASE_URL = "https://api.nansen.ai/api/v1";

async function nansenPost(path, body) {
  if (!config.nansenApiKey) {
    throw new Error("NANSEN_API_KEY is missing.");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      apiKey: config.nansenApiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(`Nansen API error ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }

  return data;
}

function unwrapRows(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const candidates = [
    data.data,
    data.results,
    data.result,
    data.rows,
    data.items,
    data.tokens,
    data.trades,
    data.holders
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = unwrapRows(candidate);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

function numberFrom(row, keys, fallback = 0) {
  for (const key of keys) {
    const value = row?.[key];
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return fallback;
}

function stringFrom(row, keys, fallback = "") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return fallback;
}

function usd(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "未取得";
  if (Math.abs(number) >= 1_000_000) return `$${(number / 1_000_000).toFixed(2)}M`;
  if (Math.abs(number) >= 1_000) return `$${(number / 1_000).toFixed(1)}K`;
  return `$${number.toFixed(0)}`;
}

function todayRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  };
}

export async function getSolanaSmartMoneyNetflow(limit = 20) {
  const data = await nansenPost("/smart-money/netflow", {
    chains: ["solana"]
  });
  return unwrapRows(data).slice(0, limit);
}

export async function getSolanaSmartMoneyDexTrades(limit = 50) {
  const data = await nansenPost("/smart-money/dex-trades", {
    chains: ["solana"]
  });
  return unwrapRows(data).slice(0, limit);
}

export async function getSolanaTokenScreener(limit = 80) {
  const data = await nansenPost("/token-screener", {
    chains: ["solana"],
    date: todayRange()
  });
  return unwrapRows(data).slice(0, limit);
}

export async function getTokenHolders(chain, tokenAddress, limit = 20) {
  const data = await nansenPost("/tgm/holders", {
    chain,
    token_address: tokenAddress
  });
  return unwrapRows(data).slice(0, limit);
}

export async function getFlowIntelligence(chain, tokenAddress, timeframe = "1d") {
  return nansenPost("/tgm/flow-intelligence", {
    chain,
    token_address: tokenAddress,
    timeframe
  });
}

export function toCandidate(row, dexTrades = []) {
  const symbol = stringFrom(row, ["token_symbol", "symbol", "ticker", "token"], "UNKNOWN").replace(/^\$/, "");
  const ca = stringFrom(row, ["token_address", "address", "contract_address", "ca"], "");
  const marketCapUsd = numberFrom(row, ["market_cap_usd", "market_cap", "fdv_usd", "fdv", "mcap"], 0);
  const netflow1hUsd = numberFrom(row, ["net_flow_1h_usd", "netflow_1h_usd"], 0);
  const netflow24hUsd = numberFrom(row, ["net_flow_24h_usd", "netflow_24h_usd", "netflow_usd", "smart_money_netflow_usd", "netflow", "sm_netflow_usd"], 0);
  const netflow7dUsd = numberFrom(row, ["net_flow_7d_usd", "netflow_7d_usd"], 0);
  const tokenAgeDays = numberFrom(row, ["token_age_days", "age_days"], 0);
  const traderCount = numberFrom(row, ["trader_count", "traders", "smart_money_count", "sm_wallets", "buyers", "wallet_count"], 0);

  const matchingTrades = dexTrades.filter((trade) => {
    const tradeSymbol = stringFrom(trade, ["token_symbol", "symbol", "ticker", "token"], "");
    const tradeCa = stringFrom(trade, ["token_address", "address", "contract_address", "ca"], "");
    return (ca && tradeCa.toLowerCase() === ca.toLowerCase()) || (symbol !== "UNKNOWN" && tradeSymbol === symbol);
  });

  const smartMoneyInflows = Math.max(matchingTrades.length, traderCount || 1);
  const lowCapBonus = marketCapUsd > 0 && marketCapUsd <= 250_000 ? 22 : marketCapUsd <= 500_000 ? 14 : 0;
  const youngTokenBonus = tokenAgeDays > 0 && tokenAgeDays <= 7 ? 28 : tokenAgeDays <= 30 ? 18 : 0;
  const oldTokenPenalty = tokenAgeDays > 30 ? 24 : 0;
  const flowScore = Math.min(32, Math.round(Math.log10(Math.max(netflow24hUsd, 0) + 1) * 7));
  const smScore = Math.min(24, smartMoneyInflows * 3);
  const dexScore = matchingTrades.length > 0 ? 8 : 0;
  const bbScore = Math.max(25, Math.min(95, 25 + lowCapBonus + youngTokenBonus + flowScore + smScore + dexScore - oldTokenPenalty));
  const ageLabel = tokenAgeDays ? `${tokenAgeDays.toFixed(tokenAgeDays < 10 ? 1 : 0)}d` : "未取得";

  return {
    symbol,
    ca: ca || `${symbol}-address-not-returned`,
    marketCap: marketCapUsd ? usd(marketCapUsd) : "未取得",
    smartMoneyInflows,
    newWalletGrowth: stringFrom(row, ["new_wallet_growth", "wallet_growth", "holders_change"], "未取得"),
    bbScore,
    reason: `24h SM netflow ${netflow24hUsd >= 0 ? "+" : ""}${usd(netflow24hUsd)} / SM traders ${smartMoneyInflows} / age ${ageLabel}`,
    caution: marketCapUsd > 500_000
      ? "MCがやや高め。初動というより継続監視候補。"
      : "低cap初動候補。出来高継続、上位ホルダー売り、SNS拡散の有無を確認。",
    metrics: {
      netflow1hUsd,
      netflow24hUsd,
      netflow7dUsd,
      marketCapUsd,
      tokenAgeDays,
      traderCount,
      dexTradeMatches: matchingTrades.length
    },
    raw: row,
    detectedAt: new Date().toISOString(),
    source: "nansen-api"
  };
}
