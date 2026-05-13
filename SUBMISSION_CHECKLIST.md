# bb Native Alpha Radar Submission Checklist

Use this before the final GitHub push and submission form.

## 1. Local Safety Check

```powershell
npm.cmd run check:all
```

If `npm` / `npm.cmd` is not recognized in the current terminal, open a new PowerShell window after installing Node.js, or run the individual checks:

```powershell
node --check src\config.js
node --check src\discord.js
node --check src\index.js
node --check src\marketData.js
node --check src\nansen.js
node --check src\nansenCli.js
node --check src\radar.js
node --check src\reportFile.js
node --check src\store.js
node --check src\tracking.js
```

Confirm:

- No syntax errors
- `.env` is not committed
- `data/alerts.json` and `data/scans.json` are not committed
- `MOCK_MODE=false` for the real judging run

## 2. Discord Health Check

Run:

```text
/health
```

Expected:

- Bot: OK
- Nansen CLI: OK
- Nansen REST API: OK when credits are available
- If credits are exhausted, the bot should clearly say credits are insufficient and should not crash

## 3. Radar Quality Check

Run:

```text
/radar
```

Judge the output with these questions:

- Are there at most `RADAR_DISPLAY_LIMIT` candidates?
- Can a trader understand the card in 3 seconds?
- Does it show why the token is worth checking now?
- Does it show what to be careful about?
- Does it include DexScreener / gmgn / Nansen links?
- Does it tell the user to use `/flow <CA>` for deep dive?

If weak candidates appear too often:

- Keep `MIN_BB_SCORE=88`
- Set `RADAR_DISPLAY_LIMIT=1`

If no candidates appear for a long time:

- Temporarily lower `MIN_BB_SCORE` to `85`
- Return to `MIN_BB_SCORE=88` for the judging/demo window

## 4. Flow Check

Pick one CA from `/radar` and run:

```text
/flow <CA>
```

Confirm:

- It has a clear action line
- It includes Smart Money, market cap, age, and flow
- It includes holder concentration / Nansen flow when credits are available
- It degrades cleanly when credits are exhausted

## 5. Judge-Facing Commands

Run:

```text
/help
/criteria
/config
/stats
/report
```

Confirm:

- The bot explains automatic operation
- The filter and bb reaction score are understandable
- `/stats` shows tracking and rejection stats
- `/report` explains why bb should adopt this bot

## 6. Screenshots / Demo Evidence

Save screenshots of:

- `/health`
- `/radar`
- `/flow <CA>`
- `/stats`
- `/report`

Best screenshot set:

1. A clean radar card
2. The matching flow deep dive
3. A stats screen showing post-alert tracking

## 7. Final GitHub Step

Before pushing:

```powershell
npm.cmd run check:all
git status --short
```

Then update `REPORT.md` from Discord with:

```text
/export
```

Finally push the repo and submit the GitHub URL.
