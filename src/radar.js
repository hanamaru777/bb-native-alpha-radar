import { config } from "./config.js";
import {
  getFlowIntelligence,
  getSolanaSmartMoneyDexTrades,
  getSolanaSmartMoneyNetflow,
  getSolanaTokenScreener,
  getTokenHolders,
  toCandidate
} from "./nansen.js";

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
    metrics: { netflow24hUsd: 5700, tokenAgeDays: 1, traderCount: 4, dexTradeMatches: 2 }
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
    metrics: { netflow24hUsd: 4100, tokenAgeDays: 1, traderCount: 3, dexTradeMatches: 1 }
  }
];

let mockIndex = 0;

function uniqueByCa(candidates) {
  const seen = new Set();
  const result = [];
  for (const candidate of candidates) {
    const key = candidate.ca.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
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
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isUnsafeForPublicChannel(candidate) {
  const text = getCandidateSafetyText(candidate);
  const blocked = [
    "scam",
    "rug",
    "honeypot",
    "drain",
    "hack",
    "nigga",
    "nigger",
    "faggot",
    "retard",
    "rape",
    "nazi",
    "hitler",
    "kkk",
    "porn",
    "sex",
    "xxx",
    "hentai",
    "onlyfans",
    "fuck"
  ];
  return blocked.some((word) => text.includes(word));
}

export async function scanAlphaCandidates() {
  if (config.mockMode || !config.nansenApiKey) {
    const rotated = [
      mockCandidates[mockIndex % mockCandidates.length],
      mockCandidates[(mockIndex + 1) % mockCandidates.length]
    ];
    mockIndex += 1;
    return rotated.map((candidate) => ({
      ...candidate,
      detectedAt: new Date().toISOString(),
      source: "mock"
    }));
  }

  const [netflows, dexTrades, screenerTokens] = await Promise.all([
    getSolanaSmartMoneyNetflow(25),
    getSolanaSmartMoneyDexTrades(60),
    getSolanaTokenScreener(80)
  ]);

  const rows = [...netflows, ...screenerTokens];
  const baseCandidates = uniqueByCa(rows.map((row) => toCandidate(row, dexTrades)))
    .filter((candidate) => candidate.symbol !== "UNKNOWN")
    .filter((candidate) => !candidate.ca.endsWith("address-not-returned"))
    .filter((candidate) => !isUnsafeForPublicChannel(candidate))
    .filter((candidate) => {
      const metrics = candidate.metrics || {};
      const lowEnough = !metrics.marketCapUsd || metrics.marketCapUsd <= config.marketCapMaxUsd;
      const hasFlow = (metrics.netflow24hUsd || 0) > 0 || (metrics.traderCount || 0) >= config.minSmartMoneyTraders;
      const hasAge = Number.isFinite(metrics.tokenAgeDays) && metrics.tokenAgeDays > 0;
      const freshEnough = hasAge && metrics.tokenAgeDays <= config.tokenAgeMaxDays;
      return lowEnough && hasFlow && freshEnough;
    })
    .sort((a, b) => {
      const scoreDiff = b.bbScore - a.bbScore;
      if (scoreDiff !== 0) return scoreDiff;
      const bFlow = Number(b.metrics?.netflow24hUsd || 0);
      const aFlow = Number(a.metrics?.netflow24hUsd || 0);
      return bFlow - aFlow;
    })
    .slice(0, 8);

  const enrichedCandidates = await Promise.all(baseCandidates.map(enrichRadarCandidate));
  return enrichedCandidates
    .filter((candidate) => candidate.bbScore >= config.minBbScore)
    .sort((a, b) => {
      const scoreDiff = b.bbScore - a.bbScore;
      if (scoreDiff !== 0) return scoreDiff;
      const bFlow = Number(b.metrics?.netflow24hUsd || 0);
      const aFlow = Number(a.metrics?.netflow24hUsd || 0);
      return bFlow - aFlow;
    })
    .slice(0, 5);
}

async function enrichRadarCandidate(candidate) {
  try {
    const [holders, flow] = await Promise.all([
      getTokenHolders("solana", candidate.ca, 20),
      getFlowIntelligence("solana", candidate.ca, "1d")
    ]);
    return applyNansenQualityAdjustments(candidate, summarizeHolders(holders), summarizeFlowIntelligence(flow));
  } catch (error) {
    return {
      ...candidate,
      metrics: {
        ...(candidate.metrics || {}),
        enrichmentError: error.message
      }
    };
  }
}

function applyNansenQualityAdjustments(candidate, holders, flow) {
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
    ? flow.netflowUsd > 0
      ? 6
      : flow.netflowUsd < 0
        ? -10
        : 0
    : 0;
  const singleSmHolderPenalty = sm <= 1 && holderPenalty > 0 ? 12 : 0;
  const confidenceCap = Number.isFinite(scoreBreakdown.confidenceCap) ? scoreBreakdown.confidenceCap : 95;
  const adjustedScore = Math.max(25, Math.min(confidenceCap, candidate.bbScore + flowAdjustment - holderPenalty - singleSmHolderPenalty));
  const holderHighRisk = sm <= 1 && holderPenalty >= 20;
  const holderLine = `holders top1 ${Number.isFinite(top1) ? `${top1.toFixed(1)}%` : "n/a"} / top5 ${Number.isFinite(top5) ? `${top5.toFixed(1)}%` : "n/a"}`;
  const flowLine = Number.isFinite(flow.netflowUsd) ? `Nansen flow ${formatUsd(flow.netflowUsd)}` : "Nansen flow n/a";
  const cautionAdd = holderPenalty > 0
    ? ` 上位ホルダー集中に注意。${holderLine}。`
    : ` ${holderLine}。`;

  return {
    ...candidate,
    bbScore: adjustedScore,
    caution: `${candidate.caution}${cautionAdd}`,
    reason: `${candidate.reason} / ${flowLine}`,
    nansenDeepDive: {
      ...(candidate.nansenDeepDive || {}),
      holders,
      flow
    },
    metrics: {
      ...metrics,
      holderPenalty,
      flowAdjustment,
      singleSmHolderPenalty,
      holderHighRisk,
      scoreBreakdown: {
        ...scoreBreakdown,
        holderPenalty,
        flowAdjustment,
        singleSmHolderPenalty
      }
    }
  };
}

export async function analyzeTokenFlow(ca) {
  if (config.mockMode || !config.nansenApiKey) return null;

  const [holders, flow] = await Promise.all([
    getTokenHolders("solana", ca, 20),
    getFlowIntelligence("solana", ca, "1d")
  ]);

  const holderSummary = summarizeHolders(holders);
  const flowSummary = summarizeFlowIntelligence(flow);

  return {
    symbol: "NANSEN",
    ca,
    marketCap: "Nansen分析",
    smartMoneyInflows: "Nansen API",
    newWalletGrowth: `${holderSummary.rowCount} holder rows`,
    bbScore: "分析中",
    reason: `Token holders ${holderSummary.rowCount}件とFlow Intelligenceを取得しました。`,
    caution: flowSummary.summary,
    nansenDeepDive: {
      holders: holderSummary,
      flow: flowSummary
    }
  };
}

function findNumberDeep(value, keyHints, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return null;
  if (typeof value !== "object") return null;

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
    { key: "smart", label: "Smart Money系", words: ["smart", "smart money", "sm "] },
    { key: "whale", label: "whale系", words: ["whale", "large holder"] },
    { key: "fund", label: "fund/VC系", words: ["fund", "vc", "capital", "ventures", "labs"] },
    { key: "cex", label: "CEX/取引所系", words: ["binance", "coinbase", "okx", "bybit", "kucoin", "exchange", "cex"] },
    { key: "degen", label: "degen/trader系", words: ["degen", "trader", "meme", "pump"] }
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
    Number.isFinite(inflowUsd) && Number.isFinite(outflowUsd)
      ? inflowUsd - outflowUsd
      : null
  );

  const bias = inferredNetflowUsd === null
    ? "未判定"
    : inferredNetflowUsd > 0
      ? "流入優勢"
      : inferredNetflowUsd < 0
        ? "流出優勢"
        : "中立";

  return {
    inflowUsd,
    outflowUsd,
    netflowUsd: inferredNetflowUsd,
    bias,
    summary: `Flow Intelligence: ${bias}${inferredNetflowUsd === null ? "" : ` / net ${formatUsd(inferredNetflowUsd)}`}`
  };
}

function formatUsd(value) {
  if (value === null || value === undefined || value === "") return "n/a";
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  if (Math.abs(number) >= 1_000_000) return `$${(number / 1_000_000).toFixed(2)}M`;
  if (Math.abs(number) >= 1_000) return `$${(number / 1_000).toFixed(1)}K`;
  return `$${Math.round(number).toLocaleString()}`;
}

function formatGain(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  return `${number >= 0 ? "+" : ""}${number}%`;
}

function metricLine(candidate) {
  const metrics = candidate.metrics || {};
  const age = metrics.tokenAgeDays ? `${metrics.tokenAgeDays.toFixed(metrics.tokenAgeDays < 10 ? 1 : 0)}d` : "n/a";
  const netflow = Number.isFinite(metrics.netflow24hUsd) ? `$${Math.round(metrics.netflow24hUsd).toLocaleString()}` : "n/a";
  return `MC ${candidate.marketCap} | SM ${candidate.smartMoneyInflows} | 24h flow ${netflow} | age ${age}`;
}

function scoreColor(score) {
  const number = Number(score || 0);
  if (number >= 90) return 0x37d67a;
  if (number >= 80) return 0xf5c542;
  return 0x7aa2ff;
}

function shortText(value, max = 900) {
  const text = String(value || "n/a");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function candidateFields(candidate) {
  const metrics = candidate.metrics || {};
  const age = metrics.tokenAgeDays ? `${metrics.tokenAgeDays.toFixed(metrics.tokenAgeDays < 10 ? 1 : 0)}d` : "n/a";
  const netflow = Number.isFinite(metrics.netflow24hUsd) ? formatUsd(metrics.netflow24hUsd) : "n/a";
  const sm = Number(candidate.smartMoneyInflows || metrics.traderCount || 0);
  const score = metrics.scoreBreakdown || {};
  const signalQuality = sm >= 10
    ? "強い: SM 10人以上"
    : sm >= 3
      ? "中: 複数SMが反応"
      : "監視: flow先行 / SM少なめ";
  const scoreParts = Number.isFinite(score.confidenceCap)
    ? `低cap +${score.lowCapBonus} / 若さ +${score.youngTokenBonus} / flow +${score.flowScore} / SM +${score.smScore} / holders -${score.holderPenalty || 0} / FI ${score.flowAdjustment || 0} / 上限 ${score.confidenceCap}`
    : "低cap・若さ・SM流入・24h flowを合成";
  return [
    { name: "MC", value: candidate.marketCap || "n/a", inline: true },
    { name: "SM", value: String(candidate.smartMoneyInflows || metrics.traderCount || "n/a"), inline: true },
    { name: "24h flow", value: netflow, inline: true },
    { name: "age", value: age, inline: true },
    { name: "bb反応度", value: `${candidate.bbScore}/100`, inline: true },
    { name: "根拠強度", value: signalQuality, inline: true },
    { name: "スコア内訳", value: scoreParts },
    { name: "CA", value: `\`${candidate.ca}\`` },
    { name: "見る理由", value: shortText(candidate.reason, 500) },
    { name: "警戒点", value: shortText(candidate.caution, 500) }
  ];
}

function flowJudge(candidate) {
  const metrics = candidate.metrics || {};
  const holders = candidate.nansenDeepDive?.holders || null;
  const flow = candidate.nansenDeepDive?.flow || null;
  const sm = Number(candidate.smartMoneyInflows || metrics.traderCount || 0);
  const score = Number(candidate.bbScore || 0);
  const netflow = Number(metrics.netflow24hUsd || 0);
  const age = Number(metrics.tokenAgeDays || 0);
  const mcap = Number(metrics.marketCapUsd || 0);
  const dexMatches = Number(metrics.dexTradeMatches || 0);

  const driver = sm >= 10
    ? holders?.labels?.detected?.length
      ? `Smart Money主導が強め / ${holders.labels.summary}`
      : "Smart Money主導が強め"
    : sm >= 3
      ? "初期degen + Smart Money反応"
      : "まだ薄い初期反応";

  const stage = age > 0 && age <= 3 && mcap > 0 && mcap <= 250000
    ? "初動寄り"
    : age > 7 || mcap > 400000
      ? "回転・継続監視寄り"
      : "初動から拡散前の中間";

  const pressure = flow?.bias === "流入優勢"
    ? "Nansen Flowは流入優勢"
    : flow?.bias === "流出優勢"
      ? "Nansen Flowは流出優勢。買い圧より出口確認を優先"
      : netflow > 5000 && sm >= 5
    ? "買い圧は強め"
    : netflow > 0
      ? "買い圧は確認できるが継続確認"
      : "買い圧は弱め";

  const holderRisk = holders?.concentration === "集中高め"
    ? "上位ホルダー集中が高め。売り圧と分散状況を強めに確認"
    : holders?.concentration === "やや集中"
      ? "上位ホルダーはやや集中。上位売りを確認"
      : "";
  const baseRisk = mcap > 400000
    ? "MCが上限に近いので出口速度に注意"
    : dexMatches === 0
      ? "板・出来高・上位ホルダー売りを要確認"
      : "低capなので板・出来高・上位ホルダー売りを確認";
  const risk = holderRisk || baseRisk;

  const verdict = flow?.bias === "流出優勢"
    ? "条件は見えるが、Nansen Flowは流出寄り。無理に入らず再確認向き。"
    : holders?.concentration === "集中高め"
      ? "bb候補ではあるが、上位ホルダー集中が重い。板と売りを先に確認。"
      : score >= 90
    ? "bb初動候補。まず見る価値あり。"
    : score >= 75
      ? "Watch候補。条件は良いが確認必須。"
      : "弱めの候補。無理に触らず監視向き。";

  return { driver, stage, pressure, risk, verdict };
}

function linksFor(candidate) {
  const ca = encodeURIComponent(candidate.ca);
  return {
    dex: `https://dexscreener.com/solana/${ca}`,
    gmgn: `https://gmgn.ai/sol/token/${ca}`,
    nansen: `https://app.nansen.ai/token-god-mode?chain=solana&token_address=${ca}`
  };
}

export function formatRadarButtons(candidates) {
  return candidates.slice(0, 5).map((candidate, index) => {
    const links = linksFor(candidate);
    const n = index + 1;
    return {
      type: 1,
      components: [
        { type: 2, style: 5, label: `${n} Dex`, url: links.dex },
        { type: 2, style: 5, label: `${n} gmgn`, url: links.gmgn },
        { type: 2, style: 5, label: `${n} Nansen`, url: links.nansen }
      ]
    };
  });
}

export function formatRadarReport(candidates) {
  if (!candidates.length) {
    return [
      "🚨 **bb Native Alpha Radar**",
      "",
      "今の条件では候補がありませんでした。",
      "条件は `/criteria`、使い方は `/help` で確認できます。"
    ].join("\n");
  }

  const lines = [
    "🚨 **bb Native Alpha Radar**",
    "",
    "Nansen Smart Money / lowcap Solana radar",
    "CAが貼られる前に見る候補だけを短く出します。",
    `bb反応度 = 低cap感、${config.tokenAgeMaxDays}日以内の若さ、SM流入、24h flowを合成した独自スコア。`,
    `Filter: Solana / MC <= $${Math.round(config.marketCapMaxUsd / 1000)}K / age <= ${config.tokenAgeMaxDays}d / SM flow or SM traders / scam系除外`,
    ""
  ];

  candidates.forEach((candidate, index) => {
    lines.push(
      `**${index + 1}. $${candidate.symbol}**  bb反応度 ${candidate.bbScore}/100`,
      metricLine(candidate),
      `CA: \`${candidate.ca}\``,
      `見る理由: ${candidate.reason}`,
      `警戒点: ${candidate.caution}`,
      `Links: ${index + 1} Dex / ${index + 1} gmgn / ${index + 1} Nansen`,
      ""
    );
  });

  lines.push("※ 投資助言ではありません。最終判断はDexScreener/gmgn/Nansenで確認してください。");
  lines.push("※ Nansenの最新データを毎回取得するため、表示候補は実行タイミングで変わります。");
  lines.push("※ 上位ホルダー濃度とFlow Intelligenceは `/flow <CA>` で確認できます。");
  lines.push("※ ボタン番号は候補番号に対応しています。気になるCAは `/flow <CA>`。");
  return lines.join("\n");
}

export function formatRadarCardIntro(candidates) {
  if (!candidates.length) {
    return [
      "🚨 **bb Native Alpha Radar**",
      "今の条件では候補がありませんでした。`/criteria` で抽出条件を確認できます。"
    ].join("\n");
  }

  return [
    "🚨 **bb Native Alpha Radar**",
    `Nansen Smart Moneyから ${candidates.length} 件のSolana lowcap候補を検出`,
    `Filter: MC <= $${Math.round(config.marketCapMaxUsd / 1000)}K / age <= ${config.tokenAgeMaxDays}d / SM flowまたはSM traders`,
    "詳細確認は各カード下のボタン、深掘りは `/flow <CA>`。"
  ].join("\n");
}

export function formatRadarEmbeds(candidates) {
  if (!candidates.length) return [];

  return candidates.slice(0, 5).map((candidate, index) => ({
    title: `${index + 1}. $${candidate.symbol} | bb反応度 ${candidate.bbScore}/100`,
    color: scoreColor(candidate.bbScore),
    fields: candidateFields(candidate),
    footer: {
      text: "Not financial advice | Verify with DexScreener / gmgn / Nansen"
    },
    timestamp: new Date().toISOString()
  }));
}

export function formatCriteria() {
  return [
    "📋 **bb Native Alpha Radar 抽出条件**",
    "",
    "**対象**",
    "Solana lowcap meme候補のみ。",
    "",
    "**必須フィルタ**",
    `・Market Cap: $${Math.round(config.marketCapMaxUsd / 1000)}K以下`,
    `・Token age: ${config.tokenAgeMaxDays}日以内`,
    `・24h Smart Money netflowがプラス、またはSmart Money tradersが${config.minSmartMoneyTraders}以上`,
    "・表示前に上位候補だけNansen holders / Flow Intelligenceを追加確認",
    "・上位ホルダー集中やNansen flowは除外ではなくbb反応度に減点/加点で反映",
    "・SCAM / RUG / HONEYPOT / DRAIN / HACK / 不適切・NSFW系のシンボルは除外",
    `・bb反応度: ${config.minBbScore}以上をRadar表示・自動通知対象`,
    `・重複通知: ${config.dedupeHours}時間以内は同じCAを再通知しない`,
    `・通知上限: 1日最大${config.maxDailyAlerts}件`,
    "",
    "**bb反応度**",
    "低cap感、若さ、Smart Money流入、24h flow、上位ホルダー集中、Nansen Flow Intelligenceを合成した独自スコアです。",
    "",
    "**思想**",
    "大量通知ではなく、bbアルト部屋でCAが貼られる前に見る価値がありそうな候補だけを少数表示します。",
    "",
    "※ 投資助言ではありません。最終判断はDexScreener/gmgn/Nansenで確認してください。"
  ].join("\n");
}

export function formatHelp() {
  return [
    "🧭 **bb Native Alpha Radar Help**",
    "",
    "**/radar**",
    "Nansen Smart Moneyデータから、今見るべきSolana lowcap候補を表示します。",
    "",
    "**/flow <CA>**",
    "気になったCAを指定して、通知履歴またはNansen APIから簡易フロー分析を返します。",
    "",
    "**/criteria**",
    "抽出条件とbb反応度の意味を表示します。",
    "",
    "**/stats**",
    "通知履歴、追跡状況、通知後成績を表示します。",
    "",
    "**/report**",
    "READMEや提出コメントに貼れる短い実績レポートを表示します。",
    "",
    "**/config**",
    "現在の検知条件と通知設定を表示します。",
    "",
    "**/export**",
    "GitHub提出用の `REPORT.md` を最新成績で生成します。",
    "",
    "**自動通知**",
    `Botを起動したままにすると、${config.alertIntervalMinutes}分ごとにRadarを確認します。`,
    `同じCAは${config.dedupeHours}時間以内は再通知せず、1日最大${config.maxDailyAlerts}件までです。`,
    "",
    "※ 投資助言ではありません。必ず自分で確認してください。"
  ].join("\n");
}

export function formatStats(stats) {
  const lines = [
    "📈 **bb Native Alpha Radar Stats**",
    "",
    `有効な検知履歴: ${stats.total}件`,
    `全保存履歴: ${stats.rawTotal}件`,
    `今日の手動チェック: ${stats.todayManual}件`,
    `今日の自動通知: ${stats.todayAuto}/${config.maxDailyAlerts}件`,
    ""
  ];

  if (stats.best) {
    lines.push(
      "**最高スコア**",
      `$${stats.best.symbol} / bb反応度 ${stats.best.bbScore}/100 / MC ${stats.best.marketCap}`,
      `CA: \`${stats.best.ca}\``,
      ""
    );
  }

  if (stats.recent.length > 0) {
    lines.push("**直近候補**");
    stats.recent.forEach((alert, index) => {
      lines.push(`${index + 1}. $${alert.symbol} / score ${alert.bbScore}/100 / ${alert.marketCap}`);
    });
  } else {
    lines.push("まだ通知履歴がありません。`/radar` を実行すると履歴が保存されます。");
  }

  lines.push(
    "",
    "**追跡状況**",
    `更新済み: ${stats.tracking.tracked}件 / 6h完了: ${stats.tracking.completed}件`
  );

  if (stats.tracking.bestGain) {
    const bestGain = stats.tracking.bestGain;
    lines.push(
      `最大上昇: $${bestGain.symbol} / ${formatGain(bestGain.tracking?.maxGainPercent)} / max ${formatUsd(bestGain.tracking?.maxMarketCapUsd)}`
    );
  }

  if (stats.tracking.leaderboard.length > 0) {
    lines.push("", "**通知後成績**");
    stats.tracking.leaderboard.forEach((alert, index) => {
      const tracking = alert.tracking || {};
      lines.push(
        `${index + 1}. $${alert.symbol} / ${formatGain(tracking.maxGainPercent)} / 通知時 ${formatUsd(alert.notification?.marketCapUsd)} → max ${formatUsd(tracking.maxMarketCapUsd)} / 現在 ${formatUsd(tracking.latestMarketCapUsd)}`
      );
    });
  }

  lines.push("", "※ 履歴はローカルの data/alerts.json に保存されています。");
  lines.push("※ statsは現在のRadar条件を満たす履歴だけを集計します。");
  lines.push("※ 手動チェックは `/radar` 実行分、自動通知はBotが時間で投稿した分です。");
  lines.push(`※ Bot起動中は${config.trackingIntervalMinutes}分ごとにMC推移を確認します。`);
  return lines.join("\n");
}

export function formatReport(stats) {
  const lines = [
    "📝 **bb Native Alpha Radar Report**",
    "",
    "Nansen Smart Moneyデータから、bbアルト部屋でCAが貼られる前に見る候補を抽出するSolana lowcap radarです。",
    "",
    "**現在の実績**",
    `・有効な検知履歴: ${stats.total}件`,
    `・追跡済み: ${stats.tracking.tracked}件`,
    `・6h追跡完了: ${stats.tracking.completed}件`,
    `・今日の自動通知: ${stats.todayAuto}/${config.maxDailyAlerts}件`,
    ""
  ];

  if (stats.tracking.leaderboard.length > 0) {
    lines.push("**通知後成績 Top**");
    stats.tracking.leaderboard.slice(0, 3).forEach((alert, index) => {
      const tracking = alert.tracking || {};
      lines.push(
        `${index + 1}. $${alert.symbol}: ${formatGain(tracking.maxGainPercent)} / 通知時 ${formatUsd(alert.notification?.marketCapUsd)} → max ${formatUsd(tracking.maxMarketCapUsd)} / 現在 ${formatUsd(tracking.latestMarketCapUsd)}`
      );
    });
    lines.push("");
  }

  lines.push(
    "**Nansenを使っている箇所**",
    "・Smart Money netflow",
    "・Smart Money DEX trades",
    "・Token Screener",
    "・Token holders / Flow Intelligence（/flow深掘り）",
    "",
    "**MVPで重視していること**",
    "・大量通知ではなく少数候補",
    "・なぜ拾ったかを短く表示",
    "・通知後のMC推移を保存",
    "・DexScreener / gmgn / Nansenへの確認導線",
    "",
    "※ 投資助言ではありません。最終判断はDexScreener/gmgn/Nansenで確認してください。"
  );

  return lines.join("\n");
}

export function formatConfigSummary() {
  return [
    "⚙️ **bb Native Alpha Radar Config**",
    "",
    `対象チェーン: Solana`,
    `Market Cap上限: ${formatUsd(config.marketCapMaxUsd)}`,
    `Token age上限: ${config.tokenAgeMaxDays}d`,
    `最小bb反応度: ${config.minBbScore}`,
    `Smart Money traders最小: ${config.minSmartMoneyTraders}`,
    `自動通知上限: ${config.maxDailyAlerts}件/日`,
    `重複通知防止: ${config.dedupeHours}h`,
    `Radar確認間隔: ${config.alertIntervalMinutes}分`,
    `MC追跡間隔: ${config.trackingIntervalMinutes}分`,
    `Mock mode: ${config.mockMode ? "ON" : "OFF"}`,
    "",
    "※ APIキーやDiscord Tokenは表示しません。"
  ].join("\n");
}

export function formatFlowAnalysis(candidate) {
  const metrics = candidate.metrics || {};
  const tracking = candidate.tracking || {};
  const deepDive = candidate.nansenDeepDive || {};
  const holders = deepDive.holders || null;
  const flow = deepDive.flow || null;
  const judge = flowJudge(candidate);
  const age = metrics.tokenAgeDays ? `${metrics.tokenAgeDays.toFixed(metrics.tokenAgeDays < 10 ? 1 : 0)}d` : "n/a";
  const mcap = candidate.marketCap || formatUsd(metrics.marketCapUsd);
  const netflow = formatUsd(metrics.netflow24hUsd);
  const sm = candidate.smartMoneyInflows || metrics.traderCount || "n/a";
  const trackingLines = Number.isFinite(Number(tracking.latestMarketCapUsd))
    ? [
        "",
        "**通知後トラッキング**",
        `現在MC: ${formatUsd(tracking.latestMarketCapUsd)}`,
        `最大MC: ${formatUsd(tracking.maxMarketCapUsd)} / 最大上昇: ${formatGain(tracking.maxGainPercent)}`,
        `1h: ${formatUsd(tracking.after1hMarketCapUsd)} / 3h: ${formatUsd(tracking.after3hMarketCapUsd)} / 6h: ${formatUsd(tracking.after6hMarketCapUsd)}`
      ]
    : [];
  const nansenDeepDiveLines = holders || flow
    ? [
        "",
        "**Nansen深掘り**",
        holders
          ? `・上位ホルダー: ${holders.concentration} / top1 ${holders.top1Percent === null ? "n/a" : `${holders.top1Percent.toFixed(1)}%`} / top5 ${holders.top5Percent === null ? "n/a" : `${holders.top5Percent.toFixed(1)}%`}`
          : "・上位ホルダー: n/a",
        holders?.labels
          ? `・ウォレットラベル: ${holders.labels.summary}`
          : "・ウォレットラベル: n/a",
        flow
          ? `・Flow Intelligence: ${flow.bias} / net ${formatUsd(flow.netflowUsd)}`
          : "・Flow Intelligence: n/a"
      ]
    : [];

  return [
    "🧠 **Flow Judge**",
    "",
    `対象: **$${candidate.symbol}**`,
    `CA: \`${candidate.ca}\``,
    "",
    `・MC: ${mcap}`,
    `・SM traders: ${sm}`,
    `・24h flow: ${netflow}`,
    `・age: ${age}`,
    `・bb反応度: ${candidate.bbScore}/100`,
    "",
    "**判定**",
    `・状態: ${judge.stage}`,
    `・主導: ${judge.driver}`,
    `・買い圧: ${judge.pressure}`,
    `・リスク: ${judge.risk}`,
    "",
    "**見方**",
    judge.verdict,
    "",
    `Nansen根拠: ${candidate.reason}`,
    ...nansenDeepDiveLines,
    ...trackingLines,
    "",
    "※ 投資助言ではありません。DexScreener/gmgn/Nansenで必ず確認してください。"
  ].join("\n");
}

export function formatFlowCardIntro(candidate) {
  return [
    "🧠 **Flow Judge**",
    `$${candidate.symbol} のNansen深掘りと通知後トラッキング`
  ].join("\n");
}

export function formatFlowEmbed(candidate) {
  const metrics = candidate.metrics || {};
  const tracking = candidate.tracking || {};
  const holders = candidate.nansenDeepDive?.holders || null;
  const flow = candidate.nansenDeepDive?.flow || null;
  const judge = flowJudge(candidate);
  const age = metrics.tokenAgeDays ? `${metrics.tokenAgeDays.toFixed(metrics.tokenAgeDays < 10 ? 1 : 0)}d` : "n/a";
  const netflow = formatUsd(metrics.netflow24hUsd);
  const mcap = candidate.marketCap || formatUsd(metrics.marketCapUsd);
  const holderLine = holders
    ? `${holders.concentration} / top1 ${holders.top1Percent === null ? "n/a" : `${holders.top1Percent.toFixed(1)}%`} / top5 ${holders.top5Percent === null ? "n/a" : `${holders.top5Percent.toFixed(1)}%`}`
    : "n/a";
  const labelLine = holders?.labels?.summary || "n/a";
  const flowLine = flow ? `${flow.bias} / net ${formatUsd(flow.netflowUsd)}` : "n/a";
  const trackingLine = Number.isFinite(Number(tracking.latestMarketCapUsd))
    ? `now ${formatUsd(tracking.latestMarketCapUsd)} / max ${formatUsd(tracking.maxMarketCapUsd)} / ${formatGain(tracking.maxGainPercent)}`
    : "n/a";

  return {
    title: `Flow Judge | $${candidate.symbol}`,
    description: `\`${candidate.ca}\``,
    color: scoreColor(candidate.bbScore),
    fields: [
      { name: "MC", value: mcap, inline: true },
      { name: "SM traders", value: String(candidate.smartMoneyInflows || metrics.traderCount || "n/a"), inline: true },
      { name: "24h flow", value: netflow, inline: true },
      { name: "age", value: age, inline: true },
      { name: "bb反応度", value: `${candidate.bbScore}/100`, inline: true },
      { name: "状態", value: judge.stage, inline: true },
      { name: "主導", value: shortText(judge.driver, 250) },
      { name: "買い圧", value: shortText(judge.pressure, 250), inline: true },
      { name: "リスク", value: shortText(judge.risk, 250), inline: true },
      { name: "見方", value: shortText(judge.verdict, 500) },
      { name: "Nansen: holders", value: holderLine },
      { name: "Nansen: labels", value: labelLine, inline: true },
      { name: "Nansen: flow", value: flowLine, inline: true },
      { name: "Tracking", value: trackingLine }
    ],
    footer: {
      text: "Not financial advice | Verify with DexScreener / gmgn / Nansen"
    },
    timestamp: new Date().toISOString()
  };
}
