# Hackathon Management

This is the execution control document for bb Native Alpha Radar.

Update this file whenever:

- a task is completed,
- a new risk is found,
- demo/submission evidence changes,
- runtime operations change,
- priorities change.

Do not use this file as a brainstorm. Use it to decide what happens next.

## Strategy

The goal is not only to build a Discord bot.

The real goal is:

- submit correctly,
- run reliably during judging,
- show a strong demo in under two minutes,
- increase winning probability,
- prove Nansen is used meaningfully and efficiently,
- make bb users feel this belongs inside their Discord flow.

The product must remain:

- pre-CA Radar,
- Discord-native,
- screenshot-first,
- Japanese-first in visible Discord UI,
- few high-quality signals,
- reaction/community-oriented,
- not a dashboard,
- not a price bot,
- not a trading assistant.

## Status Rules

Allowed statuses:

- `DONE`
- `NEXT`
- `IN PROGRESS`
- `BLOCKED`
- `NOT STARTED`

Owners:

- `User`
- `Codex`
- `ChatGPT`

Evidence types:

- `screenshot`
- `commit`
- `GitHub URL`
- `demo video`
- `form submitted`
- `check pass`
- `runtime proof`
- `manual review`

Only mark an item `DONE` when the evidence exists.

## Strict Next-Action Queue

Single next task:

| Priority | Task | Status | Owner | Evidence required | Next action |
| - | - | - | - | - | - |
| P0 | Submit hackathon form | NEXT | User | form submitted | Use GitHub URL, `SUBMISSION_FORM_DRAFT.md`, and the committed screenshot bundle in `docs/submission-assets/`. |

Next 3 tasks:

| Priority | Task | Status | Owner | Evidence required | Next action |
| - | - | - | - | - | - |
| P1 | Optional: record demo video | NEXT | User | demo video | Recommended for judge clarity, but skip if time is tight. |
| P1 | Optional: draft intro X post | NEXT | ChatGPT | GitHub URL | Optional boost only after the form is ready. |

Must not be done yet:

- Do not add new features.
- Do not redesign `/radar` or `/flow` again unless a bug appears.
- Do not add new Nansen endpoints.
- Do not increase alert frequency.
- Do not change storage format.
- Do not reopen UI polish unless a bug appears in a real screenshot.

## P0 Must Finish Before Submission

| Task | Status | Owner | Evidence required | Next action |
| - | - | - | - | - |
| Primary repo unified to `C:\Users\hanam\OneDrive\ドキュメント\CODEX 260309\bb-native-alpha-radar` | DONE | Codex | runtime proof, commit | Keep all future work in this path only. |
| Codex always uses primary repo path | DONE | Codex | manual review | Check path before every command. |
| Real `.env` verified with `MOCK_MODE=false` | DONE | Codex | runtime proof | Do not expose secrets; verify only non-secret env lines when needed. |
| `/radar` Japanese-first UI reviewed | DONE | User | manual review | Do not revert visible Discord UI to English. |
| `/radar` dark mode screenshot reviewed | DONE | User | screenshot | Use as main screenshot candidate unless a better final one is captured. |
| `/radar` 3-second comprehension good enough | DONE | User | manual review | Treat `/radar` as locked unless bug appears. |
| CA secondary in `/radar` | DONE | User | manual review | Do not make CA the visual hero. |
| `/why` screenshot reviewed | DONE | User | screenshot | `/why` now matches the Radar reasoning surface and is ready for screenshot use. |
| UI philosophy alignment completed | DONE | User | manual review | `/radar`, `/why`, `/flow`, and `/leaderboard` now share one Radar-first product direction. |
| `Radar -> Verify -> Prove` flow finalized | DONE | User | manual review | Treat the command sequence and message hierarchy as locked for submission. |
| Japanese-first Discord UX finalized | DONE | User | manual review | Visible Discord UI should stay Japanese-first through submission. |
| Screenshot-first Discord presentation finalized | DONE | User | manual review | Treat screenshot readability as a fixed product rule, not a future polish item. |
| Nansen credit-efficiency pass | DONE | Codex | commit | Commit `f793e2d` capped enrichment and made `/health` REST-safe. |
| `/health` credit-safe behavior reviewed | DONE | Codex | commit | `/health` no longer spends a live Nansen REST call just to poll status. |
| `/health` screenshot reviewed | DONE | User | screenshot | Use this as CLI/Nansen proof in the final screenshot set. |
| `/flow` current screenshot reviewed | DONE | User | screenshot | `/flow` screenshot has been reviewed visually. |
| `/flow` final completion confirmed | DONE | User | screenshot, manual review | Latest `/flow` screenshot reviewed and accepted. |
| `npm.cmd run check:all` passed after latest pushed changes | DONE | Codex | check pass | Latest pass after `/flow` final polish. |
| Safe runtime start/stop documented | DONE | Codex | commit | README now defines foreground start, safe stop, primary repo path, and background caution. |
| Avoid bot running during development | DONE | Codex | commit | README now warns that scheduled scans can keep consuming Nansen credits during development. |
| Automatic 30-minute radar check verified | DONE | Codex | runtime proof, manual review | `data/scans.json` contains repeated `source: "auto"` entries and `data/alerts.json` contains `source: "auto"` alerts with Discord `messageId`. |
| Daily Summary auto-post verified | DONE | Codex | runtime proof | Discord post verified successfully. Current intended local setting is `DAILY_SUMMARY_ENABLED=true` at `23:50` JST; set false only when intentionally pausing scheduled summaries. |
| Required organizer proof: Discord bot works with Nansen CLI | DONE | User | screenshot | `/health` screenshot reviewed with Nansen CLI proof. |
| Required organizer proof: submission form submitted | NOT STARTED | User | form submitted | Submit only after README/REPORT/screenshots/video assets are ready. |
| Required organizer proof: GitHub URL or intro tweet URL | NEXT | User | GitHub URL | Use GitHub URL at minimum; intro tweet is optional boost. |
| Final GitHub URL ready | DONE | Codex | GitHub URL | GitHub main is current and README is submission-polished. |
| Submission form answer draft ready | DONE | Codex | commit | Use `SUBMISSION_FORM_DRAFT.md` as the source for final form entry. |
| Secrets and local data not committed | DONE | Codex | check pass | Final pre-submission repo check confirmed `.env` is ignored and runtime JSON files under `data/` are not tracked. |

## P1 Strongly Improves Winning Chance

| Task | Status | Owner | Evidence required | Next action |
| - | - | - | - | - |
| README final polish | DONE | Codex | commit | README now explains overview, setup, architecture, dependencies, demo flow, Nansen CLI requirement, and credit strategy. |
| REPORT refresh | DONE | Codex | commit | REPORT now reads as problem -> solution -> workflow -> value submission narrative. |
| Demo screenshot set | DONE | Codex | screenshot, commit | Required screenshots are committed in `docs/submission-assets/`; `/why` is included but replaceable for stronger impact. |
| Demo video | NEXT | User | manual review, demo video | Recommended because it raises judging clarity, but optional because the current repo and screenshot story are already strong. |
| Bot overview for submission form | DONE | Codex | commit | `SUBMISSION_FORM_DRAFT.md` now includes concise judge-facing overview and positioning. |
| Usage explanation for submission form | DONE | Codex | commit | `SUBMISSION_FORM_DRAFT.md` now explains the command flow and bb-native use case. |
| Code/architecture explanation | DONE | Codex | commit | README and REPORT now explain Gateway, Radar, Nansen adapter, storage, and tracking. |
| Setup steps verified from clean checkout | NOT STARTED | Codex | check pass | Verify README commands match actual repo. |
| Dependency list finalized | DONE | Codex | commit | README now explains Node.js, Nansen CLI, Discord API usage, and no Discord SDK dependency. |
| Intro tweet/post drafted | NOT STARTED | ChatGPT | GitHub URL | Draft after demo assets exist. |

## P2 Nice To Have

| Task | Status | Owner | Evidence required | Next action |
| - | - | - | - | - |
| JSON compatibility smoke tests | NOT STARTED | Codex | commit, check pass | Add only after P0 operational docs and final screenshots. |
| Radar Call continuity smoke test | NOT STARTED | Codex | commit, check pass | Verify IDs across `/radar`, `/why`, `/flow`, `/stats`, `/report`. |
| Credit exhaustion screenshot | NOT STARTED | User | screenshot | Capture only if naturally encountered or safe to simulate. |
| GitHub Issues/milestones setup | NOT STARTED | User | GitHub URL | Optional project polish after submission assets are ready. |
| `stop-bot.cmd` helper | DONE | Codex | commit | Added repo-scoped Windows stop helper for stray/background bot processes. |

## P3 Do Not Touch Unless Everything Else Is Done

| Task | Status | Owner | Evidence required | Next action |
| - | - | - | - | - |
| New commands | BLOCKED | Codex | commit | Do not add before submission unless user explicitly overrides. |
| New Nansen endpoints | BLOCKED | Codex | commit | Avoid credit and scope risk. |
| More auto alerts | BLOCKED | Codex | commit | Do not increase spam perception. |
| Dashboard-style views | BLOCKED | Codex | commit | Conflicts with Radar identity. |
| Trading/portfolio features | BLOCKED | Codex | commit | Forbidden for this project direction. |
| Storage format changes | BLOCKED | Codex | commit | Do not touch without compatibility plan. |

## Operational Issues

| Issue | Status | Owner | Evidence required | Next action |
| - | - | - | - | - |
| Foreground vs background bot runtime confusion | DONE | Codex | commit | Start/stop flow is documented and the start scripts now use the repo's absolute `src\index.js` path. |
| Restart/stop operation needs documentation | DONE | Codex | commit | README includes recommended start/stop method for development and demo use. |
| Avoid leaving bot running during development because of 30-minute scan credit use | DONE | Codex | commit | README explicitly warns about scheduled-scan credit use. |
| Automatic radar posting verification state unclear | DONE | Codex | manual review | Confirmed by `source: "auto"` scan history and saved auto alerts with Discord `messageId`. |
| Daily Summary verification state unclear | DONE | Codex | manual review | Verified by successful Discord post. Current intended local setting is ON at `23:50` JST. |
| Possible `stop-bot.cmd` task | DONE | Codex | commit | Added because it clearly reduces stray-process confusion on Windows. |
| Visible Discord UI must remain Japanese-first | DONE | Codex | commit | Keep this as hard guardrail. |
| Codex must always use primary repo path | DONE | Codex | manual review | Verify cwd/path before commands. |
| `HACKATHON_MANAGEMENT.md` must update whenever task/risk changes | IN PROGRESS | Codex | commit | Keep this file current before and after major tasks. |

## Definitions Of Done

### `/radar`

DONE when:

- Japanese-first visible UI is reviewed.
- Dark mode screenshot is reviewed.
- Strong signal and no-signal states are understandable in 3 seconds.
- CA is secondary.
- Buttons still work.
- `npm.cmd run check:all` passes.

Current status: `DONE`.

### `/flow`

DONE when:

- Latest Discord dark mode screenshot is reviewed after commit `0c9b0e8`.
- Screen reads as Radar follow-up, not dashboard.
- Reading order is: what is happening, what to check, risk, Nansen evidence, CA.
- CA is secondary.
- Buttons still work.
- `npm.cmd run check:all` passes.

Current status: `DONE`.

### Nansen Credit

DONE when:

- `/radar` enrichment is capped to likely Radar Calls.
- bb already-posted candidates are filtered before deep enrichment when possible.
- `/health` avoids unnecessary live REST credit use.
- `/flow <CA>` remains a user-requested deep dive.
- Credit strategy is documented.
- `npm.cmd run check:all` passes.

Current status: `DONE`.

### README / REPORT

DONE when:

- README explains bot overview, usage, architecture, setup, dependencies, Nansen CLI requirement, and credit efficiency.
- REPORT reflects final behavior and submission story.
- GitHub URL points to final pushed code.
- No secrets or local data are committed.

Current status: `DONE` for documentation polish. Clean-checkout verification is still separate.

### Demo Screenshots

DONE when:

- `/health` screenshot exists.
- `/radar` screenshot exists.
- `/why <CA>` screenshot exists.
- `/flow <CA>` screenshot exists.
- `/rejections` screenshot exists.
- `/stats` screenshot exists.
- `/report` screenshot exists.
- Screenshots are Discord dark mode and CA is not the visual hero.

Current status: `DONE`. Required screenshots are committed in `docs/submission-assets/`.

### Demo Video

DONE when:

- Video shows the bot running with Nansen CLI.
- Video shows `Radar -> Verify -> Prove -> Community`.
- Video is short enough for judges to finish.
- No secrets or private data are visible.

Current status: `NOT STARTED`. It is recommended, not required.

### Submission Form

DONE when:

- Required form is submitted.
- GitHub URL or intro tweet URL is included.
- Discord bot with Nansen CLI requirement is clearly explained.
- Bot overview, usage, architecture, setup, demo video, and dependencies are included where possible.

Current status: `NOT STARTED`.

## Submission Requirements

Required by organizer:

| Requirement | Status | Owner | Evidence required | Next action |
| - | - | - | - | - |
| Discord bot works with Nansen CLI | DONE | User | screenshot | `/health` screenshot reviewed with CLI OK. |
| Submission form | NOT STARTED | User | form submitted | Fill after final GitHub/docs/demo assets. |
| GitHub URL or intro tweet URL | NEXT | User | GitHub URL | Use GitHub URL minimum; add intro tweet if ready. |

## Final Submission Readiness Review

Current readiness: `READY EXCEPT FORM SUBMISSION`

Submission-ready once this is complete:

- actual form submission

Strongest differentiators:

- pre-CA Radar identity instead of price-bot behavior
- Nansen Smart Money used for decision quality, not decoration
- low-noise filtering and visible rejection reasons
- Japanese-first Discord UX built for screenshots
- `Radar -> Verify -> Prove -> Community` loop with Radar Call continuity

Weakest points before submission:

- demo video is not created yet
- intro post is still optional and not drafted

Final recommendation:

- do not change runtime code or Discord UI unless a real bug appears
- submit with GitHub URL as the required link
- treat demo video as recommended, not blocking
- treat X / intro post as optional, not blocking

## Submission Assets

Verified assets ready now:

- `/health` screenshot proving bot + Nansen CLI state
- `/radar` screenshot proving Japanese-first Radar surface
- `/why <CA>` screenshot proving why Radar reacted
- `/flow <CA>` screenshot proving Verify follow-up flow
- committed screenshot directory: `docs/submission-assets/`
- `README.md`
- `REPORT.md`
- `SUBMISSION_FORM_DRAFT.md`
- `SUBMISSION_ASSET_BUNDLE.md`
- GitHub repository URL
- `npm.cmd run check:all` pass

Assets still to finalize before submission:

- optional X / intro post URL
- optional demo video URL

Required commands to keep ready during judging:

- `/health`
- `/radar`
- `/why <CA>`
- `/flow <CA>`
- `/leaderboard`
- `/rejections`
- `/stats`
- `/report`

Operational proof points:

- bot runs from the unified primary repo
- Nansen CLI is installed and visible in `/health`
- safe start/stop scripts exist
- `MOCK_MODE=false` is already verified for the real runtime
- Daily Summary is verified and intentionally enabled in local `.env` at `23:50` JST

Nansen proof points:

- discovery uses Smart Money + Token Screener
- `/flow <CA>` is the explicit deep-verify step
- `/health` is credit-safe and does not burn live REST credits just to poll status
- credit-efficient filtering is part of product design, not a demo-only trick

Evaluation boosters:

| Booster | Status | Owner | Evidence required | Next action |
| - | - | - | - | - |
| Bot overview | DONE | Codex | commit | `SUBMISSION_FORM_DRAFT.md` includes the non-price-bot positioning. |
| Usage explanation | DONE | Codex | commit | `SUBMISSION_FORM_DRAFT.md` explains `/health`, `/radar`, `/why`, `/flow`, `/leaderboard`, `/rejections`, `/stats`, and `/report`. |
| Code/architecture explanation | DONE | Codex | commit | README and REPORT now explain the runtime shape, Nansen use, local storage, and tracking loop. |
| Setup steps | DONE | Codex | commit | README documents install, Nansen CLI, `.env`, start/stop, and checks. |
| Demo video | NEXT | User | manual review, demo video | Recommended but optional; record after the screenshot bundle is organized if time permits. |
| Dependency list | DONE | Codex | commit | README documents Node.js, Nansen CLI, Discord API usage, and runtime assumptions. |

## Demo Scenario

Command order:

1. `/health`
2. `/radar`
3. `/why <CA>`
4. `/flow <CA>`
5. `/leaderboard`
6. `/rejections`
7. `/stats`
8. `/report`

Recommended judge demo flow:

- `/health`: prove runtime + Nansen CLI first
- `/radar`: show the current Radar state screen
- `/why <CA>`: explain why Radar cared
- `/flow <CA>`: show how to verify, with CA still secondary
- `/leaderboard`: prove Radar Calls can matter after alert time
- `/rejections`: prove the bot stays selective
- `/stats`: show daily memory and operating discipline
- `/report`: close with the submission narrative

Judge framing:

- This is not a price bot.
- It is a pre-CA Radar for the bb Discord room.
- It can intentionally stay silent when weak signals appear.
- Nansen is used for Smart Money discovery and focused verification.
- Credit efficiency matters because the bot is designed for real Discord use, not demo spam.

Demo video decision:

- Status: `RECOMMENDED`
- Reason: not required by the organizer, but it materially improves judging clarity because this product is a command flow, not a static artifact.
- Current judgment: the repo is already credible with screenshots, README, REPORT, and GitHub URL, so submission is possible without a video; a short video still improves winning probability.

## Current Risks

| Risk | Status | Owner | Evidence required | Next action |
| - | - | - | - | - |
| Runtime confusion between foreground/background bot processes | DONE | Codex | commit | Start/stop flow and repo-scoped stop scripts are documented. |
| Bot left running during development may spend Nansen credits every scan interval | DONE | Codex | commit | README warns about scheduled-scan credit use during development. |
| `/flow` final UI not explicitly approved after latest polish | DONE | User | screenshot | Latest `/flow` screenshot reviewed and accepted. |
| `/why` final UI not explicitly approved after latest polish | DONE | User | screenshot | Latest `/why` screenshot reviewed and accepted. |
| README/REPORT not yet submission-ready | DONE | Codex | commit | README and REPORT have been polished for judge-facing submission narrative. |
| Demo screenshots not yet bundled as one final judge set | DONE | Codex | screenshot, commit | `docs/submission-assets/` now contains the required screenshots and final order. |
| Demo video not yet decided | NEXT | User | manual review | Recommended but not required; record only after screenshots are clean and time remains. |
| Submission form answers not ready | DONE | Codex | commit | `SUBMISSION_FORM_DRAFT.md` now stores the prepared form answers. |
| Submission form not submitted | NEXT | User | form submitted | Submit after final asset bundle and readiness review are complete. |

## Change Log Evidence

Recent evidence:

- `4e7e397`: Japanese-first `/radar` wording.
- `f793e2d`: Nansen credit-efficiency pass.
- `837c96a`: `/flow` verification UI polish.
- `0c9b0e8`: `/flow` tracking wording refinement.
- `19e4fdd`: safe bot runtime operation docs and stop scripts.
- `233da86`: `/why` final polish.
- `fc9cf39`: submission-readiness tracker sync.
- `8bce29f`: submission form draft and tracker update.
- `3cbabc1`: final submission asset bundle doc.
- This commit: final submission readiness review.
- This commit: committed submission screenshots and hardened asset bundle.
- This commit: replaced `03-why.png` with the latest Japanese-first screenshot.

Latest required check:

- `npm.cmd run check:all` must pass after any code or docs change before push.
