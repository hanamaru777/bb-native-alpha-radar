# Project Guardrails

This document locks the product direction for `bb Native Alpha Radar`.

## Must Become

`bb Native Alpha Radar` must become a Discord-native pre-CA Radar for bb culture.

It should:

- Detect early Solana lowcap meme candidates before they become bb-wide CA narratives.
- Use Nansen Smart Money, holders, and Flow Intelligence only where they help the Radar decision.
- Show a few high-quality signals instead of many weak candidates.
- Make the loop obvious: `Radar -> Verify -> Prove -> Community`.
- Preserve Radar Call IDs as shared community objects.
- Prove outcomes through tracking, rejections, stats, reports, and reactions.
- Feel useful in a Discord screenshot within three seconds.

## Must Not Become

The bot must not become:

- A price bot.
- A trading bot.
- A buy/sell signal service.
- A generic token analytics dashboard.
- A high-volume alert feed.
- A raw Nansen data dump.
- A CA-first link poster.
- A long-form market commentary tool.

## Direction Risks

The biggest risks are:

- Adding too many fields until `/radar` feels like a dashboard.
- Increasing alert frequency or display limits until the bot feels spammy.
- Overusing Nansen credits on candidates that will not become Radar Calls.
- Making CA the largest visual element.
- Letting max gain or market cap become the product hero.
- Breaking Radar Call continuity or local JSON compatibility.
- Treating `/stats` as raw metrics instead of a daily Radar summary.

## Winning Strategy

The winning strategy is restraint.

The bot should win because it is the clearest Discord-native Nansen workflow for bb:

1. Radar catches a pre-CA candidate.
2. The card explains the reason in three seconds.
3. The user verifies through DexScreener, gmgn, and Nansen.
4. `/flow` deep-dives only the candidate the user cares about.
5. `/stats`, `/leaderboard`, `/rejections`, and reactions prove what happened.

The product should look selective, accountable, and native to the bb room.

## Implementation Priority Order

1. Lock documentation and repo direction.
2. Improve `/radar` screenshot readability.
3. Reduce unnecessary Nansen enrichment.
4. Harden Radar Call ID and JSON compatibility.
5. Polish `/flow`, `/stats`, and `/rejections` without dashboard creep.
6. Update README, REPORT, and demo checklist.
7. Add smoke tests for formatting and local JSON compatibility.

## Project Management Recommendations

Suggested labels:

- `P0`
- `P1`
- `P2`
- `docs`
- `discord-ux`
- `nansen-credit`
- `storage-compat`
- `radar-philosophy`
- `demo-readiness`
- `safety`

Suggested milestones:

- `Direction Lock`
- `Screenshot UX Polish`
- `Nansen Credit Efficiency`
- `Proof and Compatibility`
- `Hackathon Demo Readiness`

Suggested issue categories:

- Guardrail and documentation
- Discord command UX
- Nansen credit efficiency
- Storage compatibility
- Demo readiness
- Safety and operations
