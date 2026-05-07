import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";

const historyPath = path.join(config.dataDir, "alerts.json");

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
    return JSON.parse(fs.readFileSync(historyPath, "utf8"));
  } catch {
    return [];
  }
}

function writeAlerts(alerts) {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(historyPath, JSON.stringify(alerts.slice(0, 300), null, 2));
}

export function saveAlert(alert, source = "manual") {
  fs.mkdirSync(config.dataDir, { recursive: true });
  const alerts = readAlerts();
  const now = new Date().toISOString();
  const notificationMarketCapUsd = alert.metrics?.marketCapUsd || parseUsd(alert.marketCap);

  const record = {
    ...alert,
    chain: "solana",
    source,
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
    }
  };

  alerts.unshift(record);
  writeAlerts(alerts);
  return record;
}

export function findAlertByCa(ca) {
  const matches = readAlerts().filter((alert) => alert.ca.toLowerCase() === ca.toLowerCase());
  return matches.find(hasValidRadarMetrics) || matches[0];
}

export function markBbMentioned(ca, mentioned = true) {
  const alerts = readAlerts();
  let updated = null;
  const nextAlerts = alerts.map((alert) => {
    if (alert.ca.toLowerCase() !== ca.toLowerCase()) return alert;
    const tracking = {
      ...(alert.tracking || {}),
      bbMentioned: Boolean(mentioned),
      bbMentionedUpdatedAt: new Date().toISOString()
    };
    updated = { ...alert, tracking };
    return updated;
  });

  if (updated) writeAlerts(nextAlerts);
  return updated;
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
  const today = new Date().toISOString().slice(0, 10);
  return readAlerts().filter((alert) => {
    return String(alert.savedAt || "").startsWith(today) && alert.source === "auto";
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

export function getStats() {
  const alerts = readAlerts();
  const today = new Date().toISOString().slice(0, 10);
  const validAlerts = alerts.filter(hasValidRadarMetrics);
  const todayManualAlerts = validAlerts.filter((alert) => String(alert.savedAt || "").startsWith(today) && alert.source === "manual");
  const todayAutoAlerts = validAlerts.filter((alert) => String(alert.savedAt || "").startsWith(today) && alert.source === "auto");
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
    bbMentioned: validAlerts.filter((alert) => alert.tracking?.bbMentioned).length,
    best,
    recent: uniqueRecent(validAlerts).slice(0, 5),
    tracking: trackingStats(validAlerts)
  };
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

function trackingStats(alerts) {
  const tracked = alerts.filter((alert) => Number.isFinite(Number(alert.tracking?.latestMarketCapUsd)));
  const completed = alerts.filter((alert) => alert.tracking?.after6hMarketCapUsd !== null && alert.tracking?.after6hMarketCapUsd !== undefined);
  const leaderboard = tracked
    .slice()
    .sort((a, b) => Number(b.tracking?.maxGainPercent || 0) - Number(a.tracking?.maxGainPercent || 0))
    .slice(0, 5);
  const bestGain = tracked.reduce((current, alert) => {
    const gain = Number(alert.tracking?.maxGainPercent || 0);
    const currentGain = Number(current?.tracking?.maxGainPercent || 0);
    return gain > currentGain ? alert : current;
  }, null);

  return {
    tracked: tracked.length,
    completed: completed.length,
    bestGain,
    leaderboard
  };
}
