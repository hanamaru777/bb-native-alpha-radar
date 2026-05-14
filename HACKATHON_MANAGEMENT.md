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
| P0 | Capture final `/health` screenshot | NEXT | User | screenshot | Run bot from primary repo with `.\start-bot.cmd`, then capture `/health` in Discord dark mode. |

Next 3 tasks:

| Priority | Task | Status | Owner | Evidence required | Next action |
| - | - | - | - | - | - |
| P0 | Capture final `/flow` screenshot and confirm completion | NOT STARTED | User | screenshot, manual review | Run `/flow <CA>` on a real candidate and confirm it feels like Radar follow-up, not dashboard. |
| P0 | Refresh README/REPORT for submission | NOT STARTED | Codex | commit, GitHub URL | Update overview, architecture, setup, dependency, Nansen CLI usage, and latest credit strategy. |
| P0 | Capture final `/health` screenshot | NOT STARTED | User | screenshot | Run bot from primary repo, run `/health`, capture Discord dark mode screenshot. |

Must not be done yet:

- Do not add new features.
- Do not redesign `/radar` or `/flow` again unless a bug appears.
- Do not add new Nansen endpoints.
- Do not increase alert frequency.
- Do not change storage format.
- Do not prepare final submission form until screenshots and README/REPORT are ready.

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
| Nansen credit-efficiency pass | DONE | Codex | commit | Commit `f793e2d` capped enrichment and made `/health` REST-safe. |
| `/health` credit-safe behavior reviewed | DONE | Codex | commit | `/health` no longer spends a live Nansen REST call just to poll status. |
| `/flow` current screenshot reviewed | DONE | User | screenshot | Current screenshot reviewed, but final completion is not explicitly confirmed. |
| `/flow` final completion confirmed | NOT STARTED | User | screenshot, manual review | Confirm latest `/flow` after commit `0c9b0e8` in Discord dark mode. |
| `npm.cmd run check:all` passed after latest pushed changes | DONE | Codex | check pass | Latest pass after `/flow` final polish. |
| Safe runtime start/stop documented | DONE | Codex | commit | README now defines foreground start, safe stop, primary repo path, and background caution. |
| Avoid bot running during development | DONE | Codex | commit | README now warns that scheduled scans can keep consuming Nansen credits during development. |
| Required organizer proof: Discord bot works with Nansen CLI | NOT STARTED | User | screenshot | Capture `/health` with Nansen CLI status. |
| Required organizer proof: submission form submitted | NOT STARTED | User | form submitted | Submit only after README/REPORT/screenshots/video assets are ready. |
| Required organizer proof: GitHub URL or intro tweet URL | NOT STARTED | User | GitHub URL | Use GitHub URL at minimum; intro tweet improves reach. |
| Final GitHub URL ready | NOT STARTED | Codex | GitHub URL | Ensure final push is clean and README is polished. |
| Secrets and local data not committed | NOT STARTED | Codex | check pass | Confirm before final submission push. |

## P1 Strongly Improves Winning Chance

| Task | Status | Owner | Evidence required | Next action |
| - | - | - | - | - |
| README final polish | NOT STARTED | Codex | commit | Add concise overview, setup, architecture, dependencies, demo flow, and Nansen CLI requirement. |
| REPORT refresh | NOT STARTED | Codex | commit | Refresh after README and final screenshots are stable. |
| Demo screenshot set | NOT STARTED | User | screenshot | Capture `/health`, `/radar`, `/why`, `/flow`, `/rejections`, `/stats`, `/report`. |
| Demo video | NOT STARTED | User | demo video | Record a short flow showing Nansen CLI, Radar, Verify, Prove, Community. |
| Bot overview for submission form | NOT STARTED | ChatGPT | form submitted | Draft concise judge-facing overview. |
| Usage explanation for submission form | NOT STARTED | ChatGPT | form submitted | Explain command flow and bb-native use case. |
| Code/architecture explanation | NOT STARTED | Codex | commit | Keep it simple: Gateway, Radar, Nansen adapter, storage, tracking. |
| Setup steps verified from clean checkout | NOT STARTED | Codex | check pass | Verify README commands match actual repo. |
| Dependency list finalized | NOT STARTED | Codex | commit | Explain Node 22, Nansen CLI, Discord REST/Gateway, no heavy framework. |
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

Current status: `NOT STARTED` for final confirmation.

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

Current status: `NOT STARTED`.

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

Current status: `NOT STARTED`, except `/radar` reviewed.

### Demo Video

DONE when:

- Video shows the bot running with Nansen CLI.
- Video shows `Radar -> Verify -> Prove -> Community`.
- Video is short enough for judges to finish.
- No secrets or private data are visible.

Current status: `NOT STARTED`.

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
| Discord bot works with Nansen CLI | NOT STARTED | User | screenshot | Capture `/health` with CLI OK. |
| Submission form | NOT STARTED | User | form submitted | Fill after final GitHub/docs/demo assets. |
| GitHub URL or intro tweet URL | NOT STARTED | User | GitHub URL | Use GitHub URL minimum; add intro tweet if ready. |

Evaluation boosters:

| Booster | Status | Owner | Evidence required | Next action |
| - | - | - | - | - |
| Bot overview | NOT STARTED | ChatGPT | form submitted | Draft concise non-price-bot positioning. |
| Usage explanation | NOT STARTED | ChatGPT | form submitted | Explain `/radar`, `/why`, `/flow`, `/rejections`, `/stats`. |
| Code/architecture explanation | NOT STARTED | Codex | commit | Add to README/REPORT. |
| Setup steps | NOT STARTED | Codex | commit | Verify commands from README. |
| Demo video | NOT STARTED | User | demo video | Record after screenshots are stable. |
| Dependency list | NOT STARTED | Codex | commit | Document Node.js, Nansen CLI, Discord API usage. |

## Demo Scenario

Command order:

1. `/health`
2. `/radar`
3. `/why <CA>`
4. `/flow <CA>`
5. `/rejections`
6. `/stats`
7. `/leaderboard`
8. `/report`

Judge framing:

- This is not a price bot.
- It is a pre-CA Radar for the bb Discord room.
- It can intentionally stay silent when weak signals appear.
- Nansen is used for Smart Money discovery and focused verification.
- Credit efficiency matters because the bot is designed for real Discord use, not demo spam.

## Current Risks

| Risk | Status | Owner | Evidence required | Next action |
| - | - | - | - | - |
| Runtime confusion between foreground/background bot processes | NEXT | Codex | commit | Document operation and process confirmation. |
| Bot left running during development may spend Nansen credits every scan interval | NEXT | Codex | commit | Document stop-before-dev habit. |
| `/flow` final UI not explicitly approved after latest polish | NOT STARTED | User | screenshot | Review latest screenshot. |
| README/REPORT not yet submission-ready | NOT STARTED | Codex | commit | Polish after operational docs. |
| Demo screenshots incomplete | NOT STARTED | User | screenshot | Capture in command order. |
| Demo video missing | NOT STARTED | User | demo video | Record after screenshot set. |
| Submission form not submitted | NOT STARTED | User | form submitted | Submit last. |

## Change Log Evidence

Recent evidence:

- `4e7e397`: Japanese-first `/radar` wording.
- `f793e2d`: Nansen credit-efficiency pass.
- `837c96a`: `/flow` verification UI polish.
- `0c9b0e8`: `/flow` tracking wording refinement.

Latest required check:

- `npm.cmd run check:all` must pass after any code or docs change before push.
