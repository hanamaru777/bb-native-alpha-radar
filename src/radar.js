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
    concentration
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

function flowJudge(candidate) {
  const metrics = candidate.metrics || {};
  const sm = Number(candidate.smartMoneyInflows || metrics.traderCount || 0);
  const score = Number(candidate.bbScore || 0);
  const netflow = Number(metrics.netflow24hUsd || 0);
  const age = Number(metrics.tokenAgeDays || 0);
  const mcap = Number(metrics.marketCapUsd || 0);
  const dexMatches = Number(metrics.dexTradeMatches || 0);

  const driver = sm >= 10
    ? "Smart Money主導が強め"
    : sm >= 3
      ? "初期degen + Smart Money反応"
      : "まだ薄い初期反応";

  const stage = age > 0 && age <= 3 && mcap > 0 && mcap <= 250000
    ? "初動寄り"
    : age > 7 || mcap > 400000
      ? "回転・継続監視寄り"
      : "初動から拡散前の中間";

  const pressure = netflow > 5000 && sm >= 5
    ? "買い圧は強め"
    : netflow > 0
      ? "買い圧は確認できるが継続確認"
      : "買い圧は弱め";

  const risk = mcap > 400000
    ? "MCが上限に近いので出口速度に注意"
    : dexMatches === 0
      ? "板・出来高・上位ホルダー売りを要確認"
      : "低capなので板・出来高・上位ホルダー売りを確認";

  const verdict = score >= 90
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
