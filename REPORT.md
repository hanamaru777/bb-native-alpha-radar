# bb Native Alpha Radar Report

bb Native Alpha Radar is a Discord-native pre-CA Radar for Japanese bb Discord users.

It is not a price bot. It is not a trading assistant. It is a low-noise Radar that uses Nansen to help the bb community notice early Solana meme movement before a CA becomes the room narrative.

## Problem

Discord alpha rooms move quickly, but most token bots arrive after a CA is already circulating.

That creates two problems:

- The room gets noisy because many weak candidates look urgent.
- Users see links and numbers before they understand whether a signal is worth verifying.

bb Native Alpha Radar is built for the moment before that: Smart Money starts touching something, but the bb room has not yet turned it into a shared topic.

## Solution

The bot runs a disciplined Radar loop:

`Radar -> Verify -> Prove -> Community`

- `Radar`: Nansen Smart Money and lowcap screening surface a small set of early candidates.
- `Verify`: `/why <CA>` and `/flow <CA>` guide users to DexScreener, gmgn, and Nansen before touching anything.
- `Prove`: saved Radar Calls are tracked after alert time.
- `Community`: Radar Call IDs and reactions make each signal discussable inside bb.

The product value is not "more alerts." The product value is knowing when to stay quiet.

## Early Signal Philosophy

The bot tries to answer one question:

```text
What is Smart Money touching before bb starts talking about it?
```

It checks Solana lowcap candidates, recent Smart Money activity, token age, bb room history, holder concentration, and Nansen flow. A candidate can be downgraded or rejected even when raw flow looks interesting.

That restraint is the core product decision.

## Low-Noise Philosophy

The default `/radar` surface shows only a small number of candidates. If nothing is strong enough, the bot says so.

This matters for judging because it proves the bot is not a spam feed:

- weak candidates can be filtered,
- already-posted bb candidates can be skipped,
- outflow-biased candidates can be rejected,
- holder concentration can downgrade a candidate,
- `/rejections` makes the filter visible.

The bot is designed to protect attention, not fill a channel.

## Discord-First Philosophy

The visible Discord UI is Japanese-first because the target users are Japanese bb Discord users.

The surfaces are built for screenshots:

- `/radar` gives the state of the scan first.
- `/flow` acts as a Radar follow-up screen, not a dashboard.
- CA is shown as verification detail, not the hero.
- Buttons send users to DexScreener, gmgn, and Nansen.
- Long analysis is avoided unless the user asks for deeper verification.

## Why Nansen Matters

Nansen is not decorative in this project. It decides what deserves attention.

Used for Radar discovery:

- Smart Money netflow.
- Smart Money DEX trades.
- Token Screener.

Used for focused verification:

- Token holders.
- Wallet label hints.
- Flow Intelligence.

Used for hackathon requirement:

- Nansen CLI health/schema check with `nansen schema --pretty`.

## Credit-Efficiency Philosophy

The bot is designed for real Discord operation, not demo spam.

Current credit strategy:

- Base scan uses the broad Nansen sources.
- Recent bb history can reject already-posted candidates before deep enrichment.
- Deep holders/flow enrichment is capped to likely Radar Calls.
- `/flow <CA>` spends deeper Nansen calls only when a user explicitly asks for one CA.
- `/health` avoids spending a live Nansen REST call just to poll status.
- Passive proof commands prefer saved data.

This keeps Nansen usage impressive because it is decisive, not because it is excessive.

## Tracking And Proof Loop

Every saved alert receives a Radar Call ID.

That ID follows the candidate across:

- `/radar`
- `/why <CA>`
- `/flow <CA>`
- `/leaderboard`
- `/stats`
- `/report`

The bot records alert-time market cap, later market-cap checks, max gain, latest pair URL, and community reaction fields when available. This turns a Radar Call into a measurable object instead of a disposable chat message.

## Rejection Philosophy

`/rejections` is a product feature.

It shows why the bot did not alert:

- bb already posted it,
- Nansen flow was outflow-biased,
- holder concentration looked risky,
- Smart Money was too thin,
- score was below policy.

For bb culture, this is important. A Radar that can say no earns more trust than a bot that always finds something to post.

## Operational Safety

The repo includes Windows-friendly start/stop scripts:

- `start-bot.cmd`
- `start-bot.ps1`
- `stop-bot.cmd`
- `stop-bot.ps1`

Development guidance:

- run from the primary repo path,
- prefer foreground operation while testing,
- stop the bot after checks,
- avoid leaving it running unintentionally because scheduled scans can spend Nansen credits.

The bot does not expose secrets, does not execute trades, and does not provide buy/sell advice.

## Architecture

The implementation is intentionally small.

- `src/index.js`: Discord Gateway, slash command routing, scheduled Radar, tracking, daily summary.
- `src/radar.js`: candidate scoring, filtering, message formatting, report surfaces.
- `src/nansen.js`: Nansen REST adapter.
- `src/nansenCli.js`: Nansen CLI health/schema check.
- `src/store.js`: local JSON persistence and Radar Call IDs.
- `src/tracking.js`: post-alert DexScreener tracking.
- `src/reactions.js`: Discord reaction collection.
- `src/marketData.js`: DexScreener market data helper.

Local JSON memory:

- `data/alerts.json`
- `data/scans.json`
- `data/daily-summary.json`

These files are local operational memory and are not committed.

## Judge Demo

Recommended flow:

```text
/health
/radar
/why <CA>
/flow <CA>
/rejections
/stats
/leaderboard
/report
```

What the demo should prove:

- The bot runs with Nansen CLI.
- The bot is not a price bot.
- The bot can stay quiet when weak signals appear.
- Nansen powers both discovery and verification.
- Radar Call IDs preserve community memory.
- Tracking and rejections create accountability.

## Current Status

Completed:

- Primary repo unified.
- Japanese-first `/radar` UI reviewed.
- `/radar` dark mode screenshot reviewed.
- CA secondary in `/radar`.
- Nansen credit-efficiency pass.
- `/health` credit-safe behavior.
- Safe start/stop operation docs and scripts.
- `npm.cmd run check:all` passing after latest pushed changes.

Still needed before final submission:

- final `/health` screenshot,
- final `/flow` screenshot confirmation,
- demo screenshot set,
- demo video,
- submission form,
- GitHub URL or intro tweet URL in the form.

## Safety Notes

- This is not financial advice.
- Final decisions should be checked with DexScreener, gmgn, and Nansen.
- The bot does not execute trades.
- The bot does not provide entries, exits, targets, or buy/sell calls.
- Secrets live in `.env` and must never be committed.

## AI Disclosure

OpenAI ChatGPT / Codex was used for product design, implementation support, debugging, and documentation drafting.
