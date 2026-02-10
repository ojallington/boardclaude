# Demo Walkthrough Notes -- Recording Day

Production notes for the 3:10 BoardClaude demo video. Complements the beat sheet in `context/strategy/prize-targeting.md` (lines 83-103).

## Agent Color Reference

| Agent | Hex | Name |
|-------|-----|------|
| Boris | #3b82f6 | Blue |
| Cat | #8b5cf6 | Violet |
| Thariq | #06b6d4 | Cyan |
| Lydia | #f59e0b | Amber |
| Ado | #10b981 | Emerald |
| Jason | #ef4444 | Red |
| Synthesis | #6366f1 | Indigo |

All must pass WCAG AA contrast against dark background (#0f172a). Ado will notice if they do not.

## Per-Beat Narration and Visual Direction

### Beat 1 -- Hook (0:00-0:15)

**Say:** "What if your code could judge itself and get better -- automatically? BoardClaude assembles a panel of AI agents -- each one calibrated to a real expert's perspective -- and shows you exactly where to improve."

**Show:** Dark terminal, full screen. Hook line types out character by character, cursor blinking. Moody, minimal. Hard cut to timeline at 0:15.

### Beat 2 -- Meta Self-Improvement (0:15-1:00)

**Say:** "We pointed BoardClaude at itself. Five audit cycles. Six agents evaluating in parallel -- architecture, product, AI innovation, code quality, docs, community impact. Watch the composite score climb: 44... 61... 72... 83... 90. Every cycle, the agents found problems. Every cycle, we fixed them. The board kept us honest."

**Show:** Dashboard full screen. Timeline tree animates nodes: 44, 61, 72, 83, 90 in Synthesis indigo. Quick intercut to 2x3 grid of agent cards streaming scores simultaneously. The parallel-streaming moment is the first "wow" -- hold 3-4 seconds. Smooth slide transition to proof beat.

### Beat 3 -- The Proof (1:00-1:50)

**Say:** "Self-evaluation is easy to fake. So here's the real test. We evaluated the Compound Engineering Plugin -- a project built by one of our judges. Six agents activate. Boris scores 88 on architecture. Lydia flags TypeScript patterns at 65. Thariq rates the AI integration at 72. Composite: 79. Now the question every judge has to ask: did our agents predict what the real experts actually think? We believe it's close. And every miss makes the next version better."

**Show:** Split screen -- dark terminal left (30%), dashboard right (70%). Terminal shows `/bc:audit` running, agent names in their colors as they spin up. Agent cards stream in one by one on dashboard. Radar chart populates, composite 79 appears in Synthesis indigo. This is the credibility moment. Do not rush it. Hold on the radar chart 2-3 seconds. Crossfade to fix pipeline.

### Beat 4 -- Closed Loop: Fix Pipeline (1:50-2:25)

**Say:** "But finding problems is only half the story. `/bc:fix` reads the action items, implements targeted fixes, then runs real validation -- TypeScript compiler, test suite, linter, formatter. If a fix introduces a regression, it's automatically reverted. No fix survives without passing real tooling. Watch: three action items in, three validated fixes out, composite jumps six points."

**Show:** Split screen. Terminal left (40%): `/bc:fix` running, showing action items being processed, tsc/jest/eslint output streaming. Dashboard right (60%): score card updating in real-time, action items checking off. The validation output is the "wow" -- real compiler output, not AI vibes. Hold on the score delta for 2 seconds.

### Beat 5 -- Framework (2:25-2:50)

**Say:** "Getting started takes two minutes. Install the plugin. Pick a panel template -- or write your own in YAML. Run /bc:audit. Six agents. One minute. A radar chart of everything you need to fix."

**Show:** Split screen (50/50). Terminal: install command, flash of YAML panel file, `/bc:audit` executing. Dashboard: radar chart renders with all six agent colors, prioritized action list scrolls in. Keep this fast -- credibility is already established. Zoom out to vision.

### Beat 6 -- Vision + Close (2:50-3:10)

**Say:** "After the hackathon, we're evaluating all 500 submissions. Predicted scores versus actual rankings. A public accuracy report. Every miss trains the next version. BoardClaude. Every perspective. Every critique. Every time."

**Show:** Dashboard montage of scrolling repo names, scatter plot of predicted vs actual with trend line. Fade to boardclaude.com centered, GitHub link below. Tagline appears one phrase at a time with slight delays. Hold 3 seconds on final frame.

## Pacing Notes

- **Hook (15s):** Slow, deliberate. Let the question land. Do not rush into the answer.
- **Self-eval (45s):** Build energy. The score progression should feel like acceleration.
- **Proof (50s):** Longest beat. Confident, measured. Call out specific scores by name. Pause after "We believe it's close."
- **Closed Loop (35s):** Technical and precise. Let the validation output speak. The score delta is the punchline.
- **Framework (25s):** Fastest delivery of the video. Rapid, practical, no drama.
- **Vision + Close (20s):** Slow back down. Aspirational into definitive. Let the tagline do the work. Do not add anything after it.

## Technical Notes -- Pre-Recording Prep

**Cache everything before you hit record.** Run all audits (self-evaluation 5 cycles, Compound Engineering Plugin) the night before. Store in `.boardclaude/audits/`. Dashboard must render entirely from cached JSON with zero live API calls. Verify every cached result loads correctly in the dashboard before recording.

**Have `/bc:fix` demo data prepared** (3 action items with before/after validation output).

**Have open before recording:**
1. Clean terminal with pre-typed commands ready to paste
2. Dashboard dev server running (`npm run dev`), verified working
3. Browser tab 1: self-evaluation timeline view
4. Browser tab 2: Compound Engineering Plugin audit results
5. Command paste-sheet (exact commands in order, no live typing of long strings)
6. Narration script printed or visible on a second monitor

**Fallback:** Have static screenshots of every key dashboard frame exported as PNGs. Better to cut to a screenshot than debug on camera.

## Recording Setup

| Setting | Minimum | Preferred |
|---------|---------|-----------|
| Resolution | 1920x1080 | 2560x1440 |
| Frame rate | 30 fps | 60 fps |
| Terminal font | 16pt | 18pt |
| Software | OBS Studio | OBS Studio |
| Format | MP4 H.264 | MP4 H.264 high bitrate |
| Audio | Built-in mic, quiet room | External mic, treated room |

**Visual rules:** Dark terminal + dark dashboard with agent color accents. Clean split when showing both -- no overlapping windows, no desktop, hide the taskbar. All seven agent colors contrast-checked against dark background. No system notifications (silence Slack, email, Discord, Teams, everything). Record narration separately if possible for cleaner audio and easier re-takes.

## What to Cut If Running Over 3:10

Cut from top down. Stop when under 3:10.

| Priority | Cut | Saves | Safe Because |
|----------|-----|-------|-------------|
| 1 | Vision portion of Beat 6 | ~10s | Aspirational only, no working product shown |
| 2 | Framework install steps | ~10s | Shorten to 5-second speed-run, keep radar chart |
| 3 | Closed loop detail | ~10s | Reduce to one fix example instead of three |
| NEVER | The proof beat (1:00-1:50) | -- | Credibility moment. Cutting it destroys the narrative. |
| NEVER | The hook (0:00-0:15) | -- | Without it there is no reason to keep watching. |

Use reclaimed time to let the proof beat breathe -- hold on the radar chart, show agent debate, add detail.

## Recording Day Checklist

- [ ] All audits cached and verified in `.boardclaude/audits/`
- [ ] `/bc:fix` demo data prepared with 3 action items and validation output
- [ ] Dashboard loads from cache with no API calls
- [ ] OBS configured: resolution, frame rate, audio source tested
- [ ] Terminal font 16pt+ and readable at 1080p
- [ ] All OS notifications silenced
- [ ] Command paste-sheet prepared
- [ ] Narration script accessible (printed or second monitor)
- [ ] Agent color contrast spot-checked on dark background
- [ ] Backup screenshots exported for every key frame
- [ ] 30-second test recording played back to verify audio and video
