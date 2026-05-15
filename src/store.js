import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";

const historyPath = path.join(config.dataDir, "alerts.json");
const scanHistoryPath = path.join(config.dataDir, "scans.json");
const dailySummaryPath = path.join(config.dataDir, "daily-summary.json");
const SCORE_VERSION = "holders-flow-v2";

function parseUsd(value) {
  if (typeof value === "number") return value;
  if (!value || typeof value !== "string") return null;
  const normalized = value.replace(/[$,\s]/g, "").toUpperCase();
  const multiplier = normalized.endsWith("M") ? 1_000_000 : normalized.endsWith("K") ? 1_000 : 1;
  const number = Number(normalized.replace(/[KM]$/, ""));
  return Number.isFinite(number) ? number * multiplier : null;
}

export function readAlerts() {
  if (!fs.existsSync(historyPath)) return [];
  try {
    const alerts = JSON.parse(fs.readFileSync(historyPath, "utf8"));
    const total = Array.isArray(alerts) ? alerts.length : 0;
    return Array.isArray(alerts)
      ? alerts.map((alert, index) => withRadarCallFallback(alert, total - index))
      : [];
  } catch {
    return [];
  }
}

function writeAlerts(alerts) {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(historyPath, JSON.stringify(alerts.slice(0, 300), null, 2));
}

function readScanHistory() {
  if (!fs.existsSync(scanHistoryPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(scanHistoryPath, "utf8"));
  } catch {
    return [];
  }
}

export function readDailySummaryState() {
  if (!fs.existsSync(dailySummaryPath)) return {};
  try {
    const state = JSON.parse(fs.readFileSync(dailySummaryPath, "utf8"));
    return state && typeof state === "object" ? state : {};
  } catch {
    return {};
  }
}

export function writeDailySummaryState(state) {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(dailySummaryPath, JSON.stringify(state, null, 2));
}

function writeScanHistory(scans) {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(scanHistoryPath, JSON.stringify(scans.slice(0, 300), null, 2));
}

function localDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: config.dailySummaryTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function isLocalDateKey(value, dateKey) {
  const time = new Date(value || 0);
  return Number.isFinite(time.getTime()) && localDateKey(time) === dateKey;
}

function withRadarCallFallback(alert, fallbackId) {
  if (alert?.radarCall?.id) return alert;
  const id = Number(fallbackId);
  return {
    ...alert,
    radarCall: {
      id: Number.isFinite(id) && id > 0 ? id : 1,
      label: `Radar Call #${Number.isFinite(id) && id > 0 ? id : 1}`,
      fallback: true
    }
  };
}

function nextRadarCallId(alerts) {
  const maxId = alerts.reduce((max, alert) => {
    const id = Number(alert.radarCall?.id);
    return Number.isFinite(id) ? Math.max(max, id) : max;
  }, 0);
  return maxId + 1;
}

export function saveAlert(alert, source = "manual") {
  fs.mkdirSync(config.dataDir, { recursive: true });
  const alerts = readAlerts();
  const now = new Date().toISOString();
  const notificationMarketCapUsd = alert.metrics?.marketCapUsd || parseUsd(alert.marketCap);
  const radarCallId = alert.radarCall?.id || nextRadarCallId(alerts);

  const record = {
    ...alert,
    radarCall: {
      id: radarCallId,
      label: `Radar Call #${radarCallId}`
    },
    chain: "solana",
    source,
    scoreVersion: SCORE_VERSION,
    savedAt: now,
    notification: {
      notifiedAt: now,
      marketCapUsd: notificationMarketCapUsd,
      smartMoneyInflows: alert.smartMoneyInflows,
      bbScore: alert.bbScore,
      reason: alert.reason
    },
    tracking: {
      after1hMarketCapUsd: null,
      after3hMarketCapUsd: null,
      after6hMarketCapUsd: null,
      maxMarketCapUsd: notificationMarketCapUsd,
      maxGainPercent: 0,
      bbMentioned: false,
      updatedAt: null
    },
    reactions: {
      fire: 0,
      eyes: 0,
      warning: 0,
      skull: 0,
      updatedAt: null
    }
  };

  alerts.unshift(record);
  writeAlerts(alerts);
  return record;
}

export function attachDiscordMessageToAlerts(savedAlerts, message) {
  if (!message?.id || !Array.isArray(savedAlerts) || savedAlerts.length === 0) return [];
  const alerts = readAlerts();
  const ids = new Set(savedAlerts.map((alert) => Number(alert.radarCall?.id)).filter(Number.isFinite));
  const updated = alerts.map((alert) => {
    if (!ids.has(Number(alert.radarCall?.id))) return alert;
    return {
      ...alert,
      discord: {
        channelId: message.channel_id || config.alertChannelId,
        messageId: message.id
      }
    };
  });
  writeAlerts(updated);
  return updated.filter((alert) => ids.has(Number(alert.radarCall?.id)));
}

export function updateAlertReactions(radarCallId, reactions) {
  const alerts = readAlerts();
  const id = Number(radarCallId);
  if (!Number.isFinite(id)) return null;
  const index = alerts.findIndex((alert) => Number(alert.radarCall?.id) === id);
  if (index === -1) return null;
  alerts[index] = {
    ...alerts[index],
    reactions: {
      ...(alerts[index].reactions || {}),
      ...reactions,
      updatedAt: new Date().toISOString()
    }
  };
  writeAlerts(alerts);
  return alerts[index];
}

export function findAlertByCa(ca) {
  const matches = readAlerts().filter((alert) => alert.ca.toLowerCase() === ca.toLowerCase());
  return matches.find(hasValidRadarMetrics) || null;
}

export function wasRecentlyNotified(ca, hours = config.dedupeHours) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return readAlerts().some((alert) => {
    if (alert.ca.toLowerCase() !== ca.toLowerCase()) return false;
    const time = new Date(alert.savedAt || alert.detectedAt || 0).getTime();
    return Number.isFinite(time) && time >= cutoff;
  });
}

export function countTodayAutoAlerts() {
  const today = localDateKey();
  return readAlerts().filter((alert) => {
    return isLocalDateKey(alert.savedAt, today) && alert.source === "auto";
  }).length;
}

export function applyNotificationPolicy(candidates) {
  const remainingDailySlots = Math.max(config.maxDailyAlerts - countTodayAutoAlerts(), 0);
  if (remainingDailySlots <= 0) return [];

  return candidates
    .filter((candidate) => !wasRecentlyNotified(candidate.ca))
    .filter((candidate) => candidate.bbScore >= config.minBbScore)
    .slice(0, remainingDailySlots);
}

function rejectionReasonTags(candidate) {
  const metrics = candidate.metrics || {};
  const tags = [];
  if (Number(metrics.holderPenalty || 0) > 0) tags.push("holder_concentration");
  if (Number(metrics.flowAdjustment || 0) < 0) tags.push("flow_outflow");
  if (metrics.bbAlreadyPosted) tags.push("bb_already_posted");
  const sm = Number(candidate.smartMoneyInflows || metrics.traderCount || 0);
  if (sm <= 1) tags.push("single_sm_trader");
  if (!tags.length && Number(candidate.bbScore || 0) < config.minBbScore) tags.push("low_score");
  return tags;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object || {}).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function compactMarketQuality(candidate) {
  const market = candidate.nansenDeepDive?.marketQuality || {};
  return compactObject({
    summary: market.summary,
    reasons: Array.isArray(market.reasons) ? market.reasons.slice(0, 4) : undefined,
    liquidityUsd: finiteNumber(market.liquidityUsd ?? candidate.metrics?.liquidityUsd),
    volume24hUsd: finiteNumber(market.volume24hUsd ?? candidate.metrics?.volume24hUsd),
    buys1h: finiteNumber(market.buys1h),
    sells1h: finiteNumber(market.sells1h),
    priceChange1h: finiteNumber(market.priceChange1h ?? candidate.metrics?.priceChange1h),
    priceChange24h: finiteNumber(market.priceChange24h ?? candidate.metrics?.priceChange24h),
    penalty: finiteNumber(market.penalty ?? candidate.metrics?.marketPenalty),
    bonus: finiteNumber(market.bonus ?? candidate.metrics?.marketBonus),
    hardReject: market.hardReject ?? candidate.metrics?.marketHardReject
  });
}

function compactFlowSummary(candidate) {
  const flow = candidate.nansenDeepDive?.flow || {};
  return compactObject({
    inflowUsd: finiteNumber(flow.inflowUsd),
    outflowUsd: finiteNumber(flow.outflowUsd),
    netflowUsd: finiteNumber(flow.netflowUsd),
    bias: flow.bias,
    summary: flow.summary
  });
}

function compactHolderSummary(candidate) {
  const holders = candidate.nansenDeepDive?.holders || {};
  const labels = holders.labels || {};
  return compactObject({
    rowCount: finiteNumber(holders.rowCount),
    top1Percent: finiteNumber(holders.top1Percent),
    top5Percent: finiteNumber(holders.top5Percent),
    concentration: holders.concentration,
    labels: compactObject({
      summary: labels.summary,
      detected: Array.isArray(labels.detected) ? labels.detected.slice(0, 5) : undefined
    })
  });
}

function compactAlphaSummary(candidate) {
  const alpha = candidate.metrics?.alphaSignals || candidate.nansenDeepDive?.alphaSignals || {};
  return compactObject({
    winnerWalletProxy: alpha.winnerWalletProxy || alpha.winningWallet?.label,
    newWalletProxy: alpha.newWalletProxy || alpha.newWallets?.label,
    sellerBuyPressure: alpha.sellerBuyPressure || alpha.seller?.label,
    narratives: Array.isArray(alpha.narratives) ? alpha.narratives.slice(0, 4) : undefined,
    scoreAdjustment: finiteNumber(alpha.scoreAdjustment),
    reason: alpha.reason
  });
}

function toScanCandidateSnapshot(candidate, scannedAt) {
  const metrics = candidate.metrics || {};
  const marketQuality = compactMarketQuality(candidate);
  const flow = compactFlowSummary(candidate);
  const holders = compactHolderSummary(candidate);
  const alphaSignals = compactAlphaSummary(candidate);
  return compactObject({
    symbol: candidate.symbol,
    ca: candidate.ca,
    bbScore: finiteNumber(candidate.bbScore),
    reviewStatus: metrics.bbAlreadyPosted ? "監視候補" : "見送り候補",
    marketCap: candidate.marketCap,
    detectedAt: candidate.detectedAt || scannedAt,
    savedAt: candidate.savedAt,
    scannedAt,
    source: candidate.source,
    reasons: rejectionReasonTags(candidate),
    smartMoneyInflows: candidate.smartMoneyInflows ?? metrics.traderCount,
    newWalletGrowth: candidate.newWalletGrowth,
    metrics: compactObject({
      tokenAgeDays: finiteNumber(metrics.tokenAgeDays),
      marketCapUsd: finiteNumber(metrics.marketCapUsd ?? parseUsd(candidate.marketCap)),
      liquidityUsd: finiteNumber(metrics.liquidityUsd ?? marketQuality.liquidityUsd),
      volume24hUsd: finiteNumber(metrics.volume24hUsd ?? marketQuality.volume24hUsd),
      netflow1hUsd: finiteNumber(metrics.netflow1hUsd),
      netflow24hUsd: finiteNumber(metrics.netflow24hUsd),
      netflow7dUsd: finiteNumber(metrics.netflow7dUsd),
      traderCount: finiteNumber(metrics.traderCount ?? candidate.smartMoneyInflows),
      bbAlreadyPosted: metrics.bbAlreadyPosted,
      bbLookbackChecked: finiteNumber(metrics.bbLookbackChecked),
      holderPenalty: finiteNumber(metrics.holderPenalty),
      flowAdjustment: finiteNumber(metrics.flowAdjustment),
      marketPenalty: finiteNumber(metrics.marketPenalty),
      marketBonus: finiteNumber(metrics.marketBonus),
      marketHardReject: metrics.marketHardReject,
      singleSmHolderPenalty: finiteNumber(metrics.singleSmHolderPenalty),
      priceChange1h: finiteNumber(metrics.priceChange1h ?? marketQuality.priceChange1h),
      priceChange24h: finiteNumber(metrics.priceChange24h ?? marketQuality.priceChange24h),
      alphaSignals
    }),
    nansenDeepDive: compactObject({
      marketQuality,
      flow,
      holders,
      alphaSignals
    })
  });
}

export function saveScanSummary(result, source = "manual") {
  const scans = readScanHistory();
  const rejected = Array.isArray(result?.rejected) ? result.rejected : [];
  const candidates = Array.isArray(result?.candidates) ? result.candidates : [];
  const scannedAt = new Date().toISOString();
  const record = {
    scannedAt,
    source,
    scannedCount: Number(result?.scannedCount || candidates.length + rejected.length || 0),
    passedCount: candidates.length,
    rejectedCount: rejected.length,
    rejected: rejected.slice(0, 5).map((candidate) => toScanCandidateSnapshot(candidate, scannedAt))
  };
  scans.unshift(record);
  writeScanHistory(scans);
  return record;
}

export function getStats() {
  const alerts = readAlerts();
  const scans = readScanHistory();
  const today = localDateKey();
  const validAlerts = alerts.filter(hasValidRadarMetrics);
  const todayManualAlerts = validAlerts.filter((alert) => isLocalDateKey(alert.savedAt, today) && alert.source === "manual");
  const todayAutoAlerts = validAlerts.filter((alert) => isLocalDateKey(alert.savedAt, today) && alert.source === "auto");
  const best = validAlerts.reduce((current, alert) => {
    const score = Number(alert.bbScore || 0);
    const currentScore = Number(current?.bbScore || 0);
    return score > currentScore ? alert : current;
  }, null);

  return {
    total: validAlerts.length,
    rawTotal: alerts.length,
    todayManual: todayManualAlerts.length,
    todayAuto: todayAutoAlerts.length,
    today: dailyRadarStats(validAlerts, scans, today),
    best,
    recent: uniqueRecent(validAlerts).slice(0, 5),
    tracking: trackingStats(validAlerts),
    scans: scanStats(scans)
  };
}

function reactionTotals(alerts) {
  return alerts.reduce((totals, alert) => {
    const reactions = alert.reactions || {};
    totals.fire += Number(reactions.fire || 0);
    totals.eyes += Number(reactions.eyes || 0);
    totals.warning += Number(reactions.warning || 0);
    totals.skull += Number(reactions.skull || 0);
    return totals;
  }, { fire: 0, eyes: 0, warning: 0, skull: 0 });
}

function todayReasonCounts(scans) {
  const reasonCounts = {};
  for (const scan of scans) {
    for (const rejected of scan.rejected || []) {
      for (const reason of rejected.reasons || []) {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
    }
  }
  return Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));
}

function dailyRadarStats(validAlerts, scans, today) {
  const todayAlerts = validAlerts.filter((alert) => isLocalDateKey(alert.savedAt, today));
  const todayScans = scans.filter((scan) => isLocalDateKey(scan.scannedAt, today));
  const strongCandidates = todayAlerts.filter((alert) => Number(alert.bbScore || 0) >= config.minBbScore);
  const bestRadar = todayAlerts.reduce((current, alert) => {
    const gain = Number(alert.tracking?.maxGainPercent || 0);
    const currentGain = Number(current?.tracking?.maxGainPercent || 0);
    const score = Number(alert.bbScore || 0);
    const currentScore = Number(current?.bbScore || 0);
    if (!current || gain > currentGain || (gain === currentGain && score > currentScore)) return alert;
    return current;
  }, null);
  const topRejectReasons = todayReasonCounts(todayScans);

  return {
    date: today,
    radarCalls: todayAlerts.length,
    strongCandidates: strongCandidates.length,
    rejected: todayScans.reduce((sum, scan) => sum + Number(scan.rejectedCount || 0), 0),
    scans: todayScans.length,
    bestRadar,
    topRejectReason: topRejectReasons[0] || null,
    topRejectReasons,
    reactions: reactionTotals(todayAlerts)
  };
}

function scanStats(scans) {
  const today = localDateKey();
  const todayScans = scans.filter((scan) => isLocalDateKey(scan.scannedAt, today));
  const recentRejected = uniqueRejectedCandidates(scans.flatMap((scan) => scan.rejected || []));
  const reasonCounts = {};
  for (const rejected of recentRejected.slice(0, 50)) {
    for (const reason of rejected.reasons || []) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
  }
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  return {
    total: scans.length,
    today: todayScans.length,
    rejectedTotal: scans.reduce((sum, scan) => sum + Number(scan.rejectedCount || 0), 0),
    recentRejected: recentRejected.slice(0, 5),
    topReasons
  };
}

function uniqueRejectedCandidates(rejected = []) {
  const seen = new Set();
  const result = [];
  for (const candidate of rejected) {
    const ca = String(candidate.ca || "").toLowerCase();
    const symbol = String(candidate.symbol || "").toLowerCase();
    const key = ca || (symbol ? `symbol:${symbol}` : "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

export function getAlertsDueForTracking(now = new Date()) {
  const alerts = readAlerts();
  const nowMs = now.getTime();
  const sixHoursMs = 6 * 60 * 60 * 1000;
  const minRefreshMs = Math.max(config.trackingIntervalMinutes, 1) * 60 * 1000;

  const dueAlerts = alerts.filter((alert) => {
    if (!hasValidRadarMetrics(alert)) return false;
    const notifiedAt = new Date(alert.notification?.notifiedAt || alert.savedAt || alert.detectedAt || 0).getTime();
    if (!Number.isFinite(notifiedAt)) return false;
    if (nowMs - notifiedAt < 10 * 60 * 1000) return false;
    if (nowMs - notifiedAt > sixHoursMs + 30 * 60 * 1000) return false;

    const updatedAt = new Date(alert.tracking?.updatedAt || 0).getTime();
    if (Number.isFinite(updatedAt) && nowMs - updatedAt < minRefreshMs) return false;

    const tracking = alert.tracking || {};
    return tracking.after1hMarketCapUsd === null
      || tracking.after3hMarketCapUsd === null
      || tracking.after6hMarketCapUsd === null
      || nowMs - notifiedAt <= sixHoursMs;
  });

  return uniqueRecent(dueAlerts).slice(0, 15);
}

export function updateAlertTracking(ca, marketData, now = new Date()) {
  const alerts = readAlerts();
  const index = alerts.findIndex((alert) => alert.ca.toLowerCase() === ca.toLowerCase());
  if (index === -1 || !marketData?.marketCapUsd) return null;

  const alert = alerts[index];
  const notifiedAt = new Date(alert.notification?.notifiedAt || alert.savedAt || alert.detectedAt || 0).getTime();
  const ageMs = now.getTime() - notifiedAt;
  const marketCapUsd = marketData.marketCapUsd;
  const tracking = alert.tracking || {};
  const startMarketCapUsd = alert.notification?.marketCapUsd || alert.metrics?.marketCapUsd || marketCapUsd;
  const maxMarketCapUsd = Math.max(tracking.maxMarketCapUsd || 0, marketCapUsd);
  const maxGainPercent = startMarketCapUsd
    ? Math.round(((maxMarketCapUsd - startMarketCapUsd) / startMarketCapUsd) * 100)
    : 0;

  const nextTracking = {
    after1hMarketCapUsd: tracking.after1hMarketCapUsd ?? null,
    after3hMarketCapUsd: tracking.after3hMarketCapUsd ?? null,
    after6hMarketCapUsd: tracking.after6hMarketCapUsd ?? null,
    maxMarketCapUsd,
    maxGainPercent,
    bbMentioned: Boolean(tracking.bbMentioned),
    updatedAt: now.toISOString(),
    latestMarketCapUsd: marketCapUsd,
    latestPriceUsd: marketData.priceUsd,
    latestVolume24hUsd: marketData.volume24hUsd,
    latestLiquidityUsd: marketData.liquidityUsd,
    latestPairUrl: marketData.pairUrl
  };

  if (ageMs >= 60 * 60 * 1000 && nextTracking.after1hMarketCapUsd === null) {
    nextTracking.after1hMarketCapUsd = marketCapUsd;
  }
  if (ageMs >= 3 * 60 * 60 * 1000 && nextTracking.after3hMarketCapUsd === null) {
    nextTracking.after3hMarketCapUsd = marketCapUsd;
  }
  if (ageMs >= 6 * 60 * 60 * 1000 && nextTracking.after6hMarketCapUsd === null) {
    nextTracking.after6hMarketCapUsd = marketCapUsd;
  }

  alerts[index] = {
    ...alert,
    tracking: nextTracking
  };
  writeAlerts(alerts);
  return alerts[index];
}

function hasValidRadarMetrics(alert) {
  if (alert.scoreVersion !== SCORE_VERSION) return false;
  const age = Number(alert.metrics?.tokenAgeDays);
  const mcap = Number(alert.metrics?.marketCapUsd);
  return Number.isFinite(age) && age > 0 && age <= config.tokenAgeMaxDays
    && (!Number.isFinite(mcap) || mcap <= config.marketCapMaxUsd);
}

function uniqueRecent(alerts) {
  const seen = new Set();
  const result = [];
  for (const alert of alerts) {
    const key = alert.ca.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(alert);
  }
  return result;
}

function uniqueBestTracked(alerts) {
  const byCa = new Map();
  for (const alert of alerts) {
    const key = alert.ca.toLowerCase();
    const current = byCa.get(key);
    const gain = Number(alert.tracking?.maxGainPercent || 0);
    const currentGain = Number(current?.tracking?.maxGainPercent || 0);
    const latestTime = new Date(alert.tracking?.updatedAt || alert.savedAt || 0).getTime();
    const currentTime = new Date(current?.tracking?.updatedAt || current?.savedAt || 0).getTime();
    if (!current || gain > currentGain || (gain === currentGain && latestTime > currentTime)) {
      byCa.set(key, alert);
    }
  }
  return [...byCa.values()];
}

function trackingStats(alerts) {
  const tracked = alerts.filter((alert) => Number.isFinite(Number(alert.tracking?.latestMarketCapUsd)));
  const uniqueTracked = uniqueBestTracked(tracked);
  const completed = uniqueTracked.filter((alert) => alert.tracking?.after6hMarketCapUsd !== null && alert.tracking?.after6hMarketCapUsd !== undefined);
  const leaderboard = uniqueTracked
    .slice()
    .sort((a, b) => Number(b.tracking?.maxGainPercent || 0) - Number(a.tracking?.maxGainPercent || 0))
    .slice(0, 5);
  const bestGain = uniqueTracked.reduce((current, alert) => {
    const gain = Number(alert.tracking?.maxGainPercent || 0);
    const currentGain = Number(current?.tracking?.maxGainPercent || 0);
    return gain > currentGain ? alert : current;
  }, null);

  return {
    tracked: uniqueTracked.length,
    completed: completed.length,
    bestGain,
    leaderboard
  };
}
