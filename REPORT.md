# bb Native Alpha Radar Report

Generated at: 2026-05-08T12:58:50.179Z

bb Native Alpha Radar is not a price bot.

It is a pre-CA Radar system powered by Nansen that helps bb detect early Solana meme movements before they become Discord-wide narratives.

The goal is not to spam alpha. The goal is to create a shared Radar culture where bb collectively validates early signals using Nansen.

This is not a price bot, risk bot, or news summary bot. Existing lowcap bots are useful after someone posts a CA. This bot is designed to look one step earlier and give the community a small number of candidates worth checking.

## Product Loop

Radar -> Verify -> Prove -> Community

- Radar: detect pre-CA candidates with Nansen Smart Money data
- Verify: use `/why <CA>` and `/flow <CA>` plus DexScreener/gmgn/Nansen links
- Prove: track post-alert market-cap movement, review daily Radar activity with `/stats`, and show detailed winners with `/leaderboard`
- Community: collect 🔥 👀 ⚠️ 💀 reactions on Radar Calls

## Product Goal

- Detect early Solana lowcap meme candidates before they become a bb room topic
- Keep alerts selective instead of noisy
- Explain why each candidate was detected in a few seconds
- Save post-alert market-cap movement for README/report evidence
- Make the use of Nansen obvious: Smart Money, holders, wallet labels, and Flow Intelligence

## Summary

- This bot is built for the bb room's actual workflow: Radar Call -> Dex/gmgn check -> `/why <CA>` -> `/flow <CA>` -> Nansen verification.
- It is deliberately not a mass alert bot. It checks on a schedule, but posts only when candidates pass policy.
- Weak candidates are rejected or shown as watch-only instead of being dressed up as alpha.
- It can explain both hits and misses through `/stats`, `/rejections`, `/report`, and saved scan history.
- It is suitable for a Nansen referral workflow because it repeatedly sends users from Discord into Nansen verification.

## Daily Summary

- `/stats` is the daily Radar summary inside Discord.
- It shows today's Radar Calls, strong candidates, rejects, best Radar, community reactions, and a short commentary.
- Optional daily summary auto-posting can publish the same recap once per day into the main channel.
- Duplicate daily posts are prevented with `data/daily-summary.json`.

## Current Results

- Current-score valid radar records: 3
- Tracked records: 3
- Completed 6h tracking: 2
- Today's auto alerts: 0/8

## Post-Alert Performance

| # | Radar Call / Token | Max gain | Alert MC | Max MC | Current MC / Community |
| - | - | -: | -: | -: | -: |
| 1 | Radar Call #40 / [$ECASH](https://dexscreener.com/solana/cTxqg4vt21u1Q2f9DSEig6S1fxmxLSsUV2v2wWspump) | +97% | $273.2K | $537.0K | $388.0K / none yet |
| 2 | Radar Call #42 / [$TRACKHANTA](https://dexscreener.com/solana/5MNT24bACund9tFpb8nYJR1G8ArR3ahFo1C24zqypump) | +34% | $11.4K | $15.2K | $13.9K / none yet |
| 3 | Radar Call #41 / [$PUMP](https://dexscreener.com/solana/DTPpZEzTdB6wMDyKgyexhB6h3r7fVBksSB363DLopump) | +26% | $8.2K | $10.4K | $8.8K / none yet |

## Noise Filter / Rejections

- Scan records: 17
- Rejected candidate records: 42

Top rejection reasons:

- Nansen flow outflow bias: 28
- already posted in bb channel: 12
- top-holder concentration: 3

## Radar Call System

- Every saved alert receives a Radar Call ID.
- The same ID appears in `/radar`, `/why`, `/flow`, `/leaderboard`, `/stats`, and `/report`.
- This gives the community a shared object to discuss: "Did you see Radar Call #184?"
- Legacy alert history receives a fallback Radar Call ID for display.

## Community Reactions

- 🔥 = bullish
- 👀 = watch
- ⚠️ = caution
- 💀 = suspicious

Reaction counts can be pulled from Discord message reactions and shown in leaderboard/reporting surfaces.

## Radar Confidence

- HIGH: strong score, enough Smart Money, healthy Nansen flow, and no major holder/market penalty
- MEDIUM: usable watch candidate, but needs confirmation
- LOW: weak or fallback candidate; avoid overreacting

## Nansen Usage

- Nansen CLI health/schema check with `nansen schema --pretty`
- Smart Money netflow
- Smart Money DEX trades
- Token Screener
- Token holders for holder concentration and label hints
- Flow Intelligence for inflow/outflow bias
- Holder concentration and Flow Intelligence in radar scoring
- Alpha signal heuristics for winning-wallet hints, new-wallet growth, narrative context, seller pressure, and bb room topic status
- Token holders / Flow Intelligence for `/flow` deep dives
- Flow Judge classification and action line for fast Discord review
- Wallet label hints when Nansen holder rows include label/tag/category fields

## Positioning

- Unlike CA reaction bots, this bot tries to surface candidates before the CA is posted in the bb room.
- Unlike broad leaderboards, it intentionally limits output to a small number of candidates per scan.
- Holder concentration and Nansen Flow Intelligence can penalize candidates even when raw flow looks attractive.
- The bot shows operational health, Nansen REST status, and Nansen CLI status in Discord.
- Post-alert tracking turns the bot into a measurable product instead of a one-off signal feed.

## Discord Commands

- `/radar`: manual radar scan
- `/why <CA>`: explain why a Radar Call picked a CA in a few seconds
- `/flow <CA>`: deep-dive a candidate
- `/leaderboard`: show top tracked Radar Calls
- `/rejections`: show why weak candidates were filtered out
- `/criteria`: show extraction rules
- `/stats`: show today's Radar daily summary
- `/report`: show a short submission report in Discord
- `/config`: show non-secret runtime settings
- `/health`: check bot/Nansen/runtime health without exposing secrets
- `/export`: regenerate this `REPORT.md`

## Runtime Criteria

- Chain: Solana
- Market cap limit: $500.0K
- Token age limit: 30d
- Minimum bb reaction score: 88
- Radar display limit: 2 candidates/scan
- Minimum Smart Money traders: 3
- Auto alert cap: 8/day
- Dedupe window: 6h
- bb already-posted lookback: 300 messages
- Radar interval: 30 minutes
- Tracking interval: 15 minutes

## Operations

- During judging, the bot runs as a Node.js process on the developer machine.
- While running, it checks radar candidates every configured interval.
- A radar check does not always create a Discord post; the bot posts only when candidates pass the alert policy.
- Each automatic post shows only the configured display limit so the bb room stays readable.
- Daily alert caps and dedupe windows control noise.
- The same CA can reappear after the dedupe window only if it still passes the current conditions.
- The bb already-posted check scans recent Discord messages and skips candidates whose CA or symbol already appeared.
- It avoids duplicate alerts for the same CA within the dedupe window.
- It updates post-alert market-cap tracking every configured tracking interval.
- For long-running production use, the same process can move to Railway, Render, Fly.io, or a VPS.

## Safety

- Secrets are read from `.env` and are not committed.
- API keys and Discord tokens are not printed in Discord output.
- The bot does not execute trades.
- Discord permissions are intentionally minimal: view channel, send messages, embed links, read message history, and application commands.
- Daily alert limits and dedupe windows reduce spam risk.
- Radar display limits reduce noise during active market periods.
- Public-channel safety filtering removes suspicious/offensive/NSFW token symbols before display.

## AI Disclosure

OpenAI ChatGPT / Codex was used for product design, implementation support, debugging, and documentation drafting.

## Production Notes

- Nansen credit exhaustion or API errors can temporarily reduce live data quality.
- New-wallet growth, winning-wallet classification, CTO/Korea/CEX narrative detection, and top-holder sell pressure are implemented as heuristics and can be improved when richer endpoint fields are available.
- The bb already-posted check currently scans recent channel messages only.
- Further production hardening would add hosted deployment, persistent database storage, and richer per-wallet label mapping.

## Notes

- This is not financial advice.
- Final decisions should be checked with DexScreener, gmgn, and Nansen.
- Local raw alert history is stored in `data/alerts.json` and is not committed.
