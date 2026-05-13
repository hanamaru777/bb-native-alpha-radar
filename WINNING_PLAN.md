# bb Native Alpha Radar Winning Plan

This file tracks what matters for winning the hackathon.

## Current Strategy

The bot should win by being the cleanest "pre-CA alpha radar" for the bb altcoin room.

Core positioning:

- Not a price bot
- Not a general risk bot
- Not a news bot
- A selective Nansen Smart Money radar that posts before bb starts talking about a CA

## Immediate Settings

- `MIN_BB_SCORE=88`
- `RADAR_DISPLAY_LIMIT=2`
- `MAX_DAILY_ALERTS=8`
- `DEDUPE_HOURS=6`

Reason:

- Weak watch candidates should not appear in the main feed.
- It is better to miss a marginal token than to spam the room with doubtful signals.
- During judging, selectivity looks more professional than volume.

If the market is quiet:

- Temporarily lower `MIN_BB_SCORE=85`
- Return to `88` before screenshots or judging

## Rival Bot Observations

### leidream / Flow Scanner

What looks strong:

- Score breakdown is visual.
- Candidates have clear zones such as strong watch and speculation.
- It shows cohort and data quality.

What we adapted:

- Added a compact `Signal stack` to the Radar card.
- Kept our own scoring language: Smart Money, Flow, Holder, Freshness.

What we should not copy:

- Their score block is larger and can become visually heavy.
- Our bot should stay faster to scan.

### demo / Meme Edge Alert

What looks strong:

- Clear quality gate.
- Clear source and risk checks.
- Good "why detected" section.

What we already do:

- Radar has "なぜ今見るか" and "警戒".
- Flow has action line and summary.

Improvement idea:

- Keep showing why the token matters now, not just raw metrics.

### mitsuri / Signal Review

What looks strong:

- Nice card layout.
- Token image makes the feed more visually attractive.
- Confidence is obvious.

What we might add later:

- Token image thumbnail from market data if it is cheap and reliable.

Why not now:

- Extra image fetches can add fragility.
- The current priority is credit-saving and stable judging.

### mol / roster and webhook tools

What looks strong:

- Operational depth.
- Shows DB, roster, sync, and automation.

What we already do:

- `/health`
- `/stats`
- tracking
- Nansen CLI check

Improvement idea:

- Emphasize operations in `/report` and README rather than adding complex commands.

### kumi / daily digest

What looks strong:

- Daily digest is useful for ongoing community consumption.

What we can do later:

- Add a daily digest only if time remains.

Why not urgent:

- Our differentiator is pre-CA Radar, not daily summary.

## Priority List

### Must Do

- Keep `MIN_BB_SCORE=88`.
- Use `/radar` sparingly after credits return.
- Capture screenshots of `/radar`, `/flow`, `/stats`, `/health`, `/report`.
- Run `/export` before final GitHub push.
- Push final GitHub repo only after the output looks clean.

### Should Do

- Watch whether the Radar card is too long on Discord.
- If too long, remove one low-value field, not the Nansen fields.
- If too many weak signals appear, set `RADAR_DISPLAY_LIMIT=1`.

### Could Do

- Add token image thumbnails if market data already returns them cheaply.
- Add daily digest after the main Radar flow is fully stable.

### Do Not Do

- Do not add trading execution.
- Do not add `/demo`.
- Do not spam `/radar` while credits are limited.
- Do not copy other bots' wording or exact design.

## Judge Pitch

bb Native Alpha Radar gives bb a reason to open Nansen from inside Discord.

The loop is:

1. Radar finds a pre-CA candidate.
2. The card explains why it matters.
3. The user checks DexScreener / gmgn / Nansen.
4. `/flow` gives a deeper Nansen view.
5. `/stats` proves whether the signal moved after notification.

This is aligned with the hackathon goal: a Discord-native Nansen bot that can keep being used in the bb community.
