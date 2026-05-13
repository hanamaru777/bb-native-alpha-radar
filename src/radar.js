import { config } from "./config.js";
import {
  getFlowIntelligence,
  getSolanaSmartMoneyDexTrades,
  getSolanaSmartMoneyNetflow,
  getSolanaTokenScreener,
  getTokenHolders,
  toCandidate
} from "./nansen.js";
import { getSolanaTokenMarketData } from "./marketData.js";
import { formatReactionSummary } from "./reactions.js";

const mockCandidates = [
  {
    symbol: "BUMPY",
    ca: "DG7tq9Jy7b15MLCNKiJt2u5d1TqwUThgUxLQGNAnpump",
    marketCap: "$63.1K",
    smartMoneyInflows: 4,
    newWalletGrowth: "+72%",
    bbScore: 82,
    reason: "Smart Moneyが短時間で複数流入。低capのまま買いが先行。",
    caution: "低capのため急落リスクあり。出来高継続と上位ホルダー売りを確認。",
    metrics: { marketCapUsd: 63100, netflow24hUsd: 5700, tokenAgeDays: 1, traderCount: 4, dexTradeMatches: 2 }
  },
  {
    symbol: "HALF",
    ca: "4tm2L6mNZ4N5uqGZToWd2mQdVJ1bkY3w5gUrLdVpump",
    marketCap: "$76.8K",
    smartMoneyInflows: 3,
    newWalletGrowth: "+58%",
    bbScore: 74,
    reason: "新規ウォレット増加とSmart Money流入が同時発生。",
    caution: "流動性はまだ薄い。DexScreenerで板と出来高を確認。",
    metrics: { marketCapUsd: 76800, netflow24hUsd: 4100, tokenAgeDays: 1, traderCount: 3, dexTradeMatches: 1 }
  }
];

let mockIndex = 0;

function uniqueByCa(candidates) {
  const seen = new Set();
  const result = [];
  for (const candidate of candidates) {
    const key = String(candidate.ca || "").toLowerCase();
    if (!key || seen.has(key) || key.endsWith("address-not-returned")) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

function compareByScoreThenFlow(a, b) {
  return Number(b.bbScore || 0) - Number(a.bbScore || 0)
    || Number(b.metrics?.netflow24hUsd || 0) - Number(a.metrics?.netflow24hUsd || 0);
}

function sortByScoreThenFlow(candidates) {
  return [...candidates].sort(compareByScoreThenFlow);
}

function getCandidateSafetyText(candidate) {
  const raw = candidate.raw || {};
  return [
    candidate.symbol,
    raw.token_symbol,
    raw.symbol,
    raw.ticker,
    raw.token,
    raw.token_name,
    raw.name,
    raw.base_token_name,
    raw.pair_name
  ].filter(Boolean).join(" ").toLowerCase();
}

function isUnsafeForPublicChannel(candidate) {
  const text = getCandidateSafetyText(candidate);
  const blocked = [
    "scam", "rug", "honeypot", "drain", "hack",
    "nigga", "nigger", "faggot", "retard", "rape",
    "nazi", "hitler", "kkk", "porn", "sex", "xxx",
    "hentai", "onlyfans", "fuck"
  ];
  return blocked.some((word) => text.includes(word));
}

function formatUsd(value) {
  if (value === null || value === undefined || value === "") return "n/a";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  const sign = number < 0 ? "-" : "";
  const abs = Math.abs(number);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

function formatGain(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  return `${number >= 0 ? "+" : ""}${number}%`;
}

function shortText(value, max = 900) {
  const text = String(value || "n/a");
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function flowDisplay(value) {
  if (value === null || value === undefined || value === "" || value === "n/a") return "取得待ち";
  return String(value);
}

function cleanDexSummary(summary) {
  return String(summary || "")
    .replace(/^DEX data:\s*/i, "")
    .replace("大きな警戒なし", "大きな警戒なし");
}

export function radarCallLabel(candidate) {
  const id = Number(candidate?.radarCall?.id);
  return Number.isFinite(id) && id > 0 ? `Radar Call #${id}` : "Radar Call";
}

export function radarConfidence(candidate) {
  const score = Number(candidate?.bbScore || 0);
  const metrics = candidate?.metrics || {};
  const sm = Number(candidate?.smartMoneyInflows || metrics.traderCount || 0);
  const flowAdjustment = Number(metrics.flowAdjustment || 0);
  const holderPenalty = Number(metrics.holderPenalty || 0);
  const marketPenalty = Number(metrics.marketPenalty || 0);

  if (score >= 92 && sm >= 3 && flowAdjustment >= 0 && holderPenalty <= 10 && marketPenalty < 12) return "HIGH";
  if (score >= config.minBbScore && sm >= 2 && holderPenalty < 20 && marketPenalty < 18) return "MEDIUM";
  return "LOW";
}

function confidenceNote(confidence) {
  if (confidence === "HIGH") return "強め。Nansen根拠がそろっているよ。";
  if (confidence === "MEDIUM") return "監視向き。追加確認してね。";
  return "弱め。無理に触らず確認優先だよ。";
}

function compactDate(value) {
  const time = new Date(value || 0);
  if (!Number.isFinite(time.getTime())) return "取得待ち";
  const diffMs = Date.now() - time.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs >= 0 && diffMs < hour) return `${Math.max(1, Math.round(diffMs / minute))}分前`;
  if (diffMs >= 0 && diffMs < day) return `${Math.round(diffMs / hour)}時間前`;
  return time.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function findNumberDeep(value, keyHints, depth = 0) {
  if (depth > 4 || value === null || value === undefined || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNumberDeep(item, keyHints, depth + 1);
      if (found !== null) return found;
    }
    return null;
  }
  for (const [key, item] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    const matches = keyHints.some((hint) => normalizedKey.includes(hint));
    const number = Number(item);
    if (matches && Number.isFinite(number)) return number;
  }
  for (const item of Object.values(value)) {
    const found = findNumberDeep(item, keyHints, depth + 1);
    if (found !== null) return found;
  }
  return null;
}

function rowNumber(row, keyHints) {
  if (!row || typeof row !== "object") return null;
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.toLowerCase();
    if (!keyHints.some((hint) => normalizedKey.includes(hint))) continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function collectLabelText(value, output = [], depth = 0) {
  if (depth > 4 || value === null || value === undefined) return output;
  if (typeof value === "string") {
    if (value.trim()) output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectLabelText(item, output, depth + 1);
    return output;
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      const normalizedKey = key.toLowerCase();
      const likelyLabel = ["label", "tag", "name", "category", "entity", "type", "segment"].some((hint) => normalizedKey.includes(hint));
      if (likelyLabel) collectLabelText(item, output, depth + 1);
      if (typeof item === "object") collectLabelText(item, output, depth + 1);
    }
  }
  return output;
}

function summarizeWalletLabels(rows) {
  const text = collectLabelText(rows).join(" | ").toLowerCase();
  const categories = [
    { label: "Smart Money系", words: ["smart", "smart money", "sm "] },
    { label: "whale系", words: ["whale", "large holder"] },
    { label: "fund/VC系", words: ["fund", "vc", "capital", "ventures", "labs"] },
    { label: "CEX/取引所系", words: ["binance", "coinbase", "okx", "bybit", "kucoin", "exchange", "cex"] },
    { label: "degen/trader系", words: ["degen", "trader", "meme", "pump"] }
  ];
  const detected = categories
    .filter((category) => category.words.some((word) => text.includes(word)))
    .map((category) => category.label);
  return {
    detected,
    summary: detected.length ? detected.join(" / ") : "目立つラベル未検出"
  };
}

function summarizeHolders(holders) {
  const rows = Array.isArray(holders) ? holders : [];
  const holderShares = rows
    .map((row) => rowNumber(row, ["percentage", "percent", "share", "ownership", "balance_pct", "holding_pct"]))
    .filter((value) => Number.isFinite(value))
    .map((value) => (value > 1 ? value : value * 100))
    .sort((a, b) => b - a);
  const top1Percent = holderShares[0] ?? null;
  const top5Percent = holderShares.slice(0, 5).reduce((sum, value) => sum + value, 0) || null;
  const concentration = top1Percent === null
    ? "未判定"
    : top1Percent >= 20 || (top5Percent !== null && top5Percent >= 55)
      ? "集中高め"
      : top1Percent >= 10 || (top5Percent !== null && top5Percent >= 35)
        ? "やや集中"
        : "分散寄り";
  return {
    rowCount: rows.length,
    top1Percent,
    top5Percent,
    concentration,
    labels: summarizeWalletLabels(rows)
  };
}

function summarizeFlowIntelligence(flow) {
  const inflowUsd = findNumberDeep(flow, ["inflow", "in_flow", "buy"]);
  const outflowUsd = findNumberDeep(flow, ["outflow", "out_flow", "sell"]);
  const netflowUsd = findNumberDeep(flow, ["netflow", "net_flow", "net"]);
  const inferredNetflowUsd = netflowUsd ?? (
    Number.isFinite(inflowUsd) && Number.isFinite(outflowUsd) ? inflowUsd - outflowUsd : null
  );
  let bias = "未判定";
  if (Number(inferredNetflowUsd) > 0) bias = "流入優勢";
  if (Number(inferredNetflowUsd) < 0) bias = "流出優勢";
  if (Number(inferredNetflowUsd) === 0) bias = "中立";
  return {
    inflowUsd,
    outflowUsd,
    netflowUsd: inferredNetflowUsd,
    bias,
    summary: `Flow Intelligence: ${bias}${inferredNetflowUsd === null ? "" : ` / net ${formatUsd(inferredNetflowUsd)}`}`
  };
}

function summarizeMarketQuality(market) {
  if (!market) {
    return {
      summary: "DEX data: 取得待ち",
      penalty: 0,
      bonus: 0,
      hardReject: false,
      reasons: []
    };
  }

  const reasons = [];
  const liquidity = Number(market.liquidityUsd);
  const volume24h = Number(market.volume24hUsd);
  const change1h = Number(market.priceChange1h);
  const change24h = Number(market.priceChange24h);
  const buys1h = Number(market.buys1h);
  const sells1h = Number(market.sells1h);
  let penalty = 0;
  let bonus = 0;
  let hardReject = false;

  if (Number.isFinite(liquidity) && liquidity < 5_000) {
    penalty += 14;
    reasons.push("流動性が薄い");
  }
  if (Number.isFinite(volume24h) && volume24h < 20_000) {
    penalty += 6;
    reasons.push("出来高が薄い");
  }
  if (Number.isFinite(change1h) && change1h <= -35) {
    penalty += 18;
    hardReject = true;
    reasons.push("1h急落中");
  } else if (Number.isFinite(change1h) && change1h <= -15) {
    penalty += 8;
    reasons.push("1h下落");
  }
  if (Number.isFinite(change24h) && change24h <= -50) {
    penalty += 10;
    reasons.push("24h大幅下落");
  }
  if (Number.isFinite(buys1h) && Number.isFinite(sells1h) && sells1h > buys1h * 1.4) {
    penalty += 8;
    reasons.push("直近売り優勢");
  }
  if (Number.isFinite(volume24h) && Number.isFinite(liquidity) && liquidity > 0 && volume24h / liquidity >= 3) {
    bonus += 4;
    reasons.push("出来高あり");
  }

  return {
    summary: reasons.length ? reasons.join(" / ") : "DEX data: 大きな警戒なし",
    penalty,
    bonus,
    hardReject,
    liquidityUsd: market.liquidityUsd,
    volume24hUsd: market.volume24hUsd,
    priceChange1h: market.priceChange1h,
    priceChange24h: market.priceChange24h,
    buys1h: market.buys1h,
    sells1h: market.sells1h,
    reasons
  };
}

function inferAlphaSignals(candidate, holders, flow) {
  const metrics = candidate.metrics || {};
  const sm = Number(candidate.smartMoneyInflows || metrics.traderCount || 0);
  const marketCap = Number(metrics.marketCapUsd || 0);
  const age = Number(metrics.tokenAgeDays || 0);
  const netflow = Number(flow?.netflowUsd);
  const rawText = getCandidateSafetyText(candidate);
  const narratives = [];
  if (/cto|community takeover/i.test(rawText)) narratives.push("CTO");
  if (/korea|korean|upbit|bithumb/i.test(rawText)) narratives.push("Korea/CEX");
  if (/cex|listing|binance|coinbase|okx|bybit/i.test(rawText)) narratives.push("CEX/listing");
  if (/pump|solana|meme/i.test(rawText)) narratives.push("SOL meme");

  const winnerWalletProxy = sm >= 10 ? "winner probable" : sm >= 3 ? "SM proxy" : "thin";
  const newWalletProxy = String(candidate.newWalletGrowth || "").match(/\d/) ? candidate.newWalletGrowth : "n/a";
  const sellerBuyPressure = Number.isFinite(netflow) && netflow < 0
    ? "seller pressure"
    : Number.isFinite(netflow) && netflow > 0
      ? "buyer pressure"
      : "unknown";
  const scoreAdjustment =
    (sm >= 10 ? 6 : sm >= 3 ? 3 : 0)
    + (marketCap > 0 && marketCap <= 100_000 ? 4 : 0)
    + (age > 0 && age <= 2 ? 4 : 0)
    + (Number.isFinite(netflow) && netflow > 0 ? 4 : Number.isFinite(netflow) && netflow < 0 ? -6 : 0)
    + Math.min(4, narratives.length * 2);

  return {
    winnerWalletProxy,
    newWalletProxy,
    sellerBuyPressure,
    narratives,
    scoreAdjustment,
    reason: `${winnerWalletProxy} / new wallets ${newWalletProxy} / ${sellerBuyPressure} / narrative ${narratives.join(", ") || "none"}`
  };
}

function applyNansenQualityAdjustments(candidate, holders = summarizeHolders([]), flow = summarizeFlowIntelligence(null), marketQuality = summarizeMarketQuality(null)) {
  const metrics = candidate.metrics || {};
  const scoreBreakdown = metrics.scoreBreakdown || {};
  const sm = Number(candidate.smartMoneyInflows || metrics.traderCount || 0);
  const top1 = Number(holders.top1Percent);
  const top5 = Number(holders.top5Percent);
  const holderPenalty = (Number.isFinite(top1) && top1 >= 20) || (Number.isFinite(top5) && top5 >= 55)
    ? 20
    : (Number.isFinite(top1) && top1 >= 15) || (Number.isFinite(top5) && top5 >= 40)
      ? 10
      : 0;
  const flowAdjustment = Number.isFinite(flow.netflowUsd)
    ? flow.netflowUsd > 0 ? 8 : flow.netflowUsd < 0 ? -18 : 0
    : 0;
  const singleSmHolderPenalty = sm <= 1 && holderPenalty > 0 ? 12 : 0;
  const alphaSignals = inferAlphaSignals(candidate, holders, flow);
  const baseConfidenceCap = Number.isFinite(scoreBreakdown.confidenceCap) ? scoreBreakdown.confidenceCap : 95;
  const confidenceCap = Number.isFinite(flow.netflowUsd) && flow.netflowUsd < 0
    ? Math.min(baseConfidenceCap, config.minBbScore - 1)
    : baseConfidenceCap;
  const adjustedScore = Math.max(
    25,
    Math.min(
      confidenceCap,
      Number(candidate.bbScore || 0)
        + flowAdjustment
        + alphaSignals.scoreAdjustment
        + Number(marketQuality.bonus || 0)
        - holderPenalty
        - singleSmHolderPenalty
        - Number(marketQuality.penalty || 0)
    )
  );
  const holderLine = `holders top1 ${Number.isFinite(top1) ? `${top1.toFixed(1)}%` : "n/a"} / top5 ${Number.isFinite(top5) ? `${top5.toFixed(1)}%` : "n/a"}`;
  const flowLine = Number.isFinite(flow.netflowUsd) ? `Nansen flow ${formatUsd(flow.netflowUsd)}` : "Nansen flow n/a";
  const cautionAdd = holderPenalty > 0 ? ` 上位ホルダー集中に注意。${holderLine}。` : ` ${holderLine}。`;
  return {
    ...candidate,
    bbScore: adjustedScore,
    caution: `${candidate.caution || ""}${cautionAdd}`,
    reason: `${candidate.reason || ""} / ${flowLine} / ${alphaSignals.reason}`,
    nansenDeepDive: { ...(candidate.nansenDeepDive || {}), holders, flow, alphaSignals, marketQuality },
    metrics: {
      ...metrics,
      holderPenalty,
      flowAdjustment,
      marketPenalty: marketQuality.penalty || 0,
      marketBonus: marketQuality.bonus || 0,
      marketHardReject: Boolean(marketQuality.hardReject),
      singleSmHolderPenalty,
      alphaSignals,
      liquidityUsd: marketQuality.liquidityUsd ?? metrics.liquidityUsd,
      volume24hUsd: marketQuality.volume24hUsd ?? metrics.volume24hUsd,
      priceChange1h: marketQuality.priceChange1h ?? metrics.priceChange1h,
      priceChange24h: marketQuality.priceChange24h ?? metrics.priceChange24h,
      scoreBreakdown: { ...scoreBreakdown, holderPenalty, flowAdjustment, marketPenalty: marketQuality.penalty || 0, marketBonus: marketQuality.bonus || 0, singleSmHolderPenalty, alphaSignals }
    }
  };
}

async function enrichRadarCandidate(candidate) {
  const [holdersResult, flowResult, marketResult] = await Promise.allSettled([
    getTokenHolders("solana", candidate.ca, 20),
    getFlowIntelligence("solana", candidate.ca, "1d"),
    getSolanaTokenMarketData(candidate.ca)
  ]);
  const holders = holdersResult.status === "fulfilled" ? summarizeHolders(holdersResult.value) : summarizeHolders([]);
  const flow = flowResult.status === "fulfilled" ? summarizeFlowIntelligence(flowResult.value) : summarizeFlowIntelligence(null);
  const marketQuality = summarizeMarketQuality(marketResult.status === "fulfilled" ? marketResult.value : null);
  const enrichmentErrors = [];
  if (holdersResult.status === "rejected") enrichmentErrors.push(`holders: ${holdersResult.reason?.message || holdersResult.reason}`);
  if (flowResult.status === "rejected") enrichmentErrors.push(`flow: ${flowResult.reason?.message || flowResult.reason}`);
  if (marketResult.status === "rejected") enrichmentErrors.push(`market: ${marketResult.reason?.message || marketResult.reason}`);
  const adjusted = applyNansenQualityAdjustments(candidate, holders, flow, marketQuality);
  return {
    ...adjusted,
    metrics: { ...(adjusted.metrics || {}), enrichmentErrors }
  };
}

export async function scanAlphaCandidatesDetailed() {
  if (config.mockMode || !config.nansenApiKey) {
    const rotated = [
      mockCandidates[mockIndex % mockCandidates.length],
      mockCandidates[(mockIndex + 1) % mockCandidates.length]
    ];
    mockIndex += 1;
    return {
      candidates: rotated.map((candidate) => ({ ...candidate, detectedAt: new Date().toISOString(), source: "mock" })),
      rejected: [],
      scannedCount: rotated.length,
      sourceErrors: []
    };
  }

  const fetches = await Promise.allSettled([
    getSolanaSmartMoneyNetflow(25),
    getSolanaSmartMoneyDexTrades(60),
    getSolanaTokenScreener(80)
  ]);
  const netflows = fetches[0].status === "fulfilled" ? fetches[0].value : [];
  const dexTrades = fetches[1].status === "fulfilled" ? fetches[1].value : [];
  const screenerTokens = fetches[2].status === "fulfilled" ? fetches[2].value : [];
  const sourceNames = ["smart-money/netflow", "smart-money/dex-trades", "token-screener"];
  const sourceErrors = fetches
    .map((result, index) => result.status === "rejected" ? `${sourceNames[index]}: ${result.reason?.message || result.reason}` : null)
    .filter(Boolean);

  if (!netflows.length && !dexTrades.length && !screenerTokens.length) {
    throw new Error(`Nansen radar sources unavailable: ${sourceErrors.join(" / ") || "no rows returned"}`);
  }

  const rows = [...netflows, ...screenerTokens];
  const baseCandidates = uniqueByCa(rows.map((row) => toCandidate(row, dexTrades)))
    .filter((candidate) => candidate.symbol !== "UNKNOWN")
    .filter((candidate) => !isUnsafeForPublicChannel(candidate))
    .filter((candidate) => {
      const metrics = candidate.metrics || {};
      const lowEnough = !metrics.marketCapUsd || metrics.marketCapUsd <= config.marketCapMaxUsd;
      const hasFlow = (metrics.netflow24hUsd || 0) > 0 || (metrics.traderCount || 0) >= config.minSmartMoneyTraders;
      const freshEnough = Number.isFinite(metrics.tokenAgeDays) && metrics.tokenAgeDays > 0 && metrics.tokenAgeDays <= config.tokenAgeMaxDays;
      return lowEnough && hasFlow && freshEnough;
    })
    .sort(compareByScoreThenFlow)
    .slice(0, 8);

  const enrichedCandidates = await Promise.all(baseCandidates.map(enrichRadarCandidate));
  const sorted = sortByScoreThenFlow(enrichedCandidates);
  const passed = sorted.filter(passesAutoAlertPolicy);
  return {
    candidates: passed.slice(0, 5),
    rejected: sorted.filter((candidate) => !passesAutoAlertPolicy(candidate)).slice(0, 3),
    scannedCount: baseCandidates.length,
    sourceErrors
  };
}

export async function scanAlphaCandidates() {
  const result = await scanAlphaCandidatesDetailed();
  return result.candidates;
}

function passesAutoAlertPolicy(candidate) {
  const metrics = candidate.metrics || {};
  const flow = candidate.nansenDeepDive?.flow;
  if (Number(candidate.bbScore || 0) < config.minBbScore) return false;
  if (Number(metrics.flowAdjustment || 0) < 0) return false;
  if (flow?.bias === "流出優勢") return false;
  if (metrics.marketHardReject) return false;
  if (Number(metrics.marketPenalty || 0) >= 18) return false;
  return true;
}

export async function analyzeTokenFlow(ca) {
  const [holdersResult, flowResult, marketResult] = await Promise.allSettled([
    getTokenHolders("solana", ca, 20),
    getFlowIntelligence("solana", ca, "1d"),
    getSolanaTokenMarketData(ca)
  ]);
  const holders = holdersResult.status === "fulfilled" ? summarizeHolders(holdersResult.value) : null;
  const flow = flowResult.status === "fulfilled" ? summarizeFlowIntelligence(flowResult.value) : null;
  const market = marketResult.status === "fulfilled" ? marketResult.value : null;
  const errors = [];
  if (holdersResult.status === "rejected") errors.push(`holders: ${holdersResult.reason?.message || holdersResult.reason}`);
  if (flowResult.status === "rejected") errors.push(`flow: ${flowResult.reason?.message || flowResult.reason}`);
  if (marketResult.status === "rejected") errors.push(`market: ${marketResult.reason?.message || marketResult.reason}`);
  if (!holders && !flow && !market) throw new Error(errors.join(" / ") || "Nansen flow unavailable");
  return {
    symbol: market?.symbol || "UNKNOWN",
    ca,
    marketCap: market?.marketCapUsd ? formatUsd(market.marketCapUsd) : "Nansen analysis",
    smartMoneyInflows: "Nansen API",
    newWalletGrowth: holders ? `${holders.rowCount} holder rows` : "n/a",
    bbScore: "分析中",
    reason: holders ? `Token holders ${holders.rowCount}件を取得。` : "holder取得なし。",
    caution: flow?.summary || errors.join(" / "),
    nansenDeepDive: { holders, flow },
    metrics: {
      enrichmentErrors: errors,
      marketCapUsd: market?.marketCapUsd,
      volume24hUsd: market?.volume24hUsd,
      liquidityUsd: market?.liquidityUsd
    }
  };
}

function linksFor(candidate) {
  const ca = encodeURIComponent(candidate.ca || "");
  return {
    dex: `https://dexscreener.com/solana/${ca}`,
    gmgn: `https://gmgn.ai/sol/token/${ca}`,
    nansen: `https://app.nansen.ai/token-god-mode?tokenAddress=${ca}&chain=solana&tab=transactions`
  };
}

export function formatRadarButtons(candidates) {
  return candidates.slice(0, 2).map((candidate, index) => {
    const links = linksFor(candidate);
    const n = index + 1;
    const prefix = candidates.length > 1 ? `${n} ` : "";
    return {
      type: 1,
      components: [
        { type: 2, style: 5, label: `${prefix}DexScreener`, url: links.dex },
        { type: 2, style: 5, label: `${prefix}gmgn`, url: links.gmgn },
        { type: 2, style: 5, label: `${prefix}Nansen`, url: links.nansen }
      ]
    };
  });
}

export function formatRejectedRadarButtons(rejected = []) {
  return formatRadarButtons(rejected.slice(0, 2));
}

function finalAge(candidate) {
  const age = Number(candidate.metrics?.tokenAgeDays);
  return Number.isFinite(age) && age > 0 ? `${age.toFixed(age < 10 ? 1 : 0)}d` : "n/a";
}

function finalSm(candidate) {
  return String(candidate.smartMoneyInflows || candidate.metrics?.traderCount || "n/a");
}

function finalNetflow(candidate) {
  return formatUsd(candidate.metrics?.netflow24hUsd);
}

function holderLine(candidate) {
  const holders = candidate.nansenDeepDive?.holders;
  if (!holders) return "n/a";
  const top1 = holders.top1Percent === null || holders.top1Percent === undefined ? "n/a" : `${holders.top1Percent.toFixed(1)}%`;
  const top5 = holders.top5Percent === null || holders.top5Percent === undefined ? "n/a" : `${holders.top5Percent.toFixed(1)}%`;
  return `${holders.concentration} / top1 ${top1} / top5 ${top5}`;
}

function flowLine(candidate) {
  const flow = candidate.nansenDeepDive?.flow;
  return flow ? `${flow.bias} / net ${formatUsd(flow.netflowUsd)}` : `24h SM netflow ${finalNetflow(candidate)}`;
}

function radarSignalState(candidate) {
  const score = Number(candidate.bbScore || 0);
  const sm = Number(candidate.smartMoneyInflows || candidate.metrics?.traderCount || 0);
  const holderPenalty = Number(candidate.metrics?.holderPenalty || 0);
  const flowAdjustment = Number(candidate.metrics?.flowAdjustment || 0);
  const confidence = radarConfidence(candidate);

  if (confidence === "HIGH" || (score >= 92 && sm >= 3 && holderPenalty <= 10 && flowAdjustment >= 0)) {
    return {
      tag: "本命候補",
      label: "強い初動反応",
      color: 0x22c55e,
      summary: "bbで広がる前に、Smart Money側で先に反応が出ています。",
      action: "まず板・出来高・上位売りを確認。問題なければbbで共有候補。"
    };
  }

  if (score >= config.minBbScore && sm >= 3 && flowAdjustment >= 0) {
    return {
      tag: "監視候補",
      label: "監視候補",
      color: 0xfacc15,
      summary: "反応はあります。まだ一段確認してから触る候補です。",
      action: "追加SM流入、出来高継続、上位売りを確認。"
    };
  }

  return {
    tag: "監視候補",
    label: "薄い反応",
    color: 0x60a5fa,
    summary: "Radarには引っかかったけど、決定打はまだ弱めです。",
    action: "無理に触らず、次のNansen反応を待つ候補。"
  };
}

function radarWhyNowLine(candidate) {
  const parts = [];
  const metrics = candidate.metrics || {};
  const sm = Number(candidate.smartMoneyInflows || metrics.traderCount || 0);
  const flow = Number(metrics.netflow24hUsd || 0);
  const age = Number(metrics.tokenAgeDays || 0);
  const mcap = Number(metrics.marketCapUsd || 0);
  if (sm >= 3) parts.push(`Smart Money ${sm}`);
  if (flow > 0) parts.push(`24h flow ${formatUsd(flow)}`);
  if (mcap > 0 && mcap <= 100_000) parts.push("lowcap");
  if (age > 0 && age <= 2) parts.push(`${finalAge(candidate)} old`);
  const narratives = metrics.alphaSignals?.narratives || candidate.nansenDeepDive?.alphaSignals?.narratives || [];
  if (narratives.length) parts.push(narratives.join(" / "));
  return parts.join(" / ") || candidate.reason || "Smart Money側に早い反応があります。";
}

function radarVerifyLine(candidate) {
  return [
    "Dex / gmgn / Nansenで確認",
    `/flow ${candidate.ca}`
  ].join("\n");
}

function radarRiskLine(candidate) {
  const parts = [];
  const metrics = candidate.metrics || {};
  if (Number(metrics.holderPenalty || 0) > 0) parts.push("上位ホルダー集中");
  if (Number(metrics.flowAdjustment || 0) < 0) parts.push("Nansen flow弱め");
  if (Number(metrics.marketPenalty || 0) > 0) {
    const marketReasons = candidate.nansenDeepDive?.marketQuality?.reasons || [];
    parts.push(marketReasons.slice(0, 2).join(" / ") || "DEX側の警戒あり");
  }
  if (Number(candidate.smartMoneyInflows || metrics.traderCount || 0) <= 1) parts.push("Smart Moneyが少ない");
  return parts.join(" / ") || "板・出来高・上位売りを確認";
}

function riskLine(candidate) {
  const line = radarRiskLine(candidate);
  return line === "板・出来高・上位売りを確認" ? "板・出来高・上位売りは見てね" : line;
}

function radarTraceLine(candidate) {
  const metrics = candidate.metrics || {};
  const flow = candidate.nansenDeepDive?.flow;
  if (flow) return `${flow.bias} / net ${formatUsd(flow.netflowUsd)}`;
  const items = [];
  if (Number(metrics.netflow24hUsd || 0) > 0) items.push(`24h flow ${formatUsd(metrics.netflow24hUsd)}`);
  items.push(`SM ${finalSm(candidate)}`);
  const holders = holderLine(candidate);
  if (holders !== "n/a") items.push(`holders ${holders}`);
  return items.filter(Boolean).join(" / ");
}

export function formatRadarIntroWinning(candidates) {
  const count = Math.min(candidates.length, config.radarDisplayLimit);
  return [
    "**bb Native Alpha Radar**",
    `スキャン結果: ${count}件の反応あり`,
    "Pre-CA Radar 稼働中。触る前に確認。"
  ].join("\n");
}

export function formatRadarEmbedsWinning(candidates) {
  return candidates.slice(0, config.radarDisplayLimit).map((candidate, index) => {
    const state = radarSignalState(candidate);
    return {
      title: `${radarCallLabel(candidate)} | ${state.tag} | $${candidate.symbol}`,
      description: `${state.label}\n\n${state.summary}`,
      color: state.color,
      fields: [
        { name: "Radarが見た動き", value: shortText(radarWhyNowLine(candidate), 180) },
        { name: "まず確認", value: shortText(radarVerifyLine(candidate), 180) },
        { name: "注意点", value: shortText(radarRiskLine(candidate), 160), inline: true },
        { name: "Nansen根拠", value: shortText(radarTraceLine(candidate), 220), inline: true },
        { name: "CA", value: `\`${candidate.ca}\`` }
      ],
      footer: { text: "NFA / DYOR | VERIFY before touching" },
      timestamp: new Date().toISOString()
    };
  });
}

function rejectedReason(candidate) {
  const metrics = candidate.metrics || {};
  const reasons = [];
  if (metrics.bbAlreadyPosted) reasons.push("bb内でCA投稿済み");
  if (Number(metrics.flowAdjustment || 0) < 0) reasons.push("Nansen flow流出寄り");
  if (Number(metrics.holderPenalty || 0) > 0) reasons.push("上位ホルダー集中");
  if (Number(candidate.smartMoneyInflows || metrics.traderCount || 0) <= 1) reasons.push("Smart Moneyが少ない");
  if (Number(candidate.bbScore || 0) < config.minBbScore) reasons.push(`bb反応度${config.minBbScore}未満`);
  return reasons.join(" / ") || "条件未満";
}

function rejectedReasonFromScan(item) {
  if (Array.isArray(item?.reasons) && item.reasons.length) {
    return item.reasons.map(reasonLabel).join(" / ");
  }
  return rejectedReason(item);
}

function compactRejectedLine(candidate) {
  return `$${candidate.symbol}: ${rejectedReasonFromScan(candidate)}`;
}

export function formatRadarMissReportWinning(rejected = [], scannedCount = 0, stats = null) {
  const lines = [
    "**bb Native Alpha Radar**",
    "**強い反応なし**",
    "",
    "**スキャン結果**",
    "今は流しません。"
  ];
  const topReasons = stats?.scans?.topReasons || [];

  if (topReasons.length) {
    lines.push("", "**見送り理由**");
    topReasons.slice(0, 3).forEach((item) => {
      lines.push(`${reasonLabel(item.reason)} ${item.count}`);
    });
  }

  if (rejected.length) {
    lines.push("", "**監視のみ**");
    rejected.slice(0, 2).forEach((candidate) => {
      lines.push(compactRejectedLine(candidate));
    });
  } else if (scannedCount > 0) {
    lines.push("", "**監視のみ**");
    lines.push(`一次候補 ${scannedCount}件 -> 条件未満`);
  } else {
    lines.push("", "**監視のみ**");
    lines.push("一次候補なし");
  }

  lines.push("", "**次に見るもの**");
  lines.push("`/rejections` 見送り一覧");
  lines.push("`/stats` Daily Radar");
  lines.push("`/criteria` Rules");
  lines.push("", "弱い反応は流さず、今日は静かに見ています。");
  return lines.join("\n");
}

export function formatRadarCreditErrorProduction(error) {
  const message = String(error?.message || error || "");
  const credit = /insufficient credits/i.test(message);
  const detail = shortText(message.replace(/\s+/g, " "), 260);
  return [
    "**bb Native Alpha Radar**",
    credit
      ? "Nansen creditsが足りないかも。`/health` で状態を見てね。"
      : "Nansen取得で一時エラーが出たよ。",
    `詳細: ${detail}`,
    "Bot本体とNansen CLIは `/health` で確認できるよ。",
    "復旧したら `/radar` と自動通知はいつもどおり再開するよ。"
  ].join("\n");
}

function flowClassification(candidate) {
  const score = Number(candidate.bbScore || 0);
  const flow = candidate.nansenDeepDive?.flow;
  const holders = candidate.nansenDeepDive?.holders;
  if (flow?.bias === "流出優勢" || holders?.concentration === "集中高め" || score < config.minBbScore) {
    return {
      label: "監視候補",
      color: 0x60a5fa,
      action: "追加のSM流入、出来高継続、SNS拡散を待とう。",
      summary: "条件は見えるけど、決定打はまだ弱い候補だよ。"
    };
  }
  if (score >= 88) {
    return {
      label: "強い初動候補",
      color: 0x22c55e,
      action: "Dex/gmgnで板・出来高・上位売りを見てね。bbで話題化前なら優先監視だよ。",
      summary: "Smart Moneyとflowがそろった、短時間で判断したい候補だよ。"
    };
  }
  return {
    label: "確認候補",
    color: 0xfacc15,
    action: "無理に触らず、Nansen flowとholdersをもう一回見よう。",
    summary: "保存履歴または外部データで最低限表示しているよ。"
  };
}

export function formatFlowIntroProduction(candidate) {
  return `**Flow Judge**\n気になる子だけ、深掘りするよ。\n${radarCallLabel(candidate)} / $${candidate.symbol}`;
}

export function formatFlowEmbedProduction(candidate) {
  const classification = flowClassification(candidate);
  const confidence = radarConfidence(candidate);
  const tracking = candidate.tracking || {};
  const holders = candidate.nansenDeepDive?.holders;
  const flow = candidate.nansenDeepDive?.flow;
  const marketQuality = candidate.nansenDeepDive?.marketQuality;
  const scoreLabel = candidate.source ? "保存時bb反応度" : "bb反応度";
  const alphaSignal = candidate.nansenDeepDive?.alphaSignals?.reason || "";
  const trackingLine = Number.isFinite(Number(tracking.latestMarketCapUsd))
    ? `now ${formatUsd(tracking.latestMarketCapUsd)} / max ${formatUsd(tracking.maxMarketCapUsd)} / ${formatGain(tracking.maxGainPercent)}`
    : "取得待ち";
  const fields = [
    { name: "今やること", value: shortText(classification.action, 350) },
    { name: "要約", value: shortText(classification.summary, 350) },
    { name: "Radar confidence", value: `${confidence}\n${confidenceNote(confidence)}`, inline: true },
    { name: "時価総額", value: flowDisplay(candidate.marketCap || formatUsd(candidate.metrics?.marketCapUsd)), inline: true },
    { name: "Smart Money人数", value: flowDisplay(finalSm(candidate)), inline: true },
    { name: "24h流入", value: flowDisplay(finalNetflow(candidate)), inline: true },
    { name: "作成から", value: flowDisplay(finalAge(candidate)), inline: true },
    { name: scoreLabel, value: `${candidate.bbScore}/100`, inline: true },
    { name: "状態", value: classification.label, inline: true },
    { name: "上位ホルダー", value: holders ? holderLine(candidate) : "取得待ち" },
    { name: "ウォレットラベル", value: flowDisplay(holders?.labels?.summary), inline: true },
    { name: "Nansen資金", value: flow ? `${flow.bias} / net ${formatUsd(flow.netflowUsd)}` : "取得待ち", inline: true }
  ];
  if (marketQuality && marketQuality.summary !== "DEX data: 取得待ち") {
    const dexLine = [
      cleanDexSummary(marketQuality.summary),
      Number.isFinite(Number(marketQuality.priceChange1h)) ? `1h ${marketQuality.priceChange1h}%` : null,
      Number.isFinite(Number(marketQuality.liquidityUsd)) ? `liq ${formatUsd(marketQuality.liquidityUsd)}` : null
    ].filter(Boolean).join(" / ");
    fields.push({ name: "DEX状況", value: dexLine });
  }
  if (alphaSignal && alphaSignal !== "n/a") {
    fields.push({ name: "補足シグナル", value: alphaSignal });
  }
  fields.push({ name: "通知後の動き", value: trackingLine });

  return {
    title: `${radarCallLabel(candidate)} | Flow Judge | $${candidate.symbol}`,
    description: `\`${candidate.ca}\``,
    color: classification.color,
    fields,
    footer: { text: "Not financial advice | 見つけたよ。触る前に確認してね。" },
    timestamp: new Date().toISOString()
  };
}

function bbUnpostedLine(candidate) {
  if (candidate.metrics?.bbAlreadyPosted === true) return "bb既出";
  if (candidate.metrics?.bbAlreadyPosted === false) return "bb未投稿";
  return "未確認";
}

function shortReasons(candidate) {
  const reasons = [];
  const sm = finalSm(candidate);
  const netflow = finalNetflow(candidate);
  const flow = flowLine(candidate);
  const holders = holderLine(candidate);
  if (sm !== "n/a") reasons.push(`Smart Money人数 ${sm}`);
  if (netflow !== "n/a") reasons.push(`24h流入 ${netflow}`);
  if (flow !== "n/a") reasons.push(`Nansen資金 ${flow}`);
  if (holders !== "n/a") reasons.push(`上位ホルダー ${holders}`);
  reasons.push(bbUnpostedLine(candidate));
  return reasons.slice(0, 5);
}

export function formatWhyIntro(candidate) {
  return `**Why Radar picked this**\n${radarCallLabel(candidate)}\n$${candidate.symbol} / Solana`;
}

export function formatWhyEmbed(candidate) {
  const classification = flowClassification(candidate);
  const confidence = radarConfidence(candidate);
  const flow = flowLine(candidate);
  const holder = holderLine(candidate);
  const whyNow = [
    bbUnpostedLine(candidate),
    "低cap帯",
    "Smart Money先行"
  ].filter(Boolean).map((item) => `・${item}`).join("\n");
  const bbCares = [
    "Solana meme文脈",
    "初動検証に向いている",
    candidate.tracking?.maxGainPercent ? "Radar Call実績あり" : "Nansen確認に向いている"
  ].map((item) => `・${item}`).join("\n");
  return {
    title: `${radarCallLabel(candidate)} | $${candidate.symbol}`,
    description: `\`${candidate.ca}\``,
    color: classification.color,
    fields: [
      { name: "判定", value: classification.label, inline: true },
      { name: "Radar confidence", value: confidence, inline: true },
      { name: "bb反応度", value: `${candidate.bbScore}/100`, inline: true },
      { name: "Nansen根拠", value: [
        `・Smart Money ${flowDisplay(finalSm(candidate))}`,
        `・24h流入 ${flowDisplay(finalNetflow(candidate))}`,
        `・Flow ${flowDisplay(flow)}`,
        `・Holder ${flowDisplay(holder)}`
      ].join("\n") },
      { name: "Why now", value: whyNow, inline: true },
      { name: "Why bb cares", value: bbCares, inline: true },
      { name: "注意", value: [
        "・SNS拡散と出来高継続を確認",
        `・${shortText(riskLine(candidate), 180)}`
      ].join("\n") },
      { name: "次", value: `\`/flow ${candidate.ca}\` で深掘り\n下のボタンで DexScreener / gmgn / Nansen 確認` }
    ],
    footer: { text: "NFA / DYOR | 見つけた理由だけ短く見るよ。" },
    timestamp: new Date().toISOString()
  };
}

export function formatLeaderboardIntro(stats) {
  const count = stats.tracking?.leaderboard?.length || 0;
  return [
    "**Radar Leaderboard**",
    "Nansenとbb条件で拾ったRadar Callの追跡結果です。",
    count ? `伸びた順に上位${Math.min(count, 5)}件を表示します。` : "まだ追跡済みのRadar Callがありません。"
  ].join("\n");
}

export function formatLeaderboardEmbeds(stats) {
  const rows = stats.tracking?.leaderboard || [];
  return rows.slice(0, 5).map((alert, index) => {
    const tracking = alert.tracking || {};
    const links = linksFor(alert);
    const reasons = shortReasons(alert).slice(0, 3).map((reason) => `・${reason}`).join("\n") || "取得待ち";
    return {
      title: `#${index + 1} ${radarCallLabel(alert)} | $${alert.symbol}`,
      description: "Solana",
      color: 0xfacc15,
      fields: [
        { name: "最大上昇", value: formatGain(tracking.maxGainPercent), inline: true },
        { name: "MC推移", value: `${formatUsd(alert.notification?.marketCapUsd)} -> ${formatUsd(tracking.maxMarketCapUsd)}`, inline: true },
        { name: "通知時刻", value: compactDate(alert.notification?.notifiedAt || alert.savedAt), inline: true },
        { name: "Why Radar caught this", value: reasons },
        { name: "Community", value: formatReactionSummary(alert.reactions) },
        { name: "Verify", value: `[DexScreener](${links.dex}) / [gmgn](${links.gmgn}) / [Nansen](${links.nansen})` },
        { name: "次", value: `理由: \`/why ${alert.ca}\`\n深掘り: \`/flow ${alert.ca}\`` }
      ],
      footer: { text: "NFA / DYOR" }
    };
  });
}

function reasonLabel(reason) {
  const labels = {
    holder_concentration: "🏦 上位Holder集中",
    flow_outflow: "🌊 Flow流出寄り",
    bb_already_posted: "📢 bb内で既出",
    single_sm_trader: "👤 Smart Moneyが少ない",
    low_score: "📉 bb反応度未満",
    below_bb_score: "📉 bb反応度未満",
    market_weak: "📊 DEX状況が弱い"
  };
  return labels[reason] || reason;
}

export function formatRejectionsIntro(stats) {
  return [
    "**見送り候補**",
    "Radarは「数」より「精度」を優先します。",
    "条件を満たさない候補は、通知せず見送りとして記録します。"
  ].join("\n");
}

export function formatRejectionsEmbed(stats) {
  const topReasons = stats.scans?.topReasons || [];
  const recent = stats.scans?.recentRejected || [];
  const reasonLines = topReasons.length
    ? topReasons.map((item, index) => `${index + 1}. ${reasonLabel(item.reason)}: ${item.count}件`).join("\n")
    : "まだReject理由の記録がないよ。";
  const recentLines = recent.length
    ? recent.slice(0, 5).map((item, index) => {
        const reasons = (item.reasons || []).map(reasonLabel).join(" / ") || "条件未満";
        const state = (item.reasons || []).includes("bb_already_posted") ? "通知不要" : "👀 監視のみ";
        return `${index + 1}. $${item.symbol}\nScore: ${item.bbScore}/100\n理由: ${reasons}\n状態: ${state}`;
      }).join("\n\n")
    : "最近の見送り候補はないよ。";

  return {
    title: "見送り判断",
    color: 0xf97316,
    fields: [
      { name: "見送り理由ランキング", value: shortText(reasonLines, 900) },
      { name: "最近見送った候補", value: shortText(recentLines, 900) }
    ],
    footer: { text: "弱い候補を流さないこともRadarの価値です。" },
    timestamp: new Date().toISOString()
  };
}

export function formatStatsProduction(stats) {
  const lines = [
    "**bb Native Alpha Radar Stats**",
    "今日の見張り結果をまとめたよ。",
    "",
    "**今日の運用**",
    `・手動チェック: ${stats.todayManual}回`,
    `・自動通知: ${stats.todayAuto}/${config.maxDailyAlerts}件`,
    `・有効な検知履歴: ${stats.total}件`,
    `・全保存履歴: ${stats.rawTotal}件`,
    ""
  ];
  if (stats.best) {
    lines.push("**最高スコア**", `${radarCallLabel(stats.best)} / $${stats.best.symbol} / bb反応度 ${stats.best.bbScore}/100 / MC ${stats.best.marketCap}`, `CA: \`${stats.best.ca}\``, "");
  }
  if (stats.recent?.length) {
    lines.push("**直近候補**");
    stats.recent.slice(0, 5).forEach((alert, index) => {
      lines.push(`${index + 1}. ${radarCallLabel(alert)} / $${alert.symbol} / ${alert.bbScore}/100 / ${alert.marketCap}`);
    });
    lines.push("");
  }
  lines.push("**通知後トラッキング**", `・更新済み: ${stats.tracking.tracked}件`, `・6h完了: ${stats.tracking.completed}件`);
  if (stats.tracking.bestGain) {
    lines.push(`・最大上昇: $${stats.tracking.bestGain.symbol} / ${formatGain(stats.tracking.bestGain.tracking?.maxGainPercent)} / max ${formatUsd(stats.tracking.bestGain.tracking?.maxMarketCapUsd)}`);
  }
  if (stats.tracking.leaderboard?.length) {
    lines.push("", "**通知後成績 Top**");
    stats.tracking.leaderboard.slice(0, 5).forEach((alert, index) => {
      const tracking = alert.tracking || {};
      lines.push(`${index + 1}. ${radarCallLabel(alert)} / $${alert.symbol} / ${formatGain(tracking.maxGainPercent)} / 通知時 ${formatUsd(alert.notification?.marketCapUsd)} -> max ${formatUsd(tracking.maxMarketCapUsd)} / 現在 ${formatUsd(tracking.latestMarketCapUsd)} / ${formatReactionSummary(alert.reactions)}`);
    });
  }
  lines.push("", "**見送り精度**", `・Scan履歴: ${stats.scans?.total || 0}回 / 今日 ${stats.scans?.today || 0}回`, `・見送り記録: ${stats.scans?.rejectedTotal || 0}件`);
  if (stats.scans?.topReasons?.length) {
    lines.push(`・主な見送り理由: ${stats.scans.topReasons.map((item) => `${reasonLabel(item.reason)} ${item.count}件`).join(" / ")}`);
  }
  lines.push(
    "",
    "**見てほしい点**",
    "・大量通知じゃなく、低cap・若さ・Smart Money・holder集中・Nansen flowで絞っているよ",
    "・通知後のMC推移を保存して、後から検証できるようにしているよ",
    "・Nansen credits切れでもBotは落ちないよ。状態は `/health` で見てね",
    "",
    "※ 履歴はローカルの data/alerts.json / data/scans.json に保存しているよ。"
  );
  return lines.join("\n");
}

export function formatReportProduction(stats) {
  const lines = [
    "**bb Native Alpha Radar Report**",
    "",
    "**要約**",
    "CA投稿後に反応する価格Botではなく、Nansen Smart MoneyからCA投稿前のSolana lowcap候補を少数だけ拾うBotだよ。",
    "大量通知ではなく、bbで会話が始まりそうな候補だけを出して、通知後のMC推移まで保存するよ。",
    "",
    "**現在できること**",
    `・${config.alertIntervalMinutes}分ごとに自動Radar確認`,
    "・確認しても条件未満なら投稿しないから、チャンネルを荒らさないよ",
    `・1日最大${config.maxDailyAlerts}件、同じCAは${config.dedupeHours}時間再通知なし`,
    `・直近${config.bbLookbackMessages}件のbb投稿を見て、既出CAや$SYMBOLを見送ります`,
    "・/radar で手動チェックできるよ",
    "・/flow <CA> で深掘りするよ",
    "・/stats で通知後成績と見送り理由を見られるよ",
    "・/health でNansen REST API / CLI / Bot状態を確認できるよ",
    ""
  ];
  if (stats.tracking.leaderboard?.length) {
    lines.push("**通知後成績**");
    stats.tracking.leaderboard.slice(0, 3).forEach((alert, index) => {
      const tracking = alert.tracking || {};
      lines.push(`${index + 1}. ${radarCallLabel(alert)} / $${alert.symbol}: ${formatGain(tracking.maxGainPercent)} / 通知時 ${formatUsd(alert.notification?.marketCapUsd)} -> max ${formatUsd(tracking.maxMarketCapUsd)} / 現在 ${formatUsd(tracking.latestMarketCapUsd)} / ${formatReactionSummary(alert.reactions)}`);
    });
    lines.push("");
  }
  lines.push(
    "**Nansen活用箇所**",
    "・Nansen CLI: schema確認と要件の明示",
    "・Smart Money netflow: 候補抽出の中心",
    "・Smart Money DEX trades: 追加のSmart Money反応",
    "・Token Screener: lowcap候補の母集団",
    "・Token holders / Flow Intelligence: /flow深掘りとスコア補正",
    "",
    "**Radar Call system**",
    "・各通知に Radar Call ID を付けて、/why /flow /leaderboard /stats /report で同じ呼び名で追えるよ",
    "・通知後はCommunity reactionsとMC推移を保存して、Radar文化を作れるよ",
    "",
    "**差別化**",
    "・候補を多く並べるより、bbで今見る価値がある少数候補に絞るよ",
    "・holder集中やNansen flowが弱い候補は、見た目のflowが強くても減点するよ",
    "・/healthでNansen REST APIとCLIの状態を見せるよ。credits切れでもBotは落ちないよ",
    "・/statsと/reportで、通知後に本当に動いたかを確認できるよ",
    "",
    "**安全性と運用性**",
    "・API key / Discord tokenは.env管理",
    "・過剰権限なし",
    "・credits切れでもBotは落とさず、復旧後に再開するよ",
    "・投資助言ではない注意書きを常に表示するよ",
    "",
    "**採用価値**",
    "bbアルト部屋の日常導線に自然に入るよ。候補通知 -> /flow深掘り -> Nansen確認という流れで、Nansenの継続利用理由をDiscord内に作れるよ。",
    "",
    "※ 最終判断はDexScreener / gmgn / Nansenで確認してね。"
  );
  return lines.join("\n");
}

export function formatConfigWinning() {
  return [
    "**bb Native Alpha Radar Config**",
    "今の見張り設定だよ。",
    "",
    "対象チェーン: Solana",
    `Market Cap上限: ${formatUsd(config.marketCapMaxUsd)}`,
    `Token age上限: ${config.tokenAgeMaxDays}d`,
    `最小bb反応度: ${config.minBbScore}`,
    `Radar表示上限: ${config.radarDisplayLimit}件/scan`,
    `Smart Money traders最小: ${config.minSmartMoneyTraders}`,
    `自動通知上限: ${config.maxDailyAlerts}件/日`,
    `重複通知防止: ${config.dedupeHours}h`,
    `bb未投稿チェック: 直近${config.bbLookbackMessages}件`,
    `Radar確認間隔: ${config.alertIntervalMinutes}分`,
    `MC追跡間隔: ${config.trackingIntervalMinutes}分`,
    `Mock mode: ${config.mockMode ? "ON" : "OFF"}`,
    "",
    "運用思想: 大量通知ではなく、見る価値がある候補だけを少数表示するよ。",
    "※ APIキーやDiscord Tokenは表示しないよ。"
  ].join("\n");
}

export function formatCriteriaProduction() {
  return [
    "**bb Native Alpha Radar 抽出条件**",
    "どういう子を拾うか、条件をまとめるね。",
    "",
    "**対象**",
    "Solana lowcap meme候補だけを見るよ。",
    "",
    "**必須フィルタ**",
    `・時価総額: $${Math.round(config.marketCapMaxUsd / 1000)}K以下`,
    `・作成から: ${config.tokenAgeMaxDays}日以内`,
    `・Smart Money人数が${config.minSmartMoneyTraders}人以上、または24h流入がプラス`,
    `・直近${config.bbLookbackMessages}件の投稿に同じCAまたは$SYMBOLがない`,
    `・bb反応度${config.minBbScore}以上を通知対象`,
    "",
    "**bb反応度に入るもの**",
    "低cap、作成の若さ、Smart Money人数、24h流入、上位ホルダー集中、Nansen資金、CTO/Korea/CEX/SOL meme文脈、bb未投稿を見ているよ。",
    "",
    "※ 大量通知ではなく、見る価値がある候補だけを少数表示するよ。"
  ].join("\n");
}

export function formatHelpWinning() {
  return [
    "**bb Native Alpha Radar**",
    "",
    "CAが貼られる前のSolana meme初動を、Nansen Smart Moneyから先回りで見るRadar。",
    "Radar Callを追いながら、bbみんなで初動を検証するBotです。",
    "",
    "**Radar**",
    "`/radar` -> 最新Radar Callを見る",
    "`/why <CA>` -> なぜ拾ったか3秒で確認",
    "",
    "**Verify**",
    "`/flow <CA>` -> Smart Money / Holder / Flowを深掘り",
    "",
    "**Prove**",
    "`/leaderboard` -> 通知後に伸びたRadarを見る",
    "`/rejections` -> 見送った候補と理由を見る",
    "`/stats` -> 運用と追跡成績を見る",
    "`/report` -> 提出向けサマリーを見る",
    "",
    "**Community**",
    "🔥 強気 / 👀 監視 / ⚠️ 注意 / 💀 怪しい",
    "",
    "**System**",
    "`/health` / `/config` / `/criteria` / `/export`",
    "",
    "※ 投資助言ではありません。DexScreener / gmgn / Nansenで確認してください。"
  ].join("\n");
}

export function formatHealthProduction(status) {
  return [
    "**bb Native Alpha Radar Health**",
    "いまの体調チェックだよ。",
    "",
    `Bot: ${status.botOk ? "OK" : "NG"}`,
    `Nansen REST API: ${status.nansenOk ? "OK" : "NG"}${status.nansenMessage ? ` (${status.nansenMessage})` : ""}`,
    `Nansen CLI: ${status.nansenCliOk ? "OK" : "NG"} (${status.nansenCliCommand || "nansen schema --pretty"})`,
    `CLI detail: ${status.nansenCliMessage || "n/a"}`,
    `Mock mode: ${config.mockMode ? "ON" : "OFF"}`,
    `Guild ID: ${config.guildId ? "set" : "not set"}`,
    `Channel ID: ${config.alertChannelId ? "set" : "not set"}`,
    `最終Radar: ${status.lastRadarAt || "未実行"}`,
    `最終Radar結果: scanned ${status.lastScannedCount ?? "n/a"} / passed ${status.lastPassedCount ?? "n/a"} / rejected ${status.lastRejectedCount ?? "n/a"} / posted ${status.lastPostedCount ?? "n/a"}`,
    "次の見方: posted 0なら、Botは確認済みだけど投稿条件に届かなかったという意味だよ。",
    status.lastRadarErrors?.length ? `最終Radarエラー: ${shortText(status.lastRadarErrors.join(" / "), 260)}` : "最終Radarエラー: なし",
    `自動通知: 最大${config.maxDailyAlerts}件/日 / 重複${config.dedupeHours}h / 最小bb反応度${config.minBbScore}`,
    `bb未投稿チェック: 直近${config.bbLookbackMessages}件`,
    "",
    "※ APIキーやDiscord Tokenは表示しないよ。"
  ].join("\n");
}

function dailyReasonLabel(reason) {
  const labels = {
    holder_concentration: "上位Holder集中",
    flow_outflow: "Flow流出寄り",
    bb_already_posted: "bb内で既出",
    single_sm_trader: "Smart Moneyが少ない",
    low_score: "bb反応度未満",
    below_bb_score: "bb反応度未満",
    market_weak: "DEX状況が弱い"
  };
  return labels[reason] || reason || "記録なし";
}

function dailyReactionLine(reactions = {}) {
  return `🔥 ${Number(reactions.fire || 0)} / 👀 ${Number(reactions.eyes || 0)} / ⚠️ ${Number(reactions.warning || 0)} / 💀 ${Number(reactions.skull || 0)}`;
}

function dailyBestRadarLine(alert) {
  if (!alert) return "今日はまだ記録なし";
  const gain = formatGain(alert.tracking?.maxGainPercent || 0);
  return `$${alert.symbol} ${gain} / 通知時 ${formatUsd(alert.notification?.marketCapUsd)} -> max ${formatUsd(alert.tracking?.maxMarketCapUsd)}`;
}

function dailyCommentary(stats) {
  const today = stats.today || {};
  const topReason = dailyReasonLabel(today.topRejectReason?.reason);
  const best = today.bestRadar;
  if (!today.radarCalls && !today.rejected) {
    return "今日はまだRadarの記録が少ないよ。まずは /radar で今の候補を確認してね。";
  }
  if (today.strongCandidates === 0) {
    return `今日は強いRadar候補は少なめ。${topReason !== "記録なし" ? `${topReason} が多く、` : ""}無理に流さず精度優先で見送っているよ。`;
  }
  if (best?.tracking?.maxGainPercent > 0) {
    return `今日は $${best.symbol} が通知後に ${formatGain(best.tracking.maxGainPercent)}。伸びた理由は /leaderboard、拾った根拠は /why で確認できるよ。`;
  }
  return "今日はRadar Callが出ているけど、追跡結果はまだ途中だよ。/leaderboard で通知後の動きを見てね。";
}

export function formatDailyStatsContent(stats) {
  const today = stats.today || {};
  const topReject = today.topRejectReason
    ? `${dailyReasonLabel(today.topRejectReason.reason)} ${today.topRejectReason.count}件`
    : "今日はまだ記録なし";
  return [
    "**今日のRadarまとめ**",
    "Radarの1日を短く振り返る日報だよ。",
    "",
    `Radar Calls: ${today.radarCalls || 0}`,
    `Strong candidates: ${today.strongCandidates || 0}`,
    `見送り: ${today.rejected || 0}`,
    `Best Radar: ${dailyBestRadarLine(today.bestRadar)}`,
    `Top Reject Reason: ${topReject}`,
    `Community: ${dailyReactionLine(today.reactions)}`,
    "",
    `今日の所感: ${dailyCommentary(stats)}`,
    "",
    "次に見る場所:",
    "・/leaderboard -> 伸びたRadar",
    "・/rejections -> 見送った理由",
    "・/radar -> 最新候補",
    "",
    "NFA / DYOR"
  ].join("\n");
}

export function formatDailyStatsEmbed(stats) {
  const today = stats.today || {};
  const topRejectLines = today.topRejectReasons?.length
    ? today.topRejectReasons.slice(0, 3).map((item) => `${dailyReasonLabel(item.reason)}: ${item.count}件`).join("\n")
    : "今日はまだ記録なし";
  const best = today.bestRadar;
  return {
    title: "今日のRadar日報",
    description: "数ではなく、見送る判断と伸びたRadarを振り返る画面だよ。",
    color: 0x38bdf8,
    fields: [
      { name: "Radar Calls", value: String(today.radarCalls || 0), inline: true },
      { name: "Strong candidates", value: String(today.strongCandidates || 0), inline: true },
      { name: "見送り", value: String(today.rejected || 0), inline: true },
      { name: "Best Radar", value: dailyBestRadarLine(best) },
      { name: "Top Reject Reason", value: topRejectLines, inline: true },
      { name: "Community", value: dailyReactionLine(today.reactions), inline: true },
      { name: "今日の所感", value: dailyCommentary(stats) },
      { name: "次に見る場所", value: "`/leaderboard` 伸びたRadar\n`/rejections` 見送った理由\n`/radar` 最新候補" }
    ],
    footer: { text: "NFA / DYOR | 詳細は /leaderboard / rejections / flow で確認" },
    timestamp: new Date().toISOString()
  };
}

export function formatHelpDaily() {
  return [
    "**bb Native Alpha Radar**",
    "",
    "CAが貼られる前のSolana meme初動を、Nansen Smart Moneyから先回りで見るRadar。",
    "Radar Callを追いながら、bbみんなで初動を検証するBotです。",
    "",
    "**Radar**",
    "`/radar` -> 最新Radar Callを見る",
    "`/why <CA>` -> なぜ拾ったか3秒で確認",
    "",
    "**Verify**",
    "`/flow <CA>` -> Smart Money / Holder / Flowを深掘り",
    "",
    "**Prove**",
    "`/leaderboard` -> 通知後に伸びたRadarを見る",
    "`/rejections` -> 見送った候補と理由を見る",
    "`/stats` -> 今日のRadar日報を見る",
    "`/report` -> 提出向けサマリーを見る",
    "",
    "**Community**",
    "🔥 強気 / 👀 監視 / ⚠️ 注意 / 💀 怪しい",
    "",
    "**System**",
    "`/health` / `/config` / `/criteria` / `/export`",
    "",
    "※ 投資助言ではありません。DexScreener / gmgn / Nansenで確認してください。"
  ].join("\n");
}

export function formatReportDaily(stats) {
  const today = stats.today || {};
  const topReject = today.topRejectReason
    ? `${dailyReasonLabel(today.topRejectReason.reason)} ${today.topRejectReason.count}件`
    : "記録なし";
  return [
    "**bb Native Alpha Radar Report**",
    "",
    "**要約**",
    "CA投稿後の価格Botではなく、Nansen Smart MoneyからCA投稿前のSolana lowcap候補を少数だけ拾うRadarです。",
    "通知後のMC推移、見送り理由、Community reactionsを残し、Radar -> Verify -> Prove -> Community の流れを作ります。",
    "",
    "**今日のRadar日報**",
    `・Radar Calls: ${today.radarCalls || 0}`,
    `・Strong candidates: ${today.strongCandidates || 0}`,
    `・見送り: ${today.rejected || 0}`,
    `・Best Radar: ${dailyBestRadarLine(today.bestRadar)}`,
    `・Top Reject Reason: ${topReject}`,
    `・Community: ${dailyReactionLine(today.reactions)}`,
    "",
    "**役割分担**",
    "・/radar: 今見る候補",
    "・/why: なぜ拾ったか",
    "・/flow: 深掘り",
    "・/leaderboard: 通知後に伸びた実績の詳細",
    "・/rejections: 見送り判断の詳細",
    "・/stats: 今日のRadar日報",
    "・/report: 審査提出向けサマリー",
    "",
    "**Nansen活用箇所**",
    "・Nansen CLI: schema確認と審査要件の明示",
    "・Smart Money netflow: 候補抽出の中心",
    "・Smart Money DEX trades: 追加のSmart Money反応",
    "・Token Screener: lowcap候補の母集団",
    "・Token holders / Flow Intelligence: /flow深掘りとスコア補正",
    "",
    "**Daily Summary**",
    "DAILY_SUMMARY_ENABLED=true の時、1日1回だけ今日のRadarまとめをDiscordに投稿します。",
    "同じ日の二重投稿は data/daily-summary.json で防ぎます。",
    "",
    "※ 最終判断はDexScreener / gmgn / Nansenで確認してください。"
  ].join("\n");
}

export function formatConfigDaily() {
  return [
    "**bb Native Alpha Radar Config**",
    "",
    "対象チェーン: Solana",
    `Market Cap上限: ${formatUsd(config.marketCapMaxUsd)}`,
    `Token age上限: ${config.tokenAgeMaxDays}d`,
    `最小bb反応度: ${config.minBbScore}`,
    `Radar表示上限: ${config.radarDisplayLimit}件/scan`,
    `Smart Money traders最小: ${config.minSmartMoneyTraders}`,
    `自動通知上限: ${config.maxDailyAlerts}件/日`,
    `重複通知防止: ${config.dedupeHours}h`,
    `bb未投稿チェック: 直近${config.bbLookbackMessages}件`,
    `Radar確認間隔: ${config.alertIntervalMinutes}分`,
    `MC追跡間隔: ${config.trackingIntervalMinutes}分`,
    `Daily summary: ${config.dailySummaryEnabled ? "ON" : "OFF"}`,
    `Daily summary時刻: ${String(config.dailySummaryHour).padStart(2, "0")}:${String(config.dailySummaryMinute).padStart(2, "0")} ${config.dailySummaryTimezone}`,
    `Mock mode: ${config.mockMode ? "ON" : "OFF"}`,
    "",
    "※ APIキーやDiscord Tokenは表示しません。"
  ].join("\n");
}
