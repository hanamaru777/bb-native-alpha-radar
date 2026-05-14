# bb Native Alpha Radar Submission Checklist

Use this before the final GitHub push and submission form.

Master tracker: `HACKATHON_MANAGEMENT.md`

## 0. Direction Check

Before demo or submission, confirm:

- This still feels like a pre-CA Radar.
- `/radar` is not a dashboard.
- Alerts are selective.
- CA is visible but not the visual hero.
- Nansen usage is obvious but not wasteful.
- Radar Call IDs appear consistently.
- No command gives trading advice.

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
- `DAILY_SUMMARY_ENABLED=true` at `23:50` JST for the current production-like local runtime

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
/stats
/report
```

Confirm:

- `/stats` shows tracking and rejection stats
- `/report` explains why bb should adopt this bot
- README and REPORT explain automatic operation, filter rules, and runtime config

## 6. Screenshots / Demo Evidence

Save screenshots of:

- `/health`: `docs/submission-assets/01-health.png`
- `/radar`: `docs/submission-assets/02-radar.png`
- `/why <CA>`: `docs/submission-assets/03-why.png`
- `/flow <CA>`: `docs/submission-assets/04-flow.png`
- `/leaderboard`: `docs/submission-assets/05-leaderboard.png`
- `/rejections`: `docs/submission-assets/06-rejections.png`
- `/stats`: `docs/submission-assets/07-stats.png`
- `/report`: `docs/submission-assets/08-report.png`

Best screenshot set:

1. A clean Radar card or a clean "今は見送り" screen
2. The matching `/why <CA>` explanation
3. The matching `/flow <CA>` deep dive
4. `/rejections` showing the noise filter
5. `/stats` showing the daily Radar summary

Screenshot rules:

- Prefer Discord dark mode.
- Show the top of the card, not only the button area.
- Avoid screenshots where CA dominates the image.
- Prefer one strong candidate over many weak candidates.
- If no candidate passes, use the miss screen as proof of selectivity.
- For the committed bundle, prioritize `02-radar.png`, `04-flow.png`, `05-leaderboard.png`, `06-rejections.png`, and `07-stats.png`.
- `03-why.png` has been replaced with the latest Japanese-first `/why` screenshot.

## 7. Demo Command Order

Recommended judging flow:

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

What to say first:

- "This is not a price bot."
- "It is a pre-CA Radar for the bb Discord room."
- "The bot can say no when signals are weak."
- "Nansen is used to verify Smart Money, holders, and flow."

## 8. Final GitHub Step

Before pushing:

```powershell
npm.cmd run check:all
git status --short
```

Finally push the repo and submit the GitHub URL.

## 9. Submission Form Assets

Prepare:

- GitHub URL or intro tweet/post URL
- Bot overview
- Architecture explanation
- Setup explanation
- Dependency explanation
- Nansen CLI usage explanation
- Demo video link
- Screenshot set
- Short "not a price bot" positioning
- Short "credit-efficient Nansen usage" explanation

Minimum submission:

- GitHub URL or intro tweet/post
- Working Discord bot using Nansen CLI
- README with setup instructions
- No committed secrets

Strong submission:

- Demo video
- Clean screenshots
- REPORT.md
- Architecture/dependency/setup explanation
- Clear Radar philosophy

## 10. Recommended Final Submission Package

Submit these exact assets:

- GitHub URL: `https://github.com/hanamaru777/bb-native-alpha-radar`
- `README.md`
- `REPORT.md`
- `SUBMISSION_FORM_DRAFT.md`
- `SUBMISSION_ASSET_BUNDLE.md`
- Discord dark mode screenshot bundle: `docs/submission-assets/`

Final screenshot order:

1. `docs/submission-assets/01-health.png`
2. `docs/submission-assets/02-radar.png`
3. `docs/submission-assets/03-why.png`
4. `docs/submission-assets/04-flow.png`
5. `docs/submission-assets/05-leaderboard.png`
6. `docs/submission-assets/06-rejections.png`
7. `docs/submission-assets/07-stats.png`
8. `docs/submission-assets/08-report.png`

Judge demo order:

1. `/health`
2. `/radar`
3. `/why <CA>`
4. `/flow <CA>`
5. `/leaderboard`
6. `/rejections`
7. `/stats`
8. `/report`

Optional assets:

- short demo video, under two minutes
- X / intro post URL

Final recommendation:

- Do not change runtime code or UI before submission unless a bug appears.
- Screenshot bundle is committed in `docs/submission-assets/`.
- Submit with GitHub URL even if intro post and demo video are not ready.
- Record a short demo video only if the screenshot bundle is clean and time remains.
