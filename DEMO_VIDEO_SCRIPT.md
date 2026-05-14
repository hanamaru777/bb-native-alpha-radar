# Demo Video Script

Goal: record a clear 60-120 second walkthrough for hackathon judges.

The video should feel like a real Discord workflow, not a trailer.

Target runtime: 90 seconds.
Hard limit: 120 seconds.
Best length: 75-95 seconds.

## Core Message

Say this in the first 10 seconds:

> bb Native Alpha Radar is not a price bot. It is a Japanese-first Discord Radar that uses Nansen Smart Money to catch early pre-CA Solana movement, then asks the community to verify before touching anything.

## Recording Setup

Use one Discord window in dark mode.

Recommended screen order:

1. Discord channel with bot commands
2. `/health`
3. `/radar`
4. `/why <CA>`
5. `/flow <CA>`
6. `/leaderboard`
7. `/rejections`
8. `/stats` or `/report`
9. GitHub README or submission asset bundle, only if time remains

Do not show `.env`, API keys, Discord tokens, terminal secrets, or Nansen API keys.

## Exact Command Flow

Use this exact order:

```text
/health
/radar
/why <CA>
/flow <CA>
/leaderboard
/rejections
/stats
/report
```

Use the same CA from `/radar` for `/why` and `/flow`.

If no new candidate appears during `/radar`, use a known Radar Call CA from the latest verified Discord screenshots or local runtime history. Do not show local JSON files on screen.

## 90-Second Narration Plan

### 0-10s: Positioning

Screen: Discord channel or `/health` result.

Narration bullets:

- This is not a price bot.
- This is a bb-native pre-CA Radar for Discord.
- It uses Nansen Smart Money signals to reduce noise before a CA spreads.

Zoom/highlight:

- Bot name
- `/health` Nansen CLI proof
- Discord dark mode UI

Do not spend time on:

- Long setup explanation
- Code files
- Token price discussion

### 10-25s: Runtime Proof

Screen: `/health`.

Narration bullets:

- The bot runs in Discord with Nansen CLI available.
- `/health` is credit-safe and checks runtime readiness without wasting live REST calls.
- Local secrets stay in `.env` and are not committed.

Zoom/highlight:

- Nansen CLI OK
- Bot OK
- Recent Radar state if visible

### 25-45s: Radar

Screen: `/radar`.

Narration bullets:

- `/radar` is the main state screen.
- It shows what Radar noticed, what to verify, and why weak signals were filtered.
- CA is intentionally secondary because this is not a link-posting bot.

Zoom/highlight:

- Top Radar state
- Japanese Radar notice / no-signal section
- Japanese verify-next section
- CA only briefly at the bottom

Do not spend time on:

- Reading every field aloud
- Explaining every number

### 45-62s: Why Radar Reacted

Screen: `/why <CA>`.

Narration bullets:

- `/why` answers why Radar thought this mattered.
- It keeps reasoning short: Smart Money, bb context, low-noise filter, and caution.
- This is evidence-first, not hype.

Zoom/highlight:

- Japanese reason section
- Japanese movement section
- Japanese verify-next section

### 62-78s: Verify Flow

Screen: `/flow <CA>`.

Narration bullets:

- `/flow` is the follow-up before touching anything.
- It connects DexScreener, gmgn, and Nansen verification.
- This is the Verify step in `Radar -> Verify -> Prove -> Community`.

Zoom/highlight:

- Japanese current-state tags
- Japanese verify section
- Buttons for DexScreener, gmgn, Nansen

### 78-95s: Proof Loop

Screen: `/leaderboard`.

Narration bullets:

- Radar Calls are saved and tracked after alert time.
- `/leaderboard` shows that Radar can prove what happened later.
- This turns alerts into community memory, not disposable pings.

Zoom/highlight:

- max move / tracked proof result
- Radar Call ID
- post-alert movement

### 95-110s: Low-Noise Proof

Screen: `/rejections`.

Narration bullets:

- `/rejections` matters because the bot must stay quiet when signals are weak.
- It shows why candidates were filtered: already posted, weak flow, holder risk, or low score.
- Silence is a product feature here.

Zoom/highlight:

- Top rejection reasons
- Filtered candidates

### 110-120s: Close

Screen: `/stats` or `/report`.

Narration bullets:

- The loop is Radar, Verify, Prove, Community.
- Japanese-first Discord UX makes it easy to screenshot and discuss in bb.
- The GitHub repo includes setup, architecture, screenshots, and submission notes.

Do not exceed 120 seconds.

## What Not To Spend Time On

- Do not explain every Nansen endpoint.
- Do not discuss buy/sell decisions.
- Do not compare token prices like a trading dashboard.
- Do not open `.env`.
- Do not show private Discord server settings.
- Do not linger on CA strings.
- Do not narrate the entire README.

## If Time Is Tight

Use this 60-second version:

1. 0-8s: This is not a price bot; it is a bb-native pre-CA Radar.
2. 8-18s: `/health` proves bot + Nansen CLI.
3. 18-35s: `/radar` shows the Radar state and low-noise decision.
4. 35-48s: `/flow <CA>` shows verification with Nansen and links.
5. 48-58s: `/leaderboard` proves post-alert tracking.
6. 58-60s: `/rejections` proves the bot filters noise.
