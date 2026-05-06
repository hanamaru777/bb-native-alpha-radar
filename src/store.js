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
  return readAlerts().find((alert) => alert.ca.toLowerCase() === ca.toLowerCase());
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
