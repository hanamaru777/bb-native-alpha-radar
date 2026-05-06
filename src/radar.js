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

function looksBadForDemo(candidate) {
  const symbol = candidate.symbol.toLowerCase();
  const blocked = ["scam", "rug", "honeypot", "drain", "hack"];
  return blocked.some((word) => symbol.includes(word));
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
  return uniqueByCa(rows.map((row) => toCandidate(row, dexTrades)))
    .filter((candidate) => candidate.symbol !== "UNKNOWN")
    .filter((candidate) => !candidate.ca.endsWith("address-not-returned"))
    .filter((candidate) => !looksBadForDemo(candidate))
    .filter((candidate) => {
      const metrics = candidate.metrics || {};
      const lowEnough = !metrics.marketCapUsd || metrics.marketCapUsd <= config.marketCapMaxUsd;
      const hasFlow = (metrics.netflow24hUsd || 0) > 0 || (metrics.traderCount || 0) >= config.minSmartMoneyTraders;
      const hasAge = Number.isFinite(metrics.tokenAgeDays) && metrics.tokenAgeDays > 0;
      const freshEnough = hasAge && metrics.tokenAgeDays <= config.tokenAgeMaxDays;
      return lowEnough && hasFlow && freshEnough;
    })
    .sort((a, b) => b.bbScore - a.bbScore)
    .slice(0, 5);
}

export async function analyzeTokenFlow(ca) {
  if (config.mockMode || !config.nansenApiKey) return null;

  const [holders, flow] = await Promise.all([
    getTokenHolders("solana", ca, 20),
    getFlowIntelligence("solana", ca, "1d")
  ]);

  const holderCount = Array.isArray(holders) ? holders.length : 0;
  const flowSummary = typeof flow === "object" ? JSON.stringify(flow).slice(0, 500) : String(flow).slice(0, 500);

  return {
    symbol: "NANSEN",
    ca,
    marketCap: "Nansen分析",
    smartMoneyInflows: "Nansen API",
    newWalletGrowth: `${holderCount} holder rows`,
    bbScore: "分析中",
    reason: `Token holders ${holderCount}件とFlow Intelligenceを取得しました。`,
    caution: `Flow raw summary: ${flowSummary}`
  };
}

function metricLine(candidate) {
  const metrics = candidate.metrics || {};
  const age = metrics.tokenAgeDays ? `${metrics.tokenAgeDays.toFixed(metrics.tokenAgeDays < 10 ? 1 : 0)}d` : "n/a";
  const netflow = Number.isFinite(metrics.netflow24hUsd) ? `$${Math.round(metrics.netflow24hUsd).toLocaleString()}` : "n/a";
  return `MC ${candidate.marketCap} | SM ${candidate.smartMoneyInflows} | 24h flow ${netflow} | age ${age}`;
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
  lines.push("※ ボタン番号は候補番号に対応しています。気になるCAは `/flow <CA>`。");
  return lines.join("\n");
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
    "・SCAM / RUG / HONEYPOT / DRAIN / HACK系のシンボルは除外",
    `・bb反応度: ${config.minBbScore}以上で自動通知対象`,
    `・重複通知: ${config.dedupeHours}時間以内は同じCAを再通知しない`,
    `・通知上限: 1日最大${config.maxDailyAlerts}件`,
    "",
    "**bb反応度**",
    "低cap感、若さ、Smart Money流入、24h flow、DEX反応を合成した独自スコアです。",
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
    "**自動通知**",
    `Botを起動したままにすると、${config.alertIntervalMinutes}分ごとにRadarを確認します。`,
    `同じCAは${config.dedupeHours}時間以内は再通知せず、1日最大${config.maxDailyAlerts}件までです。`,
    "",
    "※ 投資助言ではありません。必ず自分で確認してください。"
  ].join("\n");
}

export function formatFlowAnalysis(candidate) {
  return [
    "🧠 **bb Flow Analysis**",
    "",
    `対象: **$${candidate.symbol}**`,
    `CA: \`${candidate.ca}\``,
    `通知時MC: ${candidate.marketCap}`,
    `Smart Money流入: ${candidate.smartMoneyInflows}`,
    `新規ウォレット増加: ${candidate.newWalletGrowth}`,
    `bb反応度: ${candidate.bbScore}/100`,
    "",
    `現在地: ${candidate.reason}`,
    `見るべき点: ${candidate.caution}`,
    "bb反応度は、低cap感、若さ、Smart Money流入、24h flowを合成した独自スコアです。",
    "",
    "※ 投資助言ではありません。自分で必ず確認してください。"
  ].join("\n");
}
