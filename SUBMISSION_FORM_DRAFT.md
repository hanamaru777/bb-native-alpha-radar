# Hackathon Submission Form Draft

Use this as the source text for the final hackathon submission form.

## Project Name

bb Native Alpha Radar

## One-Line Description

A Discord-native pre-CA Solana Radar that uses Nansen Smart Money signals to surface a few early bb-relevant candidates, then guides verification and tracks what happened afterward.

## Short Summary

bb Native Alpha Radar is not a price bot, trading assistant, or generic token scanner. It is a low-noise Discord workflow for Japanese bb users: Radar finds early Smart Money movement, Verify explains what to check, Prove tracks post-alert outcomes, and Community turns each Radar Call into a shared discussion object.

## Longer Summary

Most token bots become useful after a contract address is already spreading. bb Native Alpha Radar looks one step earlier: it watches Solana lowcap movement through Nansen Smart Money, Token Screener, and DEX context, then keeps the Discord output intentionally small.

The bot is designed around the loop `Radar -> Verify -> Prove -> Community`.

`/radar` shows the current Radar state. If signals are weak, it stays quiet instead of forcing an alert. `/why <CA>` explains why Radar cared. `/flow <CA>` gives a focused verification view with DexScreener, gmgn, and Nansen links. `/leaderboard`, `/stats`, `/rejections`, and `/report` turn saved Radar Calls into proof, memory, and community context.

The product is built for Discord screenshots and fast room decisions, not dashboards. CA is present for verification, but it is intentionally secondary.

## Problem It Solves

Alpha Discord rooms are fast and noisy. Many bots increase the noise by posting every possible token, often after the CA is already circulating.

bb Native Alpha Radar solves a narrower problem: help the room notice early Smart Money activity before it becomes a bb-wide narrative, while filtering weak candidates and making the verification path obvious.

The value is not more alerts. The value is disciplined attention.

## Why Nansen Matters

Nansen is the signal engine behind the Radar.

The bot uses Nansen for:

- Smart Money netflow
- Smart Money DEX trades
- Token Screener context
- holder and wallet-label checks during focused verification
- Flow Intelligence during `/flow <CA>`
- Nansen CLI proof through `/health`

Nansen matters because it helps decide whether a candidate deserves attention before the room has already started talking about it.

## Why This Is Differentiated

bb Native Alpha Radar is differentiated by restraint.

It is not trying to be a dashboard or a high-volume alert feed. It is built around a few high-quality signals, Japanese-first Discord UI, screenshot readability, Radar Call IDs, visible rejection reasons, and post-alert tracking.

It shows both sides of the decision: the candidates Radar noticed and the candidates it refused to send.

## Why Low-Noise Matters

In a Discord alpha room, spam quickly destroys trust. A bot that always posts something teaches users to ignore it.

This bot treats silence as product value. If signals are weak, `/radar` can show a no-strong-signals state. `/rejections` makes that filtering visible, so judges and users can see why the bot did not post low-quality candidates.

## What Makes It bb-Native

The bot is designed for bb Discord culture:

- Japanese-first visible UI
- fast three-second reading
- screenshot-first presentation
- CA secondary, not the visual hero
- Radar Call IDs for shared discussion
- reaction/community-oriented workflow
- low-noise signals instead of constant alerts
- proof commands that make the room remember what Radar called

It feels like bb noticing early movement together, not like opening an analytics terminal.

## Command Overview

- `/health`: proves the bot is running and Nansen CLI is available.
- `/radar`: shows the current Radar state and selected candidates, or explains that weak signals were filtered.
- `/why <CA>`: explains why Radar thought one candidate mattered.
- `/flow <CA>`: gives the focused verification flow with Nansen and market context.
- `/leaderboard`: shows Radar Calls that produced meaningful post-alert moves.
- `/rejections`: shows why weak/noisy candidates were skipped.
- `/stats`: summarizes daily Radar activity and tracking.
- `/report`: presents the project narrative inside Discord.

## Recommended Judge Demo Flow

1. `/health`
2. `/radar`
3. `/why <CA>`
4. `/flow <CA>`
5. `/leaderboard`
6. `/rejections`
7. `/stats`
8. `/report`

This order proves runtime first, then Radar, then Verify, then Prove, then filtering discipline, then the final submission narrative.

## GitHub Link Placeholder

GitHub: `https://github.com/hanamaru777/bb-native-alpha-radar`

## X / Demo Link Placeholder

X / intro post: `TODO`

Demo video: `TODO`

## Setup Summary

Runtime requirements:

- Node.js `>=22`
- Nansen CLI installed globally
- Nansen API key
- Discord bot token, client ID, channel ID, and optional guild ID

Setup flow:

1. `npm install`
2. `npm install -g nansen-cli`
3. `nansen login --human`
4. copy `.env.example` to `.env`
5. fill Discord and Nansen environment variables
6. run `npm.cmd run check:all`
7. start with `.\start-bot.cmd`

## Operational Safety Summary

The bot does not trade, does not provide buy/sell calls, and does not output entries, exits, or targets.

Secrets are loaded from `.env` and are not committed. Local JSON data is ignored by git. The repo includes Windows-friendly start/stop scripts, and the README warns not to leave the bot running during development because scheduled scans can spend Nansen credits.

Nansen usage is credit-conscious: broad scans happen first, deep enrichment is capped to likely Radar Calls, `/flow <CA>` is a user-requested deep dive, and `/health` avoids spending live REST credits just to poll status.

## Recommended Submission Assets

- GitHub repository URL
- README.md
- REPORT.md
- `/health` screenshot showing bot + Nansen CLI proof
- `/radar` screenshot showing the Radar state screen
- `/why <CA>` screenshot showing Radar reasoning
- `/flow <CA>` screenshot showing focused verification
- `/leaderboard` screenshot showing post-alert proof
- `/rejections` screenshot showing low-noise filtering
- `/stats` screenshot showing Radar memory
- `/report` screenshot showing the project narrative
- optional short demo video using the recommended judge demo flow

## Strongest Positioning

bb Native Alpha Radar is a pre-CA Discord Radar for bb culture. It uses Nansen to notice early Smart Money movement, but its main product decision is restraint: few high-quality signals, visible rejection reasons, verification before action, and proof after the call.

This is not a price bot. It is not a spam alert bot. It is not a generic scanner.

It is an early-signal Radar built for Discord rooms that need attention, context, and memory.
