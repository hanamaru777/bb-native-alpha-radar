import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;
    const key = trimmed.slice(0, equals).trim();
    const value = trimmed.slice(equals + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export const config = {
  discordToken: process.env.DISCORD_TOKEN || "",
  alertChannelId: process.env.DISCORD_CHANNEL_ID || "",
  guildId: process.env.DISCORD_GUILD_ID || "",
  nansenApiKey: process.env.NANSEN_API_KEY || "",
  alertIntervalMinutes: numberEnv("ALERT_INTERVAL_MINUTES", 30),
  trackingIntervalMinutes: numberEnv("TRACKING_INTERVAL_MINUTES", 15),
  marketCapMaxUsd: numberEnv("MARKET_CAP_MAX_USD", 500000),
  tokenAgeMaxDays: numberEnv("TOKEN_AGE_MAX_DAYS", 30),
  minBbScore: numberEnv("MIN_BB_SCORE", 70),
  maxDailyAlerts: numberEnv("MAX_DAILY_ALERTS", 8),
  dedupeHours: numberEnv("DEDUPE_HOURS", 6),
  minSmartMoneyTraders: numberEnv("MIN_SMART_MONEY_TRADERS", 3),
  mockMode: (process.env.MOCK_MODE || "true").toLowerCase() !== "false",
  dataDir: path.join(rootDir, "data")
};

export function validateConfig() {
  const missing = [];
  if (!config.discordToken) missing.push("DISCORD_TOKEN");
  if (!config.alertChannelId) missing.push("DISCORD_CHANNEL_ID");
  if (missing.length > 0) {
    throw new Error(`Please set ${missing.join(", ")} in .env.`);
  }
}
