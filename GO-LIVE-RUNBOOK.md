# BoardClaude Go-Live Runbook

**THE definitive execution document. If it doesn't advance the current milestone, it goes in BACKLOG.md.**

> **Hackathon:** Built with Opus 4.6 -- a Claude Code Hackathon
> **Dates:** Feb 10 12:00 PM EST (6:00 PM CET) -- Feb 16 3:00 PM EST (9:00 PM CET)
> **Builder:** Oscar (solo)
> **Budget:** $500 Claude API credits
> **Domain:** boardclaude.com (+ boredclaude.com redirect)
> **Submission:** https://cv.inc/e/claude-code-hackathon

---

## Pre-Flight Checks (Feb 10, Morning Before 12:00 PM EST / 6:00 PM CET)

Complete every item. Do not proceed to go-live until all boxes are checked.

### Infrastructure

- [ ] GitHub repo created (empty, private) -- name: `boardclaude`
  - Description: "Assemble a board of AI agents that evaluate your project from multiple expert perspectives"
- [ ] Vercel project configured -- boardclaude.com connected
- [ ] boredclaude.com -> boardclaude.com redirect configured (with `?bored=true` query param)
- [ ] API credits verified ($500 available on Anthropic dashboard)

### Local Environment

- [ ] Node.js 20+ installed and verified (`node --version`)
- [ ] npm 10+ installed (`npm --version`)
- [ ] Git configured (`git --version`, user.name and user.email set)
- [ ] Claude Code latest version installed (`claude --version`)
- [ ] Agent Teams tested:
  ```
  CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
  ```
  Run a quick 2-agent test to confirm it works.
- [ ] tmux configured (WSL) or Windows Terminal with split panes ready
- [ ] This prep-kit directory path noted: `/mnt/c/Projects/HackathonPrep/prep-kit`

### Content Ready

- [ ] This runbook open on a second monitor or printed
- [ ] All prep-kit files verified present:
  - `prep-kit/CLAUDE.md`
  - `prep-kit/.claude/settings.json`
  - `prep-kit/.claude-plugin/plugin.json`
  - `prep-kit/agents/*.md` (7 files: boris, cat, thariq, lydia, ado, jason, synthesis)
  - `prep-kit/commands/*.md` (7 files: audit, init, fork, compare, merge, review, fix)
  - `prep-kit/panels/*.yaml`
  - `prep-kit/hooks/hooks.json`
  - `prep-kit/skills/*/SKILL.md` (6 skills: audit-runner, persona-builder, timeline-manager, validation-runner, fix-implementer, accessibility-auditor)
  - `prep-kit/context/` (22 files: judges, features, architecture, stack, strategy + README)

### Mental Prep

- [ ] Water bottle filled
- [ ] Dinner planned or prepped (you start at 6 PM CET)
- [ ] Phone on DND
- [ ] No other commitments until midnight

---

## Minute-by-Minute Go-Live (12:00 PM EST / 6:00 PM CET)

This is a speed run. Every minute counts for the first 15 minutes.

```
TIME (CET)  ACTION
----------  ------
18:00       git init boardclaude && cd boardclaude
18:01       cp ~/prep-kit/CLAUDE.md .
18:01       mkdir -p .claude && cp ~/prep-kit/.claude/settings.json .claude/
18:02       mkdir -p .claude-plugin && cp ~/prep-kit/.claude-plugin/plugin.json .claude-plugin/
18:02       mkdir -p agents commands skills panels hooks .boardclaude/audits
18:03       cp ~/prep-kit/agents/*.md agents/
18:03       cp ~/prep-kit/commands/*.md commands/
18:04       cp ~/prep-kit/panels/*.yaml panels/
18:04       cp ~/prep-kit/hooks/hooks.json hooks/
18:05       cp -r ~/prep-kit/skills/* skills/
18:05       cp -r ~/prep-kit/context context/
18:06       git add . && git commit -m "feat: initial project structure with personas and panels"
18:06       git remote add origin git@github.com:[USERNAME]/boardclaude.git && git push -u origin main
18:07       npx create-next-app@latest dashboard --typescript --tailwind --app --src-dir=false
18:10       cd dashboard && npm install recharts framer-motion
18:11       cd .. && git add . && git commit -m "feat: scaffold Next.js dashboard"
18:12       Open Claude Code: claude
18:13       Begin building /bc:audit command implementation
```

**Replace `~/prep-kit/` with the actual path you noted in pre-flight checks.**

---

## Milestone-Based Execution Plan

120 hours total. Four parallel tracks, seven milestones, continuous agent-team execution.

### Parallel Tracks

```
Track A: Core Engineering    — /bc:audit, /bc:fix, validation, /bc:init, packaging
Track B: Dashboard           — Next.js components, charts, timeline, polish
Track C: Self-Improvement    — Audit-fix-re-audit cycles (produces demo data)
Track D: Demo Production     — Script, recording, editing (starts at M5)
```

### Milestones

| Milestone | Hours | Exit Criteria |
|-----------|-------|---------------|
| **M1: First Audit** | 0-6 | `/bc:audit` produces valid JSON, Agent Teams stable, Self-Audit #0 baseline |
| **M2: Closed Loop** | 6-18 | `/bc:fix` working, validation gates active, first fix+re-audit cycle complete, Compound Plugin calibration done |
| **M3: Dashboard MVP** | 18-36 | AgentCards + RadarChart rendering real data, score progression visible, 2+ iterations visualized |
| **M4: Self-Improvement Proof** | 36-52 | 3+ audit cycles with measured deltas, chronic item detection, composite 85+ |
| **M5: Framework + Polish** | 52-72 | 3 panel templates working, plugin installable, README complete, Lighthouse 90+ |
| **M6: Demo Ready** | 72-84 | All audit data cached, video script rehearsed, dry run under 3:15 |
| **M7: Record + Submit** | 84-120 | Video recorded, submission text written, deployed, submitted |

### Human Engagement Model

| Phase | Oscar's Role | Agents' Role |
|-------|-------------|-------------|
| M1 (0-6h) | Active driving -- architecture decisions | Execute with Oscar directing |
| M2-M3 (6-36h) | Review every 1-2h, course correct | Build dashboard, run audits, implement fixes in parallel |
| M4-M5 (36-72h) | Check in every 2-3h, review milestones | Templates, polish, README, testing |
| M6-M7 (72-120h) | Solo for recording + submission | Bug fixes if needed |

Oscar fully present: ~40-50 of 120 hours. Other 70-80 hours are agent-autonomous.

**FOCUS RULE: If it doesn't advance the current milestone, it goes in BACKLOG.md.**

---

### M1: First Audit (Hours 0-6)

**Tracks Active:** A, C
**Estimated Cost:** $60

| Hour | Track | Task | Deliverable |
|------|-------|------|-------------|
| 0-0.5 | A | Go-live sequence (see above) | Git repo with personas, Next.js scaffold |
| 0.5-2 | A | Build plugin manifest + `/bc:audit` command implementation | Working audit command |
| 2-4 | A | Build Agent Team orchestration for 6 judges + synthesis | Agents run in parallel |
| 4-5 | A | Build synthesis agent + JSON output | Audit produces valid JSON |
| 5-5.5 | A | Build validation-runner skill (run tsc, test, lint, prettier) | Real data for agents |
| 5.5-6 | C | Run Self-Audit #0 (baseline) with validation context | First self-audit JSON in `.boardclaude/audits/` |

**M1 Exit Checklist:**
- [ ] `/bc:audit` command produces valid JSON
- [ ] Agent Teams spawns 6 agents + synthesis without crashes
- [ ] Self-audit #0 complete (baseline score recorded)
- [ ] Top issues identified for M2
- [ ] v0.1.0 tagged and pushed

**M1 Quick Reference Priorities (in order):**
1. `/bc:audit` command works
2. Agent Team spawns 6 agents
3. Synthesis produces valid JSON
4. Self-audit #0 complete

---

### M2: Closed Loop (Hours 6-18)

**Tracks Active:** A, C
**Estimated Cost:** $50

| Hour | Track | Task | Deliverable |
|------|-------|------|-------------|
| 6-8 | A | Full pipeline: ingest -> audit -> synthesize -> output | Complete audit flow |
| 8-9 | A | Refine personas based on baseline results | Better-calibrated agents |
| 9-11 | A | Build `/bc:fix` command (pipeline: audit -> fix -> validate -> re-audit) | Closed-loop fix pipeline |
| 11-12 | A | Build `/bc:init` wizard | Users can set up their own panels |
| 12-14 | C | Run calibration audit on Compound Engineering Plugin | Proof layer data |
| 14-16 | C | Run Iteration 1 (second audit cycle) + `/bc:fix` on top findings | Second self-audit + fix loop |
| 16-18 | A+C | Verify fix pipeline: audit -> fix -> re-audit score delta | Pipeline working end-to-end |

**M2 Exit Checklist:**
- [ ] Full audit pipeline working end-to-end
- [ ] `/bc:fix` command produces real fixes with validation
- [ ] Personas refined based on calibration delta
- [ ] `/bc:init` wizard functional
- [ ] Calibration audit on Compound Engineering Plugin complete
- [ ] Iteration 1 complete with delta from Audit #0
- [ ] v0.2.0 tagged and pushed

---

### M3: Dashboard MVP (Hours 18-36)

**Tracks Active:** B, C
**Estimated Cost:** $40

| Hour | Track | Task | Deliverable |
|------|-------|------|-------------|
| 18-21 | B | Dashboard scaffold: AgentCard, RadarChart, layout | Visual audit display |
| 21-24 | B | Connect dashboard to audit JSON output | Live data rendering |
| 24-26 | B | Score progression view (multi-iteration comparison) | Iteration delta visible |
| 26-28 | B | Build TimelineTree visualization | Branching history view |
| 28-30 | A | Build `/bc:fork` and `/bc:compare` commands | Strategy branching |
| 30-32 | C | Run Iteration 2 | Third audit cycle |
| 32-34 | B | Polish dashboard based on Lydia agent feedback | DX improvements |
| 34-36 | B | "Evaluate External Project" input (URL/path) | External repo evaluation |

**HARD DEADLINE:** If dashboard MVP is not rendering audit data by hour 28, **simplify to Markdown-only output** and focus on plugin quality. The plugin is the product; the dashboard is a bonus.

**M3 Exit Checklist:**
- [ ] Dashboard renders AgentCards with scores
- [ ] RadarChart displays multi-axis scores
- [ ] Score progression visible across 2+ iterations
- [ ] TimelineTree renders audit/fork/merge history
- [ ] Audit JSON drives dashboard data
- [ ] `/bc:fork` creates git worktrees
- [ ] `/bc:compare` produces side-by-side comparison
- [ ] Iteration 2 complete
- [ ] v0.3.0 tagged and pushed

---

### M4: Self-Improvement Proof (Hours 36-52)

**Tracks Active:** A, C
**Estimated Cost:** $45

| Hour | Track | Task | Deliverable |
|------|-------|------|-------------|
| 36-38 | C | Run Iteration 3 + `/bc:fix` cycle | Fourth audit cycle |
| 38-40 | C | Run Iteration 4 + `/bc:fix` cycle | Fifth audit cycle |
| 40-42 | C | Analyze chronic items, measure deltas across all iterations | Self-improvement metrics |
| 42-44 | C | Run 2-3 additional calibration audits (other public repos) | Broader proof layer |
| 44-48 | A | Edge case hardening, error handling | Production stability |
| 48-52 | A+C | Push for composite 85+ if not yet achieved | Score target |

**Stretch (if ahead of schedule):**
- Build accessibility-auditor skill (Playwright MCP for visual/a11y testing)
- Run Lighthouse via Playwright on dashboard pages

**M4 Exit Checklist:**
- [ ] 3+ audit-fix-re-audit cycles complete with measured deltas
- [ ] Chronic item detection working (3+ iterations without resolution)
- [ ] Composite score 85+ (or clear upward trajectory documented)
- [ ] Calibration audits on 2+ external repos complete
- [ ] v0.4.0 tagged and pushed

---

### M5: Framework + Polish (Hours 52-72)

**Tracks Active:** A, B
**Estimated Cost:** $35

| Hour | Track | Task | Deliverable |
|------|-------|------|-------------|
| 52-54 | A | Package as installable Claude Code plugin | `claude /plugin install boardclaude` works |
| 54-56 | A | Create demo panel templates (code-review, startup-pitch) | Pre-built panels |
| 56-60 | A | Write comprehensive README with examples, screenshots | Documentation |
| 60-62 | A | Build `batch-evaluate.ts` script | Scale evaluation capability |
| 62-66 | B | Final UI polish, accessibility pass, performance optimization | Lighthouse 90+ |
| 66-68 | B | Responsive design, dark mode verify, animation polish | Visual completeness |
| 68-72 | A+B | Fix edge cases, test all templates | Production hardening |

**Stretch (if ahead of schedule):**
- Implement accessibility-auditor with Playwright MCP (Lighthouse, axe-core, screenshots)
- Add Lighthouse scores to validation results JSON

**M5 Exit Checklist:**
- [ ] Plugin installs cleanly
- [ ] 3+ panel templates working (hackathon, code-review, startup-pitch)
- [ ] README complete with quickstart
- [ ] batch-evaluate script functional
- [ ] Dashboard polished, accessible, performant (Lighthouse 90+)
- [ ] v0.5.0 tagged and pushed

---

### M6: Demo Ready (Hours 72-84)

**Tracks Active:** D
**Estimated Cost:** $15

| Hour | Track | Task | Deliverable |
|------|-------|------|-------------|
| 72-74 | D | Write demo video script (3-minute target) | Finalized script |
| 74-76 | D | Cache all audit data, pre-compute dashboard views | Snappy demo performance |
| 76-78 | D | Dry run: walk through demo script end-to-end | Timing verified under 3:15 |
| 78-80 | D | Run final audit (convergence check, target composite >= 85) | Verify convergence |
| 80-82 | D | Write submission text | Hackathon entry text |
| 82-84 | D | Buffer for fixes discovered during dry run | Final fixes |

**M6 Exit Checklist:**
- [ ] All audit data cached for fast demo
- [ ] Demo script rehearsed, under 3:15
- [ ] Final audit score >= 85 composite
- [ ] Submission text drafted
- [ ] v1.0.0-rc tagged and pushed

---

### M7: Record + Submit (Hours 84-120)

**Tracks Active:** D
**Estimated Cost:** $10

| Hour | Track | Task | Deliverable |
|------|-------|------|-------------|
| 84-88 | D | Record demo video (follow rehearsed script) | 3-minute video |
| 88-92 | D | Edit video if needed, add captions/annotations | Polished video |
| 92-96 | D | Final testing, edge cases, README review, links check | Quality assurance |
| 96-100 | D | Deploy verify, make repo public | Production deploy |
| 100-120 | D | Buffer -- submit before 3:00 PM EST via https://cv.inc/e/claude-code-hackathon | SUBMITTED |

**M7 Exit Checklist:**
- [ ] Demo video recorded (3 minutes, clear and compelling)
- [ ] All links in README work
- [ ] boardclaude.com is live and working
- [ ] Demo video accessible
- [ ] GitHub repo is public
- [ ] v1.0.0 tagged and pushed
- [ ] Submission submitted before 3:00 PM EST

---

## Cost Tracking

Track every session to stay within the $500 budget. Plan for parallel agent team burn rate of 16-20 agent-hours/day.

| Milestone | Sessions | Model | Est. Tokens | Est. Cost | Running Total | Actual Cost | Notes |
|-----------|----------|-------|-------------|-----------|---------------|-------------|-------|
| M1 | Init + build + self-audit #0 | Opus 4.6 x6 | ~400K | $60 | $60 | | Setup + first audit |
| M2 | Pipeline + calibration + audit #1 | Mixed | ~330K | $50 | $110 | | Closed loop + CE Plugin |
| M3 | Dashboard + audit #2 | Mixed | ~260K | $40 | $150 | | Dashboard MVP |
| M4 | Self-improvement cycles + calibration | Mixed | ~300K | $45 | $195 | | 3+ audit cycles |
| M5 | Packaging + polish | Mixed | ~230K | $35 | $230 | | Framework + templates |
| M6 | Demo prep + final audit | Mixed | ~100K | $15 | $245 | | Demo ready |
| M7 | Record + submit | Minimal | ~70K | $10 | $255 | | Final stretch |
| | **Buffer** | | | **$245** | **$500** | | ~49% remaining |

### Cost Optimization Rules

- Use **Opus** for Boris, Cat, Thariq, Lydia (need deep reasoning)
- Use **Sonnet** for Ado, Jason, Synthesis (more formulaic evaluation)
- Use `--effort medium` for intermediate audits, `--effort max` only for final
- Cache project ingestion between audit iterations (do not re-read unchanged files)
- If budget is trending over at any point, switch remaining audits to Sonnet-only

### Budget Checkpoints

| Checkpoint | Max Spend | Action if Over |
|------------|-----------|----------------|
| After M2 | $140 | Switch Ado + Jason to Haiku |
| After M4 | $230 | Reduce to Sonnet-only for remaining audits |
| After M5 | $300 | No more Opus audits; Sonnet only |
| M6+ | $350 | Minimal API usage; polish only |

---

## Risk Register

| # | Risk | Impact | Probability | Mitigation | Trigger |
|---|------|--------|-------------|------------|---------|
| 1 | Agent Teams too unstable (experimental feature) | HIGH | MEDIUM | Fallback: use sequential subagents for parallel eval. Lose inter-agent debate but keep core functionality. Estimated impact: -15 on Thariq score, +10 on Jason score (more reliable). | Agents crash or produce garbled output on 2+ attempts |
| 2 | API costs exceed $500 budget | HIGH | LOW | Track costs per session (see table above). Switch to Sonnet for non-critical agents. Reduce audit iterations from 5 to 3 if burning fast. | Running total exceeds checkpoint thresholds |
| 3 | Dashboard takes too long, steals time from plugin | HIGH | MEDIUM | M3 HARD DEADLINE: if dashboard MVP not rendering by hour 28, ship plugin-only with Markdown output. The plugin IS the product. | Dashboard not showing data by hour 28 |
| 4 | Calibration audit does not match expectations | MEDIUM | MEDIUM | This IS the demo. Show the delta, explain the refinement process. Transparency beats accuracy. The refinement story is more interesting than perfect scores. | Predicted vs actual scores differ by >15 points |
| 5 | Scope creep (adding features not in plan) | HIGH | HIGH | Milestone gates enforce scope. If it doesn't advance the current milestone, it goes in BACKLOG.md. Check this runbook at every milestone boundary. | Oscar describes a new feature with enthusiasm |
| 6 | Context window limits with 6 agents | MEDIUM | LOW | Opus 4.6 has 1M context. If issues arise, reduce ingest scope per agent (targeted file sets instead of full codebase). | Agent output truncated or incoherent |
| 7 | Git worktrees complicate merge | LOW | MEDIUM | Only fork for genuine strategy decisions, not minor choices. Keep worktree count under 3 at any time. | Merge conflicts on worktree reintegration |
| 8 | Demo video recording issues | MEDIUM | LOW | Record at M7, leave buffer hours. Pre-script everything during M6. Do a dry run before recording. | First recording attempt fails or runs over 3 min |
| 9 | Judges see persona approach as presumptuous | MEDIUM | LOW | Frame as "interpretation based on public statements." Include disclaimer in README. Invite correction. Use phrasing like "our best interpretation" not "we know what you think." | N/A -- mitigate proactively in documentation |
| 10 | Other teams build similar concept | LOW | LOW | The proof layer (external calibration) is the moat. Self-evaluation is common; external calibration with prediction validation is not. | Discover similar project during hackathon |

### Fallback Architecture (If Agent Teams Fails)

If Agent Teams proves too unstable for reliable use:

1. Replace with 6 **sequential subagent calls** (slower but reliable)
2. Synthesis agent runs after all subagents complete
3. Dashboard still works -- reads from the same JSON output format
4. Lose the "agents debate" feature but keep multi-perspective evaluation
5. Update CLAUDE.md to document the fallback approach
6. Pivot the narrative: "We tested Agent Teams, found limitations, built a robust alternative"

### Agent Teams Decision Tree (Quick Reference)

```
Run 6-agent audit
  |
  +-- All 6 agents complete without crashes?
  |     YES -> CONTINUE (normal operation)
  |     NO  -> How many agents crashed?
  |              |
  |              +-- 1-2 agents crash, system recovers?
  |              |     YES -> RETRY with reduced agent count (drop crashed agents)
  |              |     NO  -> SWITCH to sequential subagents immediately
  |              |
  |              +-- 2+ agents crash or garbled output?
  |                    -> SWITCH to sequential subagents immediately
  |                    -> Log failure details for post-mortem
  |                    -> Update CLAUDE.md to document fallback
```

**Time limit:** If you spend >30 minutes debugging Agent Teams crashes, switch to sequential. The narrative pivot ("we tested it, found limitations, built better") is worth more than a fragile demo.

---

## Decision Points

These are the key moments where you must make a go/no-go decision. Do not deliberate -- use the criteria below.

| Milestone | Decision | Go Criteria | No-Go Action |
|-----------|----------|-------------|--------------|
| M1 | Agent Teams stable? | 6 agents complete an audit without crashes | Switch to sequential subagents |
| M3 | Dashboard MVP rendering? | AgentCards + RadarChart display real audit data | Simplify to Markdown-only output; focus on plugin |
| M4 | Agent Teams still stable after 3+ cycles? | No recurring crashes or garbled output | Fallback to sequential subagents permanently |
| M5 | Over budget? | Running total < $300 | Reduce to Sonnet-only for remaining audits |
| M6 | Score >= 85? | Final audit composite score >= 85 | Ship at current score; the iteration story matters more than the number |
| M6 | Demo video under 3 min? | Video is clear, compelling, under 3:00 | Re-record with tighter script; cut sections if needed |

---

## Model Routing Reference

Quick reference for which model and effort level to use per agent.

| Agent | Model | Effort | Rationale |
|-------|-------|--------|-----------|
| Boris (Architecture) | Opus 4.6 | max | Deep architectural reasoning |
| Cat (Product) | Opus 4.6 | high | Product insight requires nuance |
| Thariq (AI/Research) | Opus 4.6 | max | AI innovation needs deep thinking |
| Lydia (Frontend/DX) | Opus 4.6 | high | Pattern recognition, code analysis |
| Ado (DevRel/Docs) | Sonnet 4.5 | medium | Documentation checks are formulaic |
| Jason (Community) | Sonnet 4.5 | medium | Community impact and integration checks are structured |
| Synthesis | Sonnet 4.5 | medium | Merging is mechanical aggregation |

---

## Opus 4.6 Features to Showcase

Every major feature must map to a specific BoardClaude capability.

| Opus 4.6 Feature | BoardClaude Usage | Where It Appears |
|-------------------|-------------------|------------------|
| **Agent Teams** | 6+ agents evaluating in parallel, debating findings | Core audit pipeline |
| **1M Token Context** | Ingest entire codebase + all personas + audit history | Full-project audits without truncation |
| **Adaptive Thinking** | High effort for Boris/Lydia, medium for Ado/Jason | Per-agent effort configuration in panel YAML |
| **128K Output** | Full audit reports with cross-referenced findings | Comprehensive audit JSON output |
| **Context Compaction** | Multi-iteration sessions (5 audit cycles) maintain learnings | Iterative improvement loop |
| **Extended Thinking** | Deep reasoning on architecture and pattern analysis | Boris and Thariq agent evaluations |
| **Tool Use / MCP** | validation-runner feeds real data, WebSearch for project research, Playwright for visual testing | Agent evaluation pipeline, accessibility auditor |

### Prize Category Alignment

- **"Most Creative Opus 4.6 Exploration"** -> Agent Teams as evaluator personas + self-improvement loop with closed-loop validation + external calibration proof layer
- **"The 'Keep Thinking' Prize"** -> Extended thinking calibrated per agent, deep architectural analysis, multi-round debate, validation-runner data-backed reasoning

---

## Release Tags

| Version | Milestone | What It Contains |
|---------|-----------|------------------|
| v0.1.0 | M1 | Working `/bc:audit`, first self-audit baseline |
| v0.2.0 | M2 | Full pipeline, refined personas, `/bc:init`, calibration |
| v0.3.0 | M3 | Dashboard MVP with AgentCards + RadarChart + Timeline |
| v0.4.0 | M4 | Self-improvement proof, chronic detection, 3+ cycles |
| v0.5.0 | M5 | Installable plugin, templates, README, batch-evaluate |
| v1.0.0-rc | M6 | Demo-ready, final audit, polished |
| v1.0.0 | M7 | Submitted, deployed, public |

---

## Key URLs and References

| Resource | URL / Location |
|----------|----------------|
| Submission portal | https://cv.inc/e/claude-code-hackathon |
| BoardClaude site | https://boardclaude.com |
| GitHub repo | github.com/[USERNAME]/boardclaude |
| Context docs | `context/` (consolidated reference material) |
| Calibration target | Compound Engineering Plugin (github.com/codenamejason/compound-engineering-plugin) |

---

## The Focus Rule

> If it doesn't advance the current milestone, it goes in BACKLOG.md.
> "Working and ugly" beats "beautiful and broken" every single time.
> When in doubt, cut scope. When not in doubt, still consider cutting scope.

Write new ideas in a `BACKLOG.md` file and come back to them after Feb 16.
