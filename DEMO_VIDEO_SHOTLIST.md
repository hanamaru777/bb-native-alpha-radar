# Demo Video Shotlist

Target runtime: 90 seconds.
Maximum runtime: 120 seconds.

Use this as the export checklist.

## Shot-by-Shot Plan

| Shot | Time | Screen | Command / Action | What judges should understand | Pass / Fail |
| - | -: | - | - | - | - |
| 1 | 0-8s | Discord channel | Show bot context | This is a Discord-native bot, not a dashboard. | Pass if bot name and Discord UI are clear. |
| 2 | 8-18s | `/health` | Type or show `/health` | Nansen CLI and runtime are working. | Pass if Nansen CLI proof is visible. |
| 3 | 18-35s | `/radar` | Type or show `/radar` | Radar makes a concise state judgment. | Pass if top Radar state is readable in 3 seconds. |
| 4 | 35-50s | `/why <CA>` | Use CA from Radar Call | Radar explains why it reacted. | Pass if reasoning is short and Japanese-first. |
| 5 | 50-68s | `/flow <CA>` | Use same CA | Verification comes before action. | Pass if DexScreener / gmgn / Nansen buttons are visible. |
| 6 | 68-82s | `/leaderboard` | Show proof results | Radar Calls are tracked after alert time. | Pass if post-alert proof is visible. |
| 7 | 82-97s | `/rejections` | Show filter reasons | The bot avoids weak/noisy candidates. | Pass if rejection reasons are visible. |
| 8 | 97-110s | `/stats` | Show daily summary | The bot builds daily Radar memory. | Pass if daily stats are readable. |
| 9 | 110-120s | `/report` or GitHub | Close with repo/story | Submission narrative and repo are ready. | Pass if it ends cleanly before 120s. |

## Mandatory Messages To Land

The final video should clearly communicate:

- This is not a generic price bot.
- It is a bb-native pre-CA Radar.
- Nansen Smart Money is used in filtering and verification.
- Low noise matters as much as detection.
- `/rejections` proves the bot can stay quiet.
- The workflow is `Radar -> Verify -> Prove -> Community`.
- Visible Discord UX is Japanese-first and screenshot-ready.

## Pass/Fail Checklist Before Export

Pass only if all are true:

- Video is under 120 seconds.
- First 10 seconds explain the product clearly.
- No secrets are visible.
- No `.env` is visible.
- Discord dark mode is used.
- `/health` shows Nansen CLI proof.
- `/radar` appears before deeper commands.
- `/why` and `/flow` use the same CA.
- `/leaderboard` or `/stats` shows proof/history.
- `/rejections` is shown as low-noise proof.
- The narration does not say buy, sell, entry, exit, or target.
- The video ends with GitHub/submission readiness, not token hype.

## Common Failure Cases

Redo the take if:

- The first 10 seconds feel like a price bot.
- The video spends too long on raw numbers.
- CA becomes the visual hero.
- The recording shows private data.
- The cursor moves too much.
- The screen is too small to read.
- The take exceeds two minutes.

## Best Final Export

Recommended filename:

```text
bb-native-alpha-radar-demo.mp4
```

Recommended upload description:

```text
A 90-second walkthrough of bb Native Alpha Radar: a Japanese-first Discord pre-CA Radar using Nansen Smart Money to filter early Solana signals, guide verification, and prove outcomes after Radar Calls.
```
