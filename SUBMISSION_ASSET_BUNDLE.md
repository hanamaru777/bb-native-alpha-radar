# Final Submission Asset Bundle

This file is the final bundle checklist for hackathon submission.

Use it together with `SUBMISSION_FORM_DRAFT.md` and `HACKATHON_MANAGEMENT.md`.

## Core Links

- GitHub URL: `https://github.com/hanamaru777/bb-native-alpha-radar`
- README: `README.md`
- REPORT: `REPORT.md`
- Submission form draft: `SUBMISSION_FORM_DRAFT.md`
- Screenshot directory: `docs/submission-assets/`

## Verified Screenshot Status

| Asset | Filename | Required | Status | Notes |
| - | - | - | - | - |
| `/health` | `docs/submission-assets/01-health.png` | Mandatory | COMMITTED | Nansen CLI proof. |
| `/radar` | `docs/submission-assets/02-radar.png` | Mandatory | COMMITTED | Best screenshot; main Radar state screen. |
| `/why <CA>` | `docs/submission-assets/03-why.png` | Mandatory | COMMITTED | Latest Japanese-first `/why` screenshot. |
| `/flow <CA>` | `docs/submission-assets/04-flow.png` | Mandatory | COMMITTED | Focused verification screen. |
| `/leaderboard` | `docs/submission-assets/05a-leaderboard.png` | Mandatory | COMMITTED | Strong proof screenshot. |
| `/leaderboard` continuation | `docs/submission-assets/05b-leaderboard.png` | Optional | COMMITTED | Use only if judges need to see more leaderboard entries. |
| `/rejections` | `docs/submission-assets/06-rejections.png` | Mandatory | COMMITTED | Low-noise filter proof. |
| `/stats` | `docs/submission-assets/07-stats.png` | Mandatory | COMMITTED | Daily Radar memory. |

## Recommended Screenshot Order

1. `02-radar.png`
2. `04-flow.png`
3. `03-why.png`
4. `05a-leaderboard.png`
5. `06-rejections.png`
6. `07-stats.png`
7. `01-health.png`

This order opens with the product story: Radar, Verify, Why, Prove, filtering discipline, daily memory, then Nansen CLI/API proof.

## Judge Demo Order

1. `/health`
2. `/radar`
3. `/flow <CA>`
4. `/why <CA>`
5. `/leaderboard`
6. `/rejections`
7. `/stats`

## Required Links Still Missing

- Submission form URL entry itself
- Optional X / intro post URL
- Optional demo video URL

## Demo Video Decision

Status: `RECOMMENDED`

Practical recommendation:

- Submit without blocking on video if time is tight.
- Record a short video if the screenshot bundle is clean and time remains.
- Keep it under two minutes and follow the judge demo order above.

Reason:

- The current repo already has a strong README, REPORT, tracker, and form draft.
- A video is not required for basic submission success.
- A short video still improves judging clarity because this product is a command flow, not a static page.

## Intro Post Decision

Status: `OPTIONAL`

Practical recommendation:

- Use the GitHub URL as the required link if that is faster.
- Add an intro post only if it can be done cleanly after the screenshot bundle is complete.

## Final Bundle Summary

Ready now:

- GitHub URL
- `README.md`
- `REPORT.md`
- `SUBMISSION_FORM_DRAFT.md`
- `docs/submission-assets/01-health.png`
- `docs/submission-assets/02-radar.png`
- `docs/submission-assets/03-why.png`
- `docs/submission-assets/04-flow.png`
- `docs/submission-assets/05a-leaderboard.png`
- `docs/submission-assets/05b-leaderboard.png`
- `docs/submission-assets/06-rejections.png`
- `docs/submission-assets/07-stats.png`

Still needed before submission:

- actual form submission
- optional demo video URL
- optional X / intro post URL

## Screenshot Review

Best screenshot:

- `02-radar.png`

Weakest screenshot:

- none in the recommended core bundle; `01-health.png` is operational proof rather than product UX.

Current judgment:

- `03-why.png` has been replaced with the latest Japanese-first screenshot.
- `/report` is intentionally excluded from the public-facing submission flow because `/flow`, `/leaderboard`, `/rejections`, `/stats`, and `/health` tell the story more clearly.

## Runtime Verification

- `MOCK_MODE=false` is verified for the real local runtime.
- Daily Summary auto-post is verified in Discord.
- Current intended local setting is `DAILY_SUMMARY_ENABLED=true`, `DAILY_SUMMARY_HOUR=23`, `DAILY_SUMMARY_MINUTE=50`, `DAILY_SUMMARY_TIMEZONE=Asia/Tokyo`.
- `.env` is local-only and must not be committed. Restart the bot after any `.env` change.

## Actual Submission Checklist

Required:

- GitHub URL: `https://github.com/hanamaru777/bb-native-alpha-radar`
- form answers from `SUBMISSION_FORM_DRAFT.md`
- mandatory screenshots from `docs/submission-assets/`
- README and REPORT available in the repo

Optional:

- demo video URL
- X / intro post URL
- `05b-leaderboard.png`

Recommended final flow:

1. Confirm `npm.cmd run check:all` passes.
2. Confirm `.env` and `data/` are not committed.
3. Submit GitHub URL and form answers.
4. Add demo video or X link only if already clean.

## Strongest Positioning

bb Native Alpha Radar is not a price bot, not a spam alert bot, and not a generic scanner.

It is a Discord-native pre-CA Radar for bb culture that uses Nansen Smart Money data to filter early signals, guide verification, and prove what happened after the call.
