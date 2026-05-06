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
  fs.writeFileSync(historyPath, JSON.stringify(alerts.slice(0, 300), null, 2));
  return record;
}

export function findAlertByCa(ca) {
  const matches = readAlerts().filter((alert) => alert.ca.toLowerCase() === ca.toLowerCase());
  return matches.find(hasValidRadarMetrics) || matches[0];
}

export function wasRecentlyNotified(ca, hours = config.dedupeHours) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return readAlerts().some((alert) => {
    if (alert.ca.toLowerCase() !== ca.toLowerCase()) return false;
    const time = new Date(alert.savedAt || alert.detectedAt || 0).getTime();
    return Number.isFinite(time) && time >= cutoff;
  });
}

export function countTodayAlerts() {
  const today = new Date().toISOString().slice(0, 10);
  return readAlerts().filter((alert) => String(alert.savedAt || "").startsWith(today)).length;
}

export function applyNotificationPolicy(candidates) {
  const remainingDailySlots = Math.max(config.maxDailyAlerts - countTodayAlerts(), 0);
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
  const todayManualAlerts = validAlerts.filter((alert) => String(alert.savedAt || "").startsWith(today));
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
    best,
    recent: uniqueRecent(validAlerts).slice(0, 5)
  };
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
