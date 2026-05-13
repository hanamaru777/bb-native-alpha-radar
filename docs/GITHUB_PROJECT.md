# GitHub Project Structure

Use GitHub Issues and milestones to keep future implementation aligned with the Radar direction.

Master hackathon tracker: `../HACKATHON_MANAGEMENT.md`

## Suggested Labels

- `P0`: Must finish before judging or before a release.
- `P1`: Important polish or hardening.
- `P2`: Useful later.
- `docs`: Documentation-only changes.
- `discord-ux`: Command text, embeds, buttons, screenshots.
- `nansen-credit`: Nansen call volume, caching, endpoint strategy.
- `storage-compat`: `alerts.json`, `scans.json`, Radar Call ID compatibility.
- `radar-philosophy`: Direction and product identity.
- `demo-readiness`: Judging, screenshots, checklist, reports.
- `safety`: Secrets, NFA/DYOR, non-trading behavior, spam prevention.

## Suggested Milestones

### Hackathon Submission Management

Goal: track current progress, remaining work, demo readiness, submission assets, and final risks.

Includes:

- `HACKATHON_MANAGEMENT.md`.
- Submission asset checklist.
- Demo scenario.
- Winning conditions.

### Direction Lock

Goal: preserve product identity before runtime changes.

Includes:

- Guardrail docs.
- Command UX docs.
- Nansen usage docs.
- Storage compatibility docs.

### Screenshot UX Polish

Goal: make Discord output readable in three seconds.

Includes:

- `/radar` embed compression.
- CA de-emphasis.
- `/why` and `/flow` boundary cleanup.
- Dark mode screenshot review.

### Nansen Credit Efficiency

Goal: keep Nansen impressive but low-credit.

Includes:

- Filter before enrichment.
- Limit holders/flow calls.
- Health check credit reduction.
- Saved-data reuse.

### Proof and Compatibility

Goal: protect Radar Call history and prove outcomes.

Includes:

- JSON compatibility smoke tests.
- Radar Call continuity checks.
- Tracking and reaction safety.

### Hackathon Demo Readiness

Goal: make judging smooth.

Includes:

- README demo flow.
- REPORT refresh.
- Submission checklist.
- Screenshot set.

## Issue Categories

Recommended initial issues:

- P0: Complete final submission asset checklist.
- P0: Record demo video with Nansen CLI usage visible.
- P0: Compress `/radar` for three-second screenshot readability.
- P0: Reduce Nansen enrichment to likely Radar Calls only.
- P0: Add JSON compatibility smoke tests.
- P0: Polish README setup, architecture, and dependency explanation.
- P1: Reduce `/health` live Nansen credit usage.
- P1: Prevent confusing duplicate manual Radar saves.
- P1: Clarify `/flow` as verification, not a dashboard.
- P1: Add judging/demo flow to README.
- P1: Draft intro tweet/post.
- P2: Add sample mock outputs for docs.
- P2: Improve `REPORT.md` generation wording.

## Implementation Phase Order

1. Documentation and direction lock.
2. Hackathon management and submission tracking.
3. Discord screenshot UX polish.
4. Nansen credit efficiency.
5. Data compatibility and smoke tests.
6. Demo/readme/report polish.
7. Demo video, intro post, final check, and push.
