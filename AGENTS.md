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

## Codex Workflow

1. Read current code before changing behavior
2. Reuse existing storage, Radar card, and adapter patterns
3. Prefer minimal-change extensions over rewrites
4. Keep Nansen-credit usage low
5. Test with local/static checks when possible
6. Run `npm run check:all` after meaningful changes
7. Update `README.md`, `REPORT.md`, and command/help text when product behavior changes

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
