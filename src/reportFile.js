import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { getStats } from "./store.js";

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

function reasonLabel(reason) {
  const labels = {
    holder_concentration: "top-holder concentration",
    flow_outflow: "Nansen flow outflow bias",
    bb_already_posted: "already posted in bb channel",
    single_sm_trader: "single Smart Money trader",
    low_score: "below bb reaction threshold"
  };
  return labels[reason] || reason;
}

function radarCallLabel(alert) {
  const id = Number(alert?.radarCall?.id);
  return Number.isFinite(id) && id > 0 ? `Radar Call #${id}` : "Radar Call";
}

function reactionSummary(alert) {
  const reactions = alert.reactions || {};
  const fire = Number(reactions.fire || 0);
  const eyes = Number(reactions.eyes || 0);
  const warning = Number(reactions.warning || 0);
  const skull = Number(reactions.skull || 0);
  const total = fire + eyes + warning + skull;
  return total ? `🔥 ${fire} / 👀 ${eyes} / ⚠️ ${warning} / 💀 ${skull}` : "none yet";
}

function performanceRows(stats) {
  if (!stats.tracking.leaderboard.length) {
    return "| - | No tracked records yet | - | - | - | - |";
  }

  return stats.tracking.leaderboard.map((alert, index) => {
    const tracking = alert.tracking || {};
    const dex = `https://dexscreener.com/solana/${encodeURIComponent(alert.ca)}`;
    const symbol = cleanSymbol(alert.symbol);
    return [
      index + 1,
      `${radarCallLabel(alert)} / [$${symbol}](${dex})`,
      formatGain(tracking.maxGainPercent),
      formatUsd(alert.notification?.marketCapUsd),
      formatUsd(tracking.maxMarketCapUsd),
      `${formatUsd(tracking.latestMarketCapUsd)} / ${reactionSummary(alert)}`
    ].join(" | ");
  }).map((row) => `| ${row} |`).join("\n");
}

export function buildMarkdownReport(stats, generatedAt = new Date()) {
  const topRejectionReasons = stats.scans?.topReasons?.length
    ? stats.scans.topReasons.map((item) => `- ${reasonLabel(item.reason)}: ${item.count}`).join("\n")
    : "- No rejection records yet";

  return [
    "# bb Native Alpha Radar Report",
    "",
    `Generated at: ${generatedAt.toISOString()}`,
    "",
    "bb Native Alpha Radar is not a price bot.",
    "",
    "It is a pre-CA Radar system powered by Nansen that helps bb detect early Solana meme movements before they become Discord-wide narratives.",
    "",
    "The goal is not to spam alpha. The goal is to create a shared Radar culture where bb collectively validates early signals using Nansen.",
    "",
    "This is not a price bot, risk bot, or news summary bot. Existing lowcap bots are useful after someone posts a CA. This bot is designed to look one step earlier and give the community a small number of candidates worth checking.",
    "",
    "## Product Loop",
    "",
    "Radar -> Verify -> Prove -> Community",
    "",
    "- Radar: detect pre-CA candidates with Nansen Smart Money data",
    "- Verify: use `/why <CA>` and `/flow <CA>` plus DexScreener/gmgn/Nansen links",
    "- Prove: track post-alert market-cap movement, review daily Radar activity with `/stats`, and show detailed winners with `/leaderboard`",
    "- Community: collect 🔥 👀 ⚠️ 💀 reactions on Radar Calls",
    "",
    "## Product Goal",
    "",
    "- Detect early Solana lowcap meme candidates before they become a bb room topic",
    "- Keep alerts selective instead of noisy",
    "- Explain why each candidate was detected in a few seconds",
    "- Save post-alert market-cap movement for README/report evidence",
    "- Make the use of Nansen obvious: Smart Money, holders, wallet labels, and Flow Intelligence",
    "",
    "## Summary",
    "",
    "- This bot is built for the bb room's actual workflow: Radar Call -> Dex/gmgn check -> `/why <CA>` -> `/flow <CA>` -> Nansen verification.",
    "- It is deliberately not a mass alert bot. It checks on a schedule, but posts only when candidates pass policy.",
    "- Weak candidates are rejected or shown as watch-only instead of being dressed up as alpha.",
    "- It can explain both hits and misses through `/stats`, `/rejections`, `/report`, and saved scan history.",
    "- It is suitable for a Nansen referral workflow because it repeatedly sends users from Discord into Nansen verification.",
    "",
    "## Current Results",
    "",
    `- Current-score valid radar records: ${stats.total}`,
    `- Tracked records: ${stats.tracking.tracked}`,
    `- Completed 6h tracking: ${stats.tracking.completed}`,
    `- Today's auto alerts: ${stats.todayAuto}/${config.maxDailyAlerts}`,
    `- Today's Radar Calls: ${stats.today?.radarCalls || 0}`,
    `- Today's rejects: ${stats.today?.rejected || 0}`,
    "",
    "## Today's Radar Daily Summary",
    "",
    `- Strong candidates: ${stats.today?.strongCandidates || 0}`,
    `- Best Radar: ${stats.today?.bestRadar ? `$${stats.today.bestRadar.symbol} ${formatGain(stats.today.bestRadar.tracking?.maxGainPercent || 0)}` : "none yet"}`,
    `- Top reject reason: ${stats.today?.topRejectReason ? `${reasonLabel(stats.today.topRejectReason.reason)} (${stats.today.topRejectReason.count})` : "none yet"}`,
    `- Community: 🔥 ${Number(stats.today?.reactions?.fire || 0)} / 👀 ${Number(stats.today?.reactions?.eyes || 0)} / ⚠️ ${Number(stats.today?.reactions?.warning || 0)} / 💀 ${Number(stats.today?.reactions?.skull || 0)}`,
    "",
    "## Post-Alert Performance",
    "",
    "| # | Radar Call / Token | Max gain | Alert MC | Max MC | Current MC / Community |",
    "| - | - | -: | -: | -: | -: |",
    performanceRows(stats),
    "",
    "## Noise Filter / Rejections",
    "",
    `- Scan records: ${stats.scans?.total || 0}`,
    `- Rejected candidate records: ${stats.scans?.rejectedTotal || 0}`,
    "",
    "Top rejection reasons:",
    "",
    topRejectionReasons,
    "",
    "## Radar Call System",
    "",
    "- Every saved alert receives a Radar Call ID.",
    "- The same ID appears in `/radar`, `/why`, `/flow`, `/leaderboard`, `/stats`, and `/report`.",
    "- This gives the community a shared object to discuss: \"Did you see Radar Call #184?\"",
    "- Legacy alert history receives a fallback Radar Call ID for display.",
    "",
    "## Community Reactions",
    "",
    "- 🔥 = bullish",
    "- 👀 = watch",
    "- ⚠️ = caution",
    "- 💀 = suspicious",
    "",
    "Reaction counts can be pulled from Discord message reactions and shown in leaderboard, stats, and reporting surfaces.",
    "",
    "## Daily Summary",
    "",
    "- `/stats` acts as the day's Radar summary inside Discord.",
    "- Optional daily summary auto-posting can publish the same style of recap once per day into the main Discord channel.",
    "- The bot stores the last posted local date in `data/daily-summary.json` to avoid duplicate daily posts after restarts.",
    "",
    "## Radar Confidence",
    "",
    "- HIGH: strong score, enough Smart Money, healthy Nansen flow, and no major holder/market penalty",
    "- MEDIUM: usable watch candidate, but needs confirmation",
    "- LOW: weak or fallback candidate; avoid overreacting",
    "",
    "## Nansen Usage",
    "",
    "- Nansen CLI health/schema check with `nansen schema --pretty`",
    "- Smart Money netflow",
    "- Smart Money DEX trades",
    "- Token Screener",
    "- Token holders for holder concentration and label hints",
    "- Flow Intelligence for inflow/outflow bias",
    "- Holder concentration and Flow Intelligence in radar scoring",
    "- Alpha signal heuristics for winning-wallet hints, new-wallet growth, narrative context, seller pressure, and bb room topic status",
    "- Token holders / Flow Intelligence for `/flow` deep dives",
    "- Flow Judge classification and action line for fast Discord review",
    "- Wallet label hints when Nansen holder rows include label/tag/category fields",
    "",
    "## Positioning",
    "",
    "- Unlike CA reaction bots, this bot tries to surface candidates before the CA is posted in the bb room.",
    "- Unlike broad leaderboards, it intentionally limits output to a small number of candidates per scan.",
    "- Holder concentration and Nansen Flow Intelligence can penalize candidates even when raw flow looks attractive.",
    "- The bot shows operational health, Nansen REST status, and Nansen CLI status in Discord.",
    "- Post-alert tracking turns the bot into a measurable product instead of a one-off signal feed.",
    "",
    "## Discord Commands",
    "",
    "- `/radar`: manual radar scan",
    "- `/why <CA>`: explain why a Radar Call picked a CA in a few seconds",
    "- `/flow <CA>`: deep-dive a candidate",
    "- `/leaderboard`: show top tracked Radar Calls",
    "- `/rejections`: show why weak candidates were filtered out",
    "- `/stats`: show today's Radar daily summary",
    "- `/report`: show a short submission report in Discord",
    "- `/health`: check bot/Nansen/runtime health without exposing secrets",
    "",
    "Non-core support information such as criteria, config, and export guidance is kept in README/docs instead of public slash commands.",
    "",
    "## Runtime Criteria",
    "",
    `- Chain: Solana`,
    `- Market cap limit: ${formatUsd(config.marketCapMaxUsd)}`,
    `- Token age limit: ${config.tokenAgeMaxDays}d`,
    `- Minimum bb reaction score: ${config.minBbScore}`,
    `- Radar display limit: ${config.radarDisplayLimit} candidates/scan`,
    `- Minimum Smart Money traders: ${config.minSmartMoneyTraders}`,
    `- Auto alert cap: ${config.maxDailyAlerts}/day`,
    `- Dedupe window: ${config.dedupeHours}h`,
    `- bb already-posted lookback: ${config.bbLookbackMessages} messages`,
    `- Radar interval: ${config.alertIntervalMinutes} minutes`,
    `- Tracking interval: ${config.trackingIntervalMinutes} minutes`,
    `- Daily summary enabled: ${config.dailySummaryEnabled ? "true" : "false"}`,
    `- Daily summary time: ${String(config.dailySummaryHour).padStart(2, "0")}:${String(config.dailySummaryMinute).padStart(2, "0")} ${config.dailySummaryTimezone}`,
    "",
    "## Operations",
    "",
    "- During judging, the bot runs as a Node.js process on the developer machine.",
    "- While running, it checks radar candidates every configured interval.",
    "- A radar check does not always create a Discord post; the bot posts only when candidates pass the alert policy.",
    "- Each automatic post shows only the configured display limit so the bb room stays readable.",
    "- Daily alert caps and dedupe windows control noise.",
    "- The same CA can reappear after the dedupe window only if it still passes the current conditions.",
    "- The bb already-posted check scans recent Discord messages and skips candidates whose CA or symbol already appeared.",
    "- It avoids duplicate alerts for the same CA within the dedupe window.",
    "- It updates post-alert market-cap tracking every configured tracking interval.",
    "- For long-running production use, the same process can move to Railway, Render, Fly.io, or a VPS.",
    "",
    "## Safety",
    "",
    "- Secrets are read from `.env` and are not committed.",
    "- API keys and Discord tokens are not printed in Discord output.",
    "- The bot does not execute trades.",
    "- Discord permissions are intentionally minimal: view channel, send messages, embed links, read message history, and application commands.",
    "- Daily alert limits and dedupe windows reduce spam risk.",
    "- Radar display limits reduce noise during active market periods.",
    "- Public-channel safety filtering removes suspicious/offensive/NSFW token symbols before display.",
    "",
    "## AI Disclosure",
    "",
    "OpenAI ChatGPT / Codex was used for product design, implementation support, debugging, and documentation drafting.",
    "",
    "## Production Notes",
    "",
    "- Nansen credit exhaustion or API errors can temporarily reduce live data quality.",
    "- New-wallet growth, winning-wallet classification, CTO/Korea/CEX narrative detection, and top-holder sell pressure are implemented as heuristics and can be improved when richer endpoint fields are available.",
    "- The bb already-posted check currently scans recent channel messages only.",
    "- Further production hardening would add hosted deployment, persistent database storage, and richer per-wallet label mapping.",
    "",
    "## Notes",
    "",
    "- This is not financial advice.",
    "- Final decisions should be checked with DexScreener, gmgn, and Nansen.",
    "- Local raw alert history is stored in `data/alerts.json` and is not committed.",
    ""
  ].join("\n");
}

export function writeMarkdownReport(stats = getStats()) {
  const content = buildMarkdownReport(stats);
  fs.writeFileSync(reportPath, content, "utf8");
  return reportPath;
}
