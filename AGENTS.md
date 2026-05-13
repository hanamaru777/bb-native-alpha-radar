# AGENTS.md

## Project Purpose

`bb Native Alpha Radar` is a Discord bot for the Nansen x bb CLI Hackathon.

It is **not** a post-CA price bot.
Its job is to detect **pre-CA Solana lowcap meme candidates** using Nansen Smart Money signals, explain why they matter, record what happened after the alert, and help bb build a repeatable Radar culture.

Core loop:

`Radar -> Verify -> Prove -> Community`

## Radar Philosophy

- Pre-CA first, not post-CA reaction
- Few high-quality calls, not noisy spam
- 3-second value recognition inside Discord
- Show both **why picked** and **why rejected**
- Preserve proof with post-alert tracking
- Make Nansen usage obvious and meaningful
- Fit bb room behavior, not generic dashboard behavior
- Build shared language through **Radar Call IDs**

## Direction Lock

This repo must stay a **pre-CA Discord Radar**, not a generic analytics product.

Future changes must protect these constraints:

- The first screen is always a Radar judgment, not a dashboard.
- The bot should post a few high-quality signals, not many medium signals.
- Nansen should be used where it changes the Radar decision, not as a raw data dump.
- CA is required for verification, but it must not become the visual hero.
- Radar Call IDs must remain stable across `/radar`, `/why`, `/flow`, `/leaderboard`, `/stats`, and `/report`.
- `alerts.json` and `scans.json` must remain backward-compatible.
- Alert caps, dedupe, and bb already-posted filtering must stay intact unless the user explicitly asks to change them.

If a proposed change makes the bot feel more like a dashboard, price bot, or trading assistant, do not implement it.

## Command Roles

- `/radar`: what to look at now
- `/why <CA>`: why Radar picked it, in 3 seconds
- `/flow <CA>`: deeper verification before touching
- `/leaderboard`: detailed post-alert winners
- `/rejections`: detailed noise filter / skipped candidates
- `/stats`: today's Radar daily summary
- `/report`: submission/judging summary
- `/criteria`: extraction and score rules
- `/config`: runtime settings without secrets
- `/health`: bot / Nansen REST / Nansen CLI health
- `/export`: regenerate `REPORT.md`

## UI Principles

- Optimize for Discord screenshots
- Put conclusion first
- Keep cards short and scannable
- Separate: conclusion / evidence / next action
- Do not make CA the visual hero
- Prefer natural Japanese over overhyped marketing tone
- Keep NFA / DYOR short but present
- `/stats` is daily summary, not raw metrics dump
- `/leaderboard` is detailed proof, not daily summary
- `/rejections` is filtering judgment, not failure log

## Nansen Credit Principles

- Prefer fewer calls with clearer product value.
- Enrich only candidates that may realistically become Radar Calls.
- Do not add repeated live Nansen calls to passive/status commands without a strong reason.
- `/flow <CA>` may use deeper Nansen checks because the user explicitly asked to verify one CA.
- Credit exhaustion must degrade the output gracefully and must not crash the bot.

## Codex Workflow

1. Read current code before changing behavior
2. Reuse existing storage, Radar card, and adapter patterns
3. Prefer minimal-change extensions over rewrites
4. Keep Nansen-credit usage low
5. Test with local/static checks when possible
6. Run `npm run check:all` after meaningful changes
7. Update `README.md`, `REPORT.md`, and command/help text when product behavior changes
8. For direction/product changes, update `docs/GUARDRAILS.md`, `docs/COMMAND_UX.md`, or `docs/NANSEN_USAGE.md` first

## Safety Rules

- Never expose API keys or Discord tokens
- Never add trading or execution features
- Never turn Radar into investment advice
- Nansen credit exhaustion must not crash the bot
- Keep alert caps, dedupe, and bb already-posted checks intact
- Avoid unnecessary network calls and repeated scans

## GitHub Workflow

- Keep commits focused and readable
- Push only after local checks pass
- Do not rewrite history unless explicitly asked
- Preserve user changes; do not revert unrelated work

## Must Not Break

- Existing slash commands
- Radar Call ID continuity
- `alerts.json` / `scans.json` compatibility
- Post-alert tracking flow
- Reaction tracking flow
- bb already-posted filtering
- Daily alert cap and dedupe behavior
- Discord-first readability
- The core identity: **pre-CA Radar, not price bot**

## Must Not Add Without Explicit Approval

- Trading execution, portfolio tracking, entries, exits, targets, or buy/sell advice
- High-frequency alerts or broad watchlists
- Dashboard-style tables as the main Radar surface
- Large CA-first layouts
- Heavy Nansen enrichment for every scanned row
- New storage formats that cannot read current local JSON history
