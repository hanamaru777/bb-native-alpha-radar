import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(rootDir, "REPORT.md");

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

function cleanSymbol(symbol) {
  const cleaned = String(symbol || "UNKNOWN")
    .replace(/[^\w.-]/g, "")
    .replace(/^_+|_+$/g, "");
  return cleaned || "UNKNOWN";
}

function performanceRows(stats) {
  if (!stats.tracking.leaderboard.length) {
    return "| - | - | - | - | - |\n| No tracked records yet | - | - | - | - |";
  }

  return stats.tracking.leaderboard.map((alert, index) => {
    const tracking = alert.tracking || {};
    const dex = `https://dexscreener.com/solana/${encodeURIComponent(alert.ca)}`;
    const symbol = cleanSymbol(alert.symbol);
    return [
      index + 1,
      `[$${symbol}](${dex})`,
      formatGain(tracking.maxGainPercent),
      formatUsd(alert.notification?.marketCapUsd),
      formatUsd(tracking.maxMarketCapUsd),
      formatUsd(tracking.latestMarketCapUsd)
    ].join(" | ");
  }).map((row) => `| ${row} |`).join("\n");
}

export function buildMarkdownReport(stats, generatedAt = new Date()) {
  return [
    "# bb Native Alpha Radar Report",
    "",
    `Generated at: ${generatedAt.toISOString()}`,
    "",
    "bb Native Alpha Radar is a Discord bot that uses Nansen Smart Money data to surface Solana lowcap meme candidates before contract addresses are posted in the bb altcoin room.",
    "",
    "## Current Results",
    "",
    `- Valid radar records: ${stats.total}`,
    `- Tracked records: ${stats.tracking.tracked}`,
    `- Completed 6h tracking: ${stats.tracking.completed}`,
    `- Today's auto alerts: ${stats.todayAuto}/${config.maxDailyAlerts}`,
    "",
    "## Post-Alert Performance",
    "",
    "| # | Token | Max gain | Alert MC | Max MC | Current MC |",
    "| - | - | -: | -: | -: | -: |",
    performanceRows(stats),
    "",
    "## Nansen Usage",
    "",
    "- Smart Money netflow",
    "- Smart Money DEX trades",
    "- Token Screener",
    "- Token holders / Flow Intelligence for `/flow` deep dives",
    "- Holder concentration and Flow Intelligence bias in `/flow` verdicts",
    "- Wallet label hints when Nansen holder rows include label/tag/category fields",
    "",
    "## Runtime Criteria",
    "",
    `- Chain: Solana`,
    `- Market cap limit: ${formatUsd(config.marketCapMaxUsd)}`,
    `- Token age limit: ${config.tokenAgeMaxDays}d`,
    `- Minimum bb reaction score: ${config.minBbScore}`,
    `- Minimum Smart Money traders: ${config.minSmartMoneyTraders}`,
    `- Auto alert cap: ${config.maxDailyAlerts}/day`,
    `- Dedupe window: ${config.dedupeHours}h`,
    `- Radar interval: ${config.alertIntervalMinutes} minutes`,
    `- Tracking interval: ${config.trackingIntervalMinutes} minutes`,
    "",
    "## Notes",
    "",
    "- This is not financial advice.",
    "- Final decisions should be checked with DexScreener, gmgn, and Nansen.",
    "- Local raw alert history is stored in `data/alerts.json` and is not committed.",
    ""
  ].join("\n");
}

export function writeMarkdownReport(stats) {
  const content = buildMarkdownReport(stats);
  fs.writeFileSync(reportPath, content, "utf8");
  return reportPath;
}
