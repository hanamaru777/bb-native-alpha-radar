# bb Native Alpha Radar Winning Plan

This file tracks the hackathon-winning strategy.

For end-to-end submission tracking, see `HACKATHON_MANAGEMENT.md`.
For non-negotiable product guardrails, see `docs/GUARDRAILS.md`.

## Winning Strategy

The bot wins by being the clearest pre-CA Radar for the bb room.

It should feel like:

- A selective Discord Radar.
- A Nansen-powered early detection loop.
- A community object built around Radar Call IDs.
- A proof system that records hits, misses, rejections, and reactions.

It should not feel like:

- A price bot.
- A dashboard.
- A trading assistant.
- A generic token screener.

## Core Loop

`Radar -> Verify -> Prove -> Community`

Demo translation:

1. `/radar` finds a pre-CA candidate or says no.
2. `/why <CA>` explains the saved Radar Call in three seconds.
3. `/flow <CA>` verifies one candidate with Nansen.
4. `/rejections` shows that the bot filters weak signals.
5. `/stats` and `/leaderboard` prove what happened after alerts.
6. Community reactions capture bb sentiment.

## Top Five Priorities

1. Three-second Discord readability.
2. Screenshot-first dark mode output.
3. Few high-quality signals.
4. Visible but credit-efficient Nansen usage.
5. Radar Call ID continuity across every proof surface.

## What To Show First

If Nansen and the bot are healthy:

1. `/health`
2. `/radar`
3. `/why <CA>`
4. `/flow <CA>`
5. `/rejections`
6. `/stats`
7. `/report`

If no strong candidate exists:

1. Show `/radar` saying "今は見送り".
2. Show `/rejections`.
3. Explain that saying no is part of the product.

## Immediate Runtime Settings

Recommended judging defaults:

- `MIN_BB_SCORE=88`
- `RADAR_DISPLAY_LIMIT=2`
- `MAX_DAILY_ALERTS=8`
- `DEDUPE_HOURS=6`

Reason:

- Weak watch candidates should not appear in the main feed.
- It is better to miss a marginal token than to spam the room.
- During judging, selectivity looks more professional than volume.

## Do Not Do

- Do not add trading execution.
- Do not add buy/sell/entry/target language.
- Do not add `/demo` as a shortcut around the real product.
- Do not spam `/radar` while credits are limited.
- Do not make CA the visual hero.
- Do not copy other bots' exact wording or design.
- Do not add more data fields unless they improve the three-second Radar decision.

## Implementation Phases

1. Direction lock and management docs.
2. `/radar` screenshot UX polish.
3. Nansen credit efficiency.
4. Data compatibility and Radar Call continuity smoke tests.
5. `/flow`, `/stats`, and `/rejections` polish.
6. README architecture/setup/dependency polish.
7. REPORT refresh and demo asset preparation.
8. Final `npm.cmd run check:all`, GitHub push, and submission form.

## Judge Pitch

bb Native Alpha Radar gives bb a reason to open Nansen from inside Discord.

It does not chase price. It catches early Smart Money attention, asks the room to verify, and records whether the Radar Call mattered.

That makes it a Discord-native Nansen workflow, not just another token feed.
