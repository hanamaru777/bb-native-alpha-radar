# bb Native Alpha Radar

bb Native Alpha Radar is a Discord bot that uses the Nansen REST API to surface early Solana lowcap meme candidates before contract addresses are posted in the bb altcoin room.

Most existing lowcap bots react after a CA is posted. This bot is designed to look one step earlier: it watches Smart Money signals and shows only a small number of candidates worth checking.

## Concept

The bot is intentionally selective. It avoids noisy alerts and focuses on a small set of candidates.

The main score is `bb reaction score`, an original score made from:

- low market cap
- token age within 30 days
- Smart Money traders
- 24h Smart Money netflow
- DEX-side activity

## Commands

### `/radar`

Shows current Solana lowcap candidates from Nansen data.

Output includes:

- token symbol
- contract address
- market cap
- Smart Money traders
- 24h Smart Money netflow
- token age
- bb reaction score
- buttons for DexScreener, gmgn, and Nansen

Current filter:

- Chain: Solana
- Market cap: <= $500K
- Token age: <= 30 days
- 24h Smart Money netflow is positive, or Smart Money traders >= 3
- Excludes suspicious demo symbols such as `SCAM`, `RUG`, `HONEYPOT`, `DRAIN`, and `HACK`
- Minimum bb reaction score: 70
- Duplicate prevention: same CA is not auto-notified again within 6 hours
- Daily limit: max 8 auto alerts per day

### `/flow <CA>`

Returns a short flow analysis for a token. It uses saved radar history when available and also attempts a live Nansen lookup for token holders and Flow Intelligence.

The flow judge now uses Nansen deep-dive signals in the verdict:

- holder concentration from token holders
- top1 / top5 holder share when available
- Flow Intelligence bias such as inflow-heavy, outflow-heavy, or neutral
- post-alert market-cap tracking when the CA was previously detected

### `/criteria`

Shows the filter criteria and explains the bb reaction score.

### `/help`

Shows command usage and explains manual vs automatic operation.

### `/stats`

Shows saved alert history, today's alert count, the best bb reaction score, recent candidates, tracking progress, and a post-alert performance leaderboard.

### `/report`

Shows a short submission-ready report with the bot concept, current tracked results, top post-alert performers, and Nansen usage points.

### `/config`

Shows the current non-secret runtime settings such as market-cap limit, token-age limit, bb reaction threshold, alert interval, tracking interval, daily alert cap, and dedupe window.

### `/export`

Writes the latest submission-ready performance report to `REPORT.md`. This gives the GitHub repository a visible snapshot of the bot's current tracked results without committing the raw local `data/alerts.json` history.

## Nansen API Usage

Base URL:

```text
https://api.nansen.ai/api/v1
```

Endpoints used:

- `POST /smart-money/netflow`
- `POST /smart-money/dex-trades`
- `POST /token-screener`
- `POST /tgm/holders`
- `POST /tgm/flow-intelligence`

## Setup

Copy `.env.example` to `.env`.

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CHANNEL_ID=your_alert_channel_id
DISCORD_GUILD_ID=your_test_guild_id
NANSEN_API_KEY=your_nansen_api_key
ALERT_INTERVAL_MINUTES=30
TRACKING_INTERVAL_MINUTES=15
MARKET_CAP_MAX_USD=500000
TOKEN_AGE_MAX_DAYS=30
MIN_BB_SCORE=70
MAX_DAILY_ALERTS=8
DEDUPE_HOURS=6
MIN_SMART_MONEY_TRADERS=3
MOCK_MODE=false
```

Never commit or share `DISCORD_TOKEN` or `NANSEN_API_KEY`.

## Run

Windows PowerShell:

```powershell
.\start-bot.cmd
```

If Node.js is available in PATH:

```powershell
node src/index.js
```

## Safety

This bot does not provide financial advice. The Discord output tells users to verify the final decision with DexScreener, gmgn, and Nansen.

Secrets are loaded from `.env` and are ignored by git.

## Tracking

Alerts are stored in `data/alerts.json`.

Each alert record includes:

- CA
- ticker
- chain
- notification time
- notification-time market cap
- Smart Money trader count
- bb reaction score
- detection reason
- tracking slots for 1h / 3h / 6h market cap
- max market cap
- max gain percent
- bb mentioned flag

While the bot is running, it checks saved candidates with the DexScreener API every `TRACKING_INTERVAL_MINUTES` minutes. It fills the 1h / 3h / 6h market-cap slots when each checkpoint is reached and keeps the max market cap / max gain updated.

Use `/stats` to see tracking progress, the best post-alert gain, and a leaderboard like:

```text
Post-alert performance
1. $TOKEN / +35% / alert $100.0K -> max $135.0K / now $128.0K
```

Use `/flow <CA>` on a saved candidate to see its current tracking snapshot.

## Current Limitations

The current MVP already calls the live Nansen REST API, but a few final-product signals are still approximated or left for adapter expansion:

- winning-wallet classification
- new wallet growth rate
- detailed wallet labels per CA beyond holder concentration
- top-holder sell pressure beyond holder concentration / flow bias
- bb-room "not posted yet" detection
- CTO / Korea / CEX narrative detection

The code is structured so these can be added behind Nansen or market-data adapters without changing the Discord command surface.

## AI Disclosure

OpenAI ChatGPT / Codex was used for product design, implementation, debugging, and README drafting.

## License

Hackathon prototype.
