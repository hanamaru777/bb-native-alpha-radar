# bb Native Alpha Radar

bb Native Alpha Radar is not a price bot.

It is a pre-CA Radar system powered by Nansen that helps bb detect early Solana meme movements before they become Discord-wide narratives.

The goal is not to spam alpha. The goal is to create a shared Radar culture where bb collectively validates early signals using Nansen.

## Concept

**Radar -> Verify -> Prove -> Community**

- **Radar**: detect pre-CA Solana lowcap candidates using Nansen Smart Money data.
- **Verify**: use `/why <CA>` and `/flow <CA>` plus DexScreener, gmgn, and Nansen links.
- **Prove**: track post-alert market-cap movement, review daily Radar activity with `/stats`, and show detailed winners with `/leaderboard`.
- **Community**: collect bb reactions on Radar Calls with 🔥 👀 ⚠️ 💀.

Existing lowcap bots are useful after someone posts a CA. bb Native Alpha Radar tries to look one step earlier: what is Smart Money touching before bb starts talking about it?

## Why This Should Win

- It is built for the actual bb room workflow, not a generic dashboard.
- It sends a small number of explainable candidates instead of noisy alerts.
- It uses Nansen where Nansen matters: Smart Money, holders, labels, and Flow Intelligence.
- It explains both hits and rejects, so the bot is accountable.
- It tracks post-alert performance, so the result can be proven later.
- It creates a repeatable community loop: Radar Call -> Verify -> Prove -> Community.
- It can support a Nansen referral workflow because it repeatedly sends Discord users into Nansen verification.

## Radar Call System

Every saved alert receives a **Radar Call ID**.

Example:

```text
Radar Call #184
```

The same ID appears in:

- `/radar`
- `/why <CA>`
- `/flow <CA>`
- `/leaderboard`
- `/stats`
- `/report`

This gives the community a shared object to discuss: "Did you see Radar Call #184?"

## Commands

### Radar

- `/radar`  
  Manually checks current Solana lowcap Radar candidates.

- `/why <CA>`  
  Shows a short 3-second explanation of why the Radar picked a token.

- `/flow <CA>`  
  Deep-dives a candidate with Smart Money, holders, Nansen flow, risk check, and post-alert tracking.

### Prove

- `/leaderboard`  
  Shows the best tracked Radar Calls by max market-cap gain.

- `/rejections`  
  Shows why weak candidates were rejected. This is the noise filter.

- `/stats`  
  Shows today's Radar daily summary: Radar Calls, strong candidates, rejects, best Radar, community reactions, and short commentary.

- `/report`  
  Shows a short submission-ready report inside Discord.

### System

- `/criteria`  
  Shows extraction rules and score inputs.

- `/config`  
  Shows non-secret runtime settings.

- `/health`  
  Checks Bot, Nansen REST API, and Nansen CLI status.

- `/export`  
  Regenerates `REPORT.md`.

## Community Reactions

Radar Calls are designed to collect community feedback:

- 🔥 = bullish
- 👀 = watch
- ⚠️ = caution
- 💀 = suspicious

Reaction counts can be shown in leaderboard/reporting surfaces when the Radar message has a saved Discord message ID.

## Daily Summary

The bot can post a daily Discord summary to the main channel.

- Purpose: turn `/stats` into an end-of-day Radar habit for bb.
- Content: today's Radar Calls, rejects, best Radar, top reject reason, community reactions, and short commentary.
- Frequency: once per day only.
- Deduping: the bot stores the last posted local date in `data/daily-summary.json`.

Environment variables:

- `DAILY_SUMMARY_ENABLED=false`
- `DAILY_SUMMARY_HOUR=23`
- `DAILY_SUMMARY_MINUTE=50`
- `DAILY_SUMMARY_TIMEZONE=Asia/Tokyo`

## Detection Criteria

Current production filter:

- Chain: Solana
- Market cap: <= $500K
- Token age: <= 30 days
- Smart Money traders >= 3, or 24h Smart Money netflow is positive
- Recent bb channel history does not already contain the CA or `$SYMBOL`
- Suspicious, offensive, or NSFW public-channel symbols are excluded
- Top candidates are enriched with Nansen holders and Flow Intelligence
- Holder concentration and Nansen flow can reduce the score
- Minimum bb reaction score: 88
- Radar display limit: 2 candidates per scan
- Same CA is not auto-notified again within 6 hours
- Daily auto alert cap: 8

When there are no strong candidates, `/radar` explains the miss instead of filling the channel with weak alerts.

## Radar Confidence

Radar confidence is shown as:

- **HIGH**: strong score, enough Smart Money, supportive Nansen flow, and no major holder/market penalty.
- **MEDIUM**: usable watch candidate, but needs confirmation.
- **LOW**: weak or fallback candidate.

This is not a buy signal. It is an attention signal for bb verification.

## Nansen Usage

REST API endpoints:

- `POST /smart-money/netflow`
- `POST /smart-money/dex-trades`
- `POST /token-screener`
- `POST /tgm/holders`
- `POST /tgm/flow-intelligence`

CLI:

- `nansen schema --pretty`

The Discord `/health` command verifies both Nansen REST and Nansen CLI status without exposing secrets.

## Post-Alert Tracking

Alerts are saved locally in `data/alerts.json`.

The bot tracks:

- Radar Call ID
- CA
- symbol
- chain
- notification time
- notification-time market cap
- Smart Money count
- bb reaction score
- detection reason
- 1h / 3h / 6h market cap
- max market cap
- max gain percent
- latest DexScreener pair URL
- community reactions when available

Scan and rejection history is saved in `data/scans.json`.

## Setup

Install dependencies:

```powershell
npm install
```

Install Nansen CLI:

```powershell
npm install -g nansen-cli
```

Authenticate Nansen CLI:

```powershell
nansen login --human
```

Copy `.env.example`:

```powershell
copy .env.example .env
```

Fill in `.env`:

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_application_id
DISCORD_CHANNEL_ID=your_alert_channel_id
DISCORD_GUILD_ID=your_test_guild_id
NANSEN_API_KEY=your_nansen_api_key

ALERT_INTERVAL_MINUTES=30
TRACKING_INTERVAL_MINUTES=15
MARKET_CAP_MAX_USD=500000
TOKEN_AGE_MAX_DAYS=30
MIN_BB_SCORE=88
RADAR_DISPLAY_LIMIT=2
MAX_DAILY_ALERTS=8
DEDUPE_HOURS=6
MIN_SMART_MONEY_TRADERS=3
BB_LOOKBACK_MESSAGES=300
DAILY_SUMMARY_ENABLED=false
DAILY_SUMMARY_HOUR=23
DAILY_SUMMARY_MINUTE=50
DAILY_SUMMARY_TIMEZONE=Asia/Tokyo
MOCK_MODE=false
```

Never commit or share `DISCORD_TOKEN` or `NANSEN_API_KEY`.

## Run

Windows:

```powershell
.\start-bot.cmd
```

PowerShell:

```powershell
.\start-bot.ps1
```

Stop a stray/background bot process for this repo:

```powershell
.\stop-bot.cmd
```

If Node.js is available in PATH and you intentionally want a direct foreground run:

```powershell
node src/index.js
```

## Operations

Recommended development flow:

1. Start from the primary repo path with `.\start-bot.cmd`.
2. Keep the bot in the foreground while actively testing Discord behavior.
3. Stop it as soon as the check is finished with `Ctrl+C`, closing the terminal window, or `.\stop-bot.cmd` if a background process was left behind.

Recommended demo flow:

1. Start from the primary repo path with `.\start-bot.cmd`.
2. Keep that window open during judging.
3. Use `.\stop-bot.cmd` only if a previous process is still running or the bot was launched in the background by mistake.

Background start is not the default recommendation for development. It is easier to leave the bot running accidentally, which can keep spending Nansen credits on the scheduled Radar interval.

During judging:

1. Keep the bot process running.
2. The bot checks Radar candidates every `ALERT_INTERVAL_MINUTES`.
3. It posts only when candidates pass policy.
4. Automatic posts are capped by `MAX_DAILY_ALERTS`.
5. The same CA is deduped by `DEDUPE_HOURS`.
6. The bot checks recent bb messages using `BB_LOOKBACK_MESSAGES`.
7. Tracking updates run every `TRACKING_INTERVAL_MINUTES`.

## Safety

- Secrets are loaded from `.env`.
- `.env` and local data JSON files are ignored by git.
- API keys and Discord tokens are never printed in Discord output.
- Use the primary repo path for all bot operations: `C:\Users\hanam\OneDrive\ドキュメント\CODEX 260309\bb-native-alpha-radar`.
- During development, do not leave the bot running while editing docs or code. The scheduled scan can still consume Nansen credits every `ALERT_INTERVAL_MINUTES`.
- `stop-bot.cmd` only stops `node.exe` processes running this repo's `src\index.js`.
- The bot does not execute trades.
- The bot includes NFA / DYOR disclaimers.
- Daily alert limits and dedupe windows reduce spam risk.
- Public-channel safety filtering removes suspicious/offensive/NSFW token symbols.
- Required Discord permissions are minimal: View Channel, Send Messages, Embed Links, Read Message History, and Use Application Commands.

## AI Disclosure

OpenAI ChatGPT / Codex was used for product design, implementation support, debugging, and documentation drafting.

## Contributor Notes

For Codex/agent workflow, Radar philosophy, and repo guardrails, see `AGENTS.md`.

## License

Hackathon production submission.
