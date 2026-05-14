# Nansen Usage Guardrails

Nansen should be impressive because it is decisive, not because the bot calls every endpoint often.

## Current Nansen Roles

Base Radar scan:

- `POST /smart-money/netflow`
- `POST /smart-money/dex-trades`
- `POST /token-screener`

Candidate verification:

- `POST /tgm/holders`
- `POST /tgm/flow-intelligence`

System check:

- `nansen schema --pretty`
- REST status is inferred from the latest Radar scan when possible, so `/health` does not spend a Nansen REST call just to poll status.

## Product Purpose By Endpoint

`smart-money/netflow`:

- Finds early Smart Money attention.
- Should remain the center of the Radar story.

`smart-money/dex-trades`:

- Confirms that Smart Money activity is trade-backed.

`token-screener`:

- Provides the lowcap candidate pool.

`tgm/holders`:

- Checks holder concentration and wallet label hints.
- Should be used after a candidate is plausibly Radar-worthy.

`tgm/flow-intelligence`:

- Confirms inflow/outflow bias.
- Should help promote, downgrade, or reject a candidate.

## Credit-Efficient Principles

- Filter cheap signals before expensive enrichment.
- Check recent bb history before deep candidate enrichment when available.
- Enrich only the top candidates that may become Radar Calls.
- Do not deep-dive every scanned row.
- Cache or reuse saved data when a command can safely use history.
- `/flow <CA>` can spend more because the user explicitly requested one CA.
- `/stats`, `/leaderboard`, and `/rejections` should prefer saved data.
- `/health` should not become a credit-heavy polling command.
- Daily Summary uses saved Radar history and should not add extra live Nansen calls by itself.

## Acceptable Credit Spend

Current scan budget:

- Base Radar scan: 3 REST calls (`netflow`, `dex-trades`, `token-screener`).
- Candidate enrichment: up to `RADAR_DISPLAY_LIMIT + 3` candidates, capped by the code path before holders/flow.
- bb already-posted candidates are rejected before holders/flow enrichment when recent Discord history is available.
- `/flow <CA>` remains a user-requested deep dive for one CA.

Acceptable:

- A scheduled Radar scan that uses Nansen to find a small candidate set.
- `/flow <CA>` live verification for one user-selected CA.
- CLI health checks that verify Nansen CLI availability without leaking secrets.

Avoid:

- Re-enriching every candidate on every display command.
- Fetching live Nansen data for passive summary commands.
- Increasing scan frequency to chase more candidates.
- Adding new endpoints unless they clearly improve pre-CA Radar quality.

## Failure Behavior

If Nansen credits are exhausted or an endpoint fails:

- The bot must not crash.
- The message should say that Nansen data is temporarily unavailable.
- Saved Radar history should still be usable.
- Tracking through non-Nansen sources may continue.
- The output must not pretend live Nansen verification succeeded.

## Demo Guidance

For judging:

- Show that Nansen powers the candidate selection.
- Show holders and Flow Intelligence in `/flow`.
- Show `/rejections` to prove the bot filters weak candidates.
- Avoid repeatedly running `/radar` if credits are limited.
