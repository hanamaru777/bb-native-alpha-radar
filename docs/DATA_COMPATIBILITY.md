# Data Compatibility Guardrails

Local JSON files are part of the product memory.

Do not change storage behavior casually.

## Files

`data/alerts.json`:

- Saved Radar Calls.
- Notification-time market cap.
- Smart Money count.
- bb reaction score.
- Radar Call ID.
- Tracking fields.
- Discord message IDs.
- Community reactions.

`data/scans.json`:

- Scan summaries.
- Rejected candidates.
- Rejection reasons.

`data/daily-summary.json`:

- Last posted daily summary date.
- Last daily summary message metadata.

## Compatibility Rules

- Existing JSON files must remain readable.
- New fields must be additive when possible.
- Missing fields must receive safe fallbacks.
- Do not rename existing fields without a migration path.
- Do not remove Radar Call IDs.
- Do not reset Radar Call ID counters.
- Do not make old alerts disappear from all surfaces unless intentionally migrated.

## Radar Call ID Rules

Radar Call IDs are shared community language.

They must appear consistently in:

- `/radar`
- `/why <CA>`
- `/flow <CA>`
- `/leaderboard`
- `/stats`

Rules:

- New alerts get the next available ID.
- Existing alerts keep their ID.
- Legacy alerts may receive display fallback IDs, but this must not rewrite history unexpectedly.
- Duplicate saves should not create confusion around which Radar Call is canonical.

## Safe Storage Changes

Safe:

- Add optional fields.
- Add fallback readers.
- Add non-breaking metadata.
- Add validation or smoke tests.

Risky:

- Changing `scoreVersion` behavior.
- Filtering old records out of stats without explaining why.
- Changing saved alert shape.
- Changing tracking field names.
- Changing reaction field names.

## Test Expectations

Future compatibility work should include lightweight checks for:

- Reading empty/missing JSON files.
- Reading older alerts without `radarCall`.
- Reading alerts with missing tracking fields.
- Preserving Radar Call labels.
- Writing valid JSON after updates.
