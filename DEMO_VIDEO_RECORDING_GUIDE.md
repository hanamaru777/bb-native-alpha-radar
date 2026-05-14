# Demo Video Recording Guide

This guide is for a manual 60-120 second recording.

Keep the video simple. Judges should understand the product before they notice the editing.

## Recommended OBS Settings

Canvas:

- Base canvas: `1920x1080`
- Output resolution: `1920x1080`
- FPS: `30`

Encoding:

- Format: `mp4` or `mkv` remuxed to `mp4`
- Encoder: hardware encoder if available, otherwise x264
- Rate control: CBR
- Bitrate: `6000 Kbps` for 1080p30
- Keyframe interval: `2`

Audio:

- Sample rate: `48 kHz`
- Mic volume: peak around `-12 dB`
- Add noise suppression only if needed

If recording with Windows screen recorder instead of OBS, use 1080p and keep the window stable.

## Discord Window Setup

Use Discord dark mode.

Recommended layout:

- One Discord window only
- Window size close to `1280x900` or larger
- Channel list and member list can be hidden if they distract
- Keep bot messages centered and readable
- Use browser zoom or Discord font scaling only if text is too small

Recommended Discord settings:

- Theme: dark
- Message display: cozy or compact, whichever makes embeds easiest to read
- Avoid unread pings and side conversations
- Close popups before recording

## Browser Setup

Only open a browser if showing GitHub at the end.

If used:

- Open `https://github.com/hanamaru777/bb-native-alpha-radar`
- Use README top section or `docs/submission-assets/`
- Do not spend more than 8 seconds in the browser

The Discord workflow is more important than the repo view.

## Font And Zoom

Recommended:

- Discord app zoom: `100%` or `110%`
- Windows display scaling: current normal setting is fine
- Browser zoom: `100%`

Check before recording:

- Japanese section headers are readable
- Buttons are visible
- CA is visible but not dominant
- No line is cut off

## Cursor Guidance

Move slowly and only when useful.

Good cursor behavior:

- Point briefly at `/health` Nansen CLI proof
- Point briefly at `/radar` top state
- Point briefly at Verify buttons
- Point briefly at `/rejections` reasons

Avoid:

- Circling constantly
- Rapid mouse movement
- Highlighting CA for too long
- Clicking around while narrating

## Avoid Dead Time

Before recording:

1. Start the bot.
2. Confirm Discord commands are responding.
3. Prepare the CA you will use for `/why <CA>` and `/flow <CA>`.
4. Paste commands only when ready.
5. Keep screenshots nearby as fallback, but record real Discord usage when possible.

During recording:

- Do not wait for long loading moments on camera.
- If a command takes too long, pause/restart the take.
- Keep narration moving while the embed appears.
- Do one clean take if possible.

## Secret Safety

Never show:

- `.env`
- Discord token
- Nansen API key
- private server settings
- terminal output containing secrets
- API request headers

Safe to show:

- Discord bot embeds
- `/health` result
- GitHub README
- committed screenshots
- command names

## Recommended Start/Stop For Recording

Start from the primary repo:

```powershell
cd "<primary repo path>"
.\start-bot.cmd
```

Primary repo path:

```text
C:\Users\hanam\OneDrive\<Documents in Japanese>\CODEX 260309\bb-native-alpha-radar
```

Stop after recording:

```powershell
.\stop-bot.cmd
```

Daily Summary is currently intended to run at `23:50` JST. Auto Radar scans run every `30` minutes. Stop the bot after recording if you are not intentionally testing scheduled behavior.

## Optional ffmpeg Commands

Trim a video:

```powershell
ffmpeg -ss 00:00:03 -to 00:01:35 -i input.mp4 -c copy demo-trimmed.mp4
```

Compress for upload:

```powershell
ffmpeg -i input.mp4 -vf "scale=1920:-2" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k demo-compressed.mp4
```

Convert MKV to MP4 without re-encoding:

```powershell
ffmpeg -i input.mkv -c copy demo.mp4
```

Extract a thumbnail:

```powershell
ffmpeg -ss 00:00:12 -i demo.mp4 -frames:v 1 demo-thumbnail.png
```

Use ffmpeg only if already installed. Do not block submission on video compression.
