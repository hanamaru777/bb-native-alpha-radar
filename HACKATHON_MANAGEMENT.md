# Hackathon Management

This is the master tracking file for successful submission and winning demo readiness.

Use it to keep the repo focused on:

- Winning the hackathon.
- Discord-native UX.
- Screenshot virality.
- Radar atmosphere.
- Few high-quality signals.
- Nansen credibility.
- Operational stability.

Do not use this project tracker to justify scope creep, feature explosion, dashboard behavior, or spam behavior.

## Current Progress

Status legend:

- `Done`: already present in the repo.
- `Needs polish`: present, but should be improved before final submission.
- `Not started`: missing or not yet prepared.

| Area | Status | Notes |
| - | - | - |
| Core bot runtime | Done | Node bot, Discord Gateway, slash commands, scheduled Radar, tracking, daily summary support. |
| Nansen CLI requirement | Needs polish | `/health` checks CLI with `nansen schema --pretty`; final demo must prove the CLI is installed and working. |
| Nansen REST usage | Done | Smart Money, Token Screener, holders, Flow Intelligence. Enrichment is now capped and bb history is checked before deep enrichment when available. |
| Discord command UX | Done | Commands exist. `/radar` has been reviewed in Discord dark mode and is good enough for three-second comprehension. |
| Radar Call IDs | Done | Saved alerts receive shared Radar Call IDs. Compatibility must stay protected. |
| JSON storage | Done | `alerts.json`, `scans.json`, `daily-summary.json`. Compatibility smoke tests are still missing. |
| README | Needs polish | Setup and concept exist. Needs final demo/submission framing. |
| REPORT.md | Needs polish | Exists. Should be refreshed near submission with `/export`. |
| Demo screenshots | Needs polish | `/radar` dark mode screenshot has been reviewed. Remaining screenshots still need to be captured. |
| Demo video | Not started | Required for stronger evaluation, even if not strictly required by form. |
| Intro tweet/post | Not started | Required if GitHub URL alone is not enough or to improve reach. |
| Submission form | Not started | Final form must include GitHub URL or intro tweet and demo assets. |

## Winning Conditions

### Minimum Submission Success

The project is submit-ready if:

- The bot runs locally.
- Discord commands register and respond.
- Nansen CLI is installed and demonstrably used.
- `npm.cmd run check:all` passes.
- README explains setup and usage.
- Submission form includes GitHub URL or intro tweet.
- Secrets and local JSON data are not committed.

### Strong Finalist Quality

The project is finalist-quality if:

- `/radar` is understandable in three seconds.
- The bot clearly says it is not a price bot.
- Demo shows `Radar -> Verify -> Prove -> Community`.
- `/flow` demonstrates Nansen holders and flow on one candidate.
- `/rejections` proves the bot avoids spam.
- `/stats` or `/leaderboard` proves post-alert tracking.
- README and REPORT explain architecture and Nansen usage clearly.
- Demo screenshots look good in Discord dark mode.

### Likely Winning Quality

The project is win-quality if:

- Judges immediately understand the bb-native pre-CA angle.
- The first screenshot feels like a Radar, not a dashboard.
- Nansen usage feels central and credible, not decorative.
- Credit efficiency is visible in the architecture explanation.
- The bot can say no without looking broken.
- Radar Call IDs make the product feel community-native.
- The demo video shows a tight, repeatable workflow in under two minutes.

## Readiness Trackers

### Runtime Readiness

- [x] Bot startup path exists.
- [x] Slash command registration exists.
- [x] Gateway reconnect path exists.
- [x] Scheduled Radar path exists.
- [x] Tracking loop exists.
- [x] Daily summary dedupe exists.
- [x] Final real `.env` verified with `MOCK_MODE=false`.
- [ ] Final `/health` screenshot captured.
- [x] Final `npm.cmd run check:all` captured after latest Nansen credit-efficiency changes.

### UI/UX Readiness

- [x] Commands cover Radar, Verify, Prove, Community.
- [x] `/rejections` exists as a quality filter.
- [x] `/stats` exists as daily summary.
- [x] `/radar` screenshot is short enough for three-second comprehension.
- [x] CA is visible but not the visual hero in `/radar`.
- [x] `/radar` dark mode screenshot reviewed.
- [x] Runtime is unified to the primary repo.
- [ ] Full demo output avoids dashboard feel.

### Nansen Credit Readiness

- [x] Nansen Smart Money is used for Radar.
- [x] Nansen holders and Flow Intelligence are used for verification.
- [x] Nansen CLI health check exists.
- [x] Enrichment is limited to likely Radar Calls.
- [x] `/health` avoids unnecessary REST credit drain where possible.
- [ ] Demo avoids repeatedly running `/radar`.
- [ ] Credit exhaustion path is screenshot-tested.

### Demo Readiness

- [ ] Clean `/health` screenshot.
- [ ] Clean `/radar` screenshot or clean "今は見送り" screenshot.
- [ ] Matching `/why <CA>` screenshot.
- [ ] Matching `/flow <CA>` screenshot.
- [ ] `/rejections` screenshot.
- [ ] `/stats` screenshot.
- [ ] `/report` screenshot.
- [ ] Demo video recorded.
- [ ] Demo narrative rehearsed.

### GitHub / Docs Readiness

- [x] `AGENTS.md` guardrails.
- [x] `WINNING_PLAN.md`.
- [x] `SUBMISSION_CHECKLIST.md`.
- [x] `docs/GUARDRAILS.md`.
- [x] `docs/COMMAND_UX.md`.
- [x] `docs/NANSEN_USAGE.md`.
- [x] `docs/DATA_COMPATIBILITY.md`.
- [x] `docs/GITHUB_PROJECT.md`.
- [ ] README final polish.
- [ ] REPORT refresh.
- [ ] Architecture explanation section finalized.
- [ ] Dependency explanation finalized.
- [ ] Setup explanation verified from clean checkout.

### Submission Readiness

- [ ] GitHub URL ready.
- [ ] Intro tweet/post drafted.
- [ ] Demo video link ready.
- [ ] Submission form filled.
- [ ] Bot overview prepared.
- [ ] Architecture explanation prepared.
- [ ] Setup explanation prepared.
- [ ] Dependency explanation prepared.
- [ ] Final screenshots attached or linked.
- [ ] Final push complete.

## Demo Scenario

### Ideal Command Order

1. `/health`
2. `/radar`
3. `/why <CA>`
4. `/flow <CA>`
5. `/rejections`
6. `/stats`
7. `/leaderboard`
8. `/report`

### What Judges Should See First

Show that the bot is alive and Nansen-connected, then immediately show the Radar experience.

Opening line:

> This is not a price bot. It is a pre-CA Radar for the bb Discord room.

If `/radar` finds a candidate:

- Show the Radar Call ID.
- Show the short reason.
- Show the Nansen verification buttons.
- Move to `/why` and `/flow`.

If `/radar` finds no candidate:

- Show "今は見送り".
- Explain that the bot protects bb from weak signals.
- Move to `/rejections`.

### Most Important Screenshots

Priority order:

1. `/radar` candidate or "今は見送り".
2. `/flow <CA>` showing Nansen holders / flow.
3. `/why <CA>` showing three-second explanation.
4. `/rejections` showing quality control.
5. `/stats` showing daily proof and community reactions.
6. `/health` showing Bot / Nansen REST / Nansen CLI.
7. `/report` showing submission framing.

### How To Explain Nansen Usage

Use this framing:

- Smart Money finds early attention.
- Token Screener helps form the lowcap candidate pool.
- DEX trades support Smart Money confirmation.
- Holders and Flow Intelligence verify whether the candidate deserves attention.
- Nansen is used to decide what bb should verify, not to spam every token.

### How To Explain "Not A Price Bot"

Use this framing:

- The bot does not tell users to buy or sell.
- It does not chase price alerts.
- It looks before the CA becomes a Discord narrative.
- It records what happened after the Radar Call for accountability.

### How To Explain Credit Efficiency

Use this framing:

- Broad scans identify possible candidates.
- Deeper Nansen calls should be limited to likely Radar Calls.
- `/flow` deep-dives only when the user requests one CA.
- Passive proof commands should prefer saved data.

### How To Explain Radar Philosophy

Use this framing:

- Radar: find early signals.
- Verify: use Nansen, DexScreener, and gmgn.
- Prove: track post-alert outcomes.
- Community: collect reactions and shared Radar Call IDs.

## Submission Assets Checklist

- [ ] README polish.
- [ ] REPORT.md refreshed with `/export`.
- [ ] Screenshot set.
- [ ] Intro tweet/post.
- [ ] Demo video.
- [ ] Bot overview.
- [ ] Architecture explanation.
- [ ] Dependency explanation.
- [ ] Setup explanation.
- [ ] Nansen CLI usage explanation.
- [ ] GitHub URL.
- [ ] Submission form.

## Current Biggest Risks

1. Dashboard drift: too many fields can make the Radar feel like analytics software.
2. Weak screenshot UX: judges may not understand the card in three seconds.
3. Unfinished demo flow: commands may exist but not tell a clean story.
4. Credit inefficiency: too many Nansen calls can limit judging reliability.
5. Runtime instability: `.env`, Nansen CLI, or Discord permissions may fail during demo.
6. Over-complexity: adding features can dilute the pre-CA Radar identity.
7. CA hero drift: large CA-first layouts can make the bot look post-CA.
8. Spam perception: too many candidates or repeated scans can hurt trust.

## Final Implementation Priority Order

1. `/radar` screenshot UX polish.
2. JSON compatibility and Radar Call continuity smoke tests.
3. `/flow` verification polish without dashboard creep.
4. README architecture/setup/dependency polish.
5. REPORT refresh and submission narrative polish.
6. Demo screenshots and demo video.
7. Final `npm.cmd run check:all`.
8. Final GitHub push.
9. Submission form and intro tweet/post.

## Scope Control Rules

- Do not add new product surfaces until the current demo flow is strong.
- Do not add trading language.
- Do not increase alert volume to make the demo look busy.
- Do not add endpoints unless they improve pre-CA Radar quality.
- Do not prioritize metrics over screenshot clarity.
- Do not change storage format without compatibility work.
