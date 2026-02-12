# /bc:audit -- Run Full Panel Audit

Run a multi-agent panel audit on the current project (or a specified target).
Each agent evaluates independently using their persona and criteria, then a
synthesis agent merges all findings into a unified report.

## Usage

```
/bc:audit [target] [--panel <name>] [--effort <level>] [--previous <audit-id>]
```

## Parameters

- `$ARGUMENTS` -- Optional: target path, panel name, effort level, or previous audit ID
- `--panel <name>` -- Which panel to use (default: hackathon-judges). Looks in panels/ directory.
- `--effort <level>` -- low | medium | high | max. Controls thinking depth for all agents (default: high).
- `--target <path|url>` -- Path to project or GitHub URL (default: current directory).
- `--previous <audit-id>` -- Path to previous audit for delta comparison.

## Architecture: Two-Tier Delegation

The audit uses a two-tier delegation model to keep the main agent lightweight:

```
MAIN AGENT (delegate launcher, ~5-8 tool calls)
  |
  v
AUDIT COORDINATOR (autonomous, bypassPermissions)
  |
  +---> 6 JUDGE AGENTS (autonomous, bypassPermissions, parallel)
  |
  +---> SYNTHESIS AGENT (autonomous, bypassPermissions)
```

- **Main agent**: Reads config, creates team, spawns coordinator, relays results. Never ingests codebase.
- **Coordinator**: Ingests codebase, spawns judges, orchestrates debate, runs synthesis, writes files.
- **Judges**: Evaluate independently, send JSON to coordinator.
- **Synthesis**: Merges all evaluations into unified report.

All spawned agents use `mode: "bypassPermissions"` — no permission prompts appear.

## Execution Steps

1. **Load panel configuration**: Read `panels/<name>.yaml` to get agent definitions, weights, and criteria.

2. **Check prerequisites**: Ensure `.boardclaude/` directory exists. If not, prompt user to run `/bc:init` first. Create `audits/` subdirectory if missing.

3. **Load state**: Read `.boardclaude/state.json` for iteration number, latest audit ID, score history. This metadata is passed to the coordinator.

4. **Create team**: `TeamCreate("audit-{timestamp}")` for this audit run.

5. **Spawn audit coordinator**: Launch the coordinator as an autonomous teammate via Task with `mode: "bypassPermissions"`. Pass it:
   - Full `agents/audit-coordinator.md` instructions
   - Panel config YAML (inline)
   - Iteration metadata and CLI flags
   - Output schemas

   The coordinator then autonomously:
   - Ingests the target codebase (Glob + Read + Grep)
   - Loads cross-iteration context (2 most recent audit JSONs)
   - Spawns 6 judge agents (all with `mode: "bypassPermissions"`)
   - Collects evaluations using `EVAL_REPORT_START/EVAL_REPORT_END` delimiters (5 min/agent timeout, 3 min nudge, minimum 4/6 agents required, weight redistribution for timeouts)
   - Runs debate, applies score revisions
   - Spawns synthesis agent (with `mode: "bypassPermissions"`), collects via `SYNTHESIS_REPORT_START/SYNTHESIS_REPORT_END`
   - Writes audit JSON, MD, state.json, timeline.json, action-items.json
   - Sends structured completion report via SendMessage wrapped in `AUDIT_COMPLETE_START/AUDIT_COMPLETE_END`

6. **Wait for completion**: The main agent idles until the coordinator reports via `AUDIT_COMPLETE_START/AUDIT_COMPLETE_END` delimiters. No manual delegation needed — the coordinator handles everything autonomously. Timeout: 15 minutes wall clock. If `AUDIT_FAILED` is received instead (< 4 judges reported), relay the error to the user and teardown.

7. **Collect results**: Parse the coordinator's delimited `AUDIT_COMPLETE_START/END` block to extract composite score, grade, verdict, top items, file paths, timed_out_agents, and effective_weights.

8. **Display results**: Show the summary to the user including:
   - Composite score with grade
   - Per-agent score breakdown
   - Top 3 action items
   - Iteration delta if applicable
   - Path to full report files
   - Dashboard link: `To view in the dashboard, run: cd dashboard && npm run dev` then open `http://localhost:3000/results`

9. **Teardown**: Send shutdown requests to coordinator, then `TeamDelete`.

## Agent Report Schema

Each agent outputs:
```json
{
  "agent": "<name>",
  "scores": {
    "<criterion>": <0-100>,
    ...
  },
  "composite": <weighted_average>,
  "strengths": ["<with file references>"],
  "weaknesses": ["<with file references>"],
  "critical_issues": ["<blocking issues>"],
  "action_items": [
    { "priority": 1, "action": "<specific>", "impact": "<expected improvement>" }
  ],
  "verdict": "STRONG_PASS | PASS | MARGINAL | FAIL",
  "one_line": "<single sentence summary>"
}
```

## Personal Panel Mode

When the panel type is `personal` (e.g., `--panel personal-oscar`), the coordinator adds a deliberation phase:

1. **Round 1 — Independent assessment**: Same as professional panels. Each agent scores independently.

2. **Round 2 — Cross-examination**: Each agent reads the other agents' evaluations and responds:
   - Agreements are noted and strengthened
   - Disagreements are argued with evidence
   - Agents with `veto_power: true` (typically The Shipper) can block scope additions

3. **Synthesis**: Produces a personal verdict instead of the standard professional verdict:
   - **SHIP**: Ready to release. No blocking issues.
   - **CONTINUE**: Good progress but needs more work on specific items.
   - **PIVOT**: Current approach is not working. Change strategy.
   - **PAUSE**: Stop and reassess. Scope creep or burnout risk detected.

The synthesis also identifies the single most important action item.

## Notes

- The main agent stays lightweight (~5-8 tool calls, minimal context usage)
- All codebase ingestion happens inside the coordinator agent
- No permission prompts — all spawned agents use `mode: "bypassPermissions"`
- Agent Teams use approximately 7x more tokens than standard sessions
- Opus agents (boris, cat, thariq, lydia) cost more but provide deeper analysis
- Sonnet agents (ado, jason, coordinator, synthesis) are cost-effective for structured work
- Use `--effort low` for quick baseline checks, `--effort max` for final audits

$ARGUMENTS
