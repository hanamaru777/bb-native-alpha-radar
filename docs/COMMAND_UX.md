# Command UX Guardrails

The command system must preserve the loop:

`Radar -> Verify -> Prove -> Community`

## Command Roles

### `/radar`

Purpose: show what is worth looking at now.

Rules:

- Conclusion first.
- Maximum two candidates by default.
- Do not make CA the visual hero.
- Show only the minimum evidence needed for a three-second decision.
- Push deeper detail to `/flow <CA>`.
- If there are no strong candidates, say "watching / skipped" instead of filling the room.

### `/why <CA>`

Purpose: explain why a saved Radar Call picked a CA.

Rules:

- Must work from saved Radar history.
- Must preserve the Radar Call ID.
- Should answer "why now" faster than `/flow`.
- Should not become a full analysis page.

### `/flow <CA>`

Purpose: user-requested verification.

Rules:

- Deeper Nansen usage is acceptable here because intent is explicit.
- Start with "what to do now".
- Show Smart Money, holders, Nansen flow, market quality, and tracking only as verification.
- Do not use trading language such as entry, target, stop, or sell.

### `/leaderboard`

Purpose: proof of post-alert outcomes.

Rules:

- Show tracked Radar Calls, not price hype.
- Keep Radar Call IDs visible.
- Use max gain as proof, not as a buy signal.

### `/rejections`

Purpose: show why the bot did not alert.

Rules:

- Frame rejects as quality control.
- Do not shame the candidate.
- Keep the message short and useful.

### `/stats`

Purpose: today's Radar daily summary.

Rules:

- Not a raw metrics dashboard.
- Show Radar Calls, strong candidates, rejects, best Radar, community reactions, and commentary.
- Keep it suitable for end-of-day screenshots.

### `/report`

Purpose: judging and submission summary inside Discord.

Rules:

- Explain positioning, Nansen usage, proof, and safety.
- Keep it readable as a Discord message.

### `/health`

Purpose: system support.

Rules:

- Never expose secrets.
- `/health` should be useful without creating unnecessary Nansen credit drain.

### Hidden/Internal Support

`/criteria`, `/config`, `/help`, and `/export` should not be public slash commands for hackathon judging.

Reason:

- They make the mobile slash list feel like a generic utility dashboard.
- The same information belongs in README, REPORT, and submission docs.
- Internal formatter/helper functions may remain in code when useful, but public Discord UX should stay focused.

Public slash commands should remain:

- `/health`
- `/radar`
- `/why <CA>`
- `/flow <CA>`
- `/leaderboard`
- `/rejections`
- `/stats`
- `/report`

## Screenshot-First Rules

- First line should communicate the state.
- Keep field names short.
- Avoid long paragraphs in embeds.
- Use buttons for external verification links.
- Keep NFA / DYOR short.
- Prefer "watch / verify / skip" language over "buy / sell / profit" language.

## Demo Command Order

Recommended demo order:

1. `/health`
2. `/radar`
3. `/why <CA>`
4. `/flow <CA>`
5. `/rejections`
6. `/stats`
7. `/leaderboard`
8. `/report`

What to show first:

- If a strong Radar Call exists, show `/radar` first after a quick `/health`.
- If no strong Radar exists, show the "今は見送り" output and then `/rejections`.
- Always show that the bot can say no.
