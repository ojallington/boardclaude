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

## Architecture: Single-Tier Orchestration

The audit uses a single-tier orchestration model where the skill runner directly manages all agents:

```
SKILL RUNNER (full orchestrator)
  |
  +---> 6 JUDGE AGENTS (team members, bypassPermissions, parallel)
  |
  +---> SYNTHESIS AGENT (team member, bypassPermissions)
```

- **Skill runner**: Reads config, creates team, ingests codebase, spawns judges directly, orchestrates debate, runs synthesis, writes files, displays results.
- **Judges**: Evaluate independently, send JSON to skill runner via SendMessage.
- **Synthesis**: Merges all evaluations into unified report, sends back via SendMessage.

All spawned agents use `mode: "bypassPermissions"` and `team_name` — they are proper team members that can communicate via SendMessage.

## Execution Steps

1. **Load panel configuration**: Read `panels/<name>.yaml` to get agent definitions, weights, and criteria.

2. **Check prerequisites**: Ensure `.boardclaude/` directory exists. If not, prompt user to run `/bc:init` first. Create `audits/` subdirectory if missing.

3. **Load state**: Read `.boardclaude/state.json` for iteration number, latest audit ID, score history.

4. **Create team**: `TeamCreate("audit-{timestamp}")` for this audit run.

5. **Ingest codebase**: Use Glob + Read to discover and read key project files. Build a comprehensive project summary (~2000-4000 tokens) for judges.

6. **Load cross-iteration context**: Read the 2 most recent audit JSONs for trend comparison.

7. **Spawn 6 judge agents**: Launch all judges in parallel via Task with `mode: "bypassPermissions"` and `team_name: "audit-{timestamp}"`. Each judge receives:
   - Full agent persona from `agents/{name}.md`
   - Codebase summary
   - Evaluation criteria and weights
   - Previous audit context
   - Output schema

8. **Collect evaluations**: Parse `EVAL_REPORT_START/EVAL_REPORT_END` delimited JSON from each judge. 3-minute nudge, 5-minute per-agent timeout. Minimum 4/6 agents required. Weight redistribution for timeouts.

9. **Run debate**: Identify divergent score pairs, exchange positions between agents, apply bounded score revisions.

10. **Spawn synthesis agent**: Launch synthesis with all evaluations, debate transcript, weights, and output schema. Collect via `SYNTHESIS_REPORT_START/SYNTHESIS_REPORT_END`.

11. **Calculate & validate**: Verify composite calculation, map grade and verdict.

12. **Write output files**: Audit JSON, audit MD, state.json, timeline.json, action-items.json — all to `.boardclaude/audits/` and `.boardclaude/`.

13. **Display results**: Show composite score, grade, verdict, top strengths/weaknesses, action items, delta, and file paths.

14. **Teardown**: Shutdown all team members + TeamDelete.

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

When the panel type is `personal` (e.g., `--panel personal-oscar`), the skill runner adds a deliberation phase:

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

- All codebase ingestion happens inside the skill runner
- No permission prompts — all spawned agents use `mode: "bypassPermissions"`
- Agent Teams use approximately 7x more tokens than standard sessions
- Opus agents (boris, cat, thariq, lydia) cost more but provide deeper analysis
- Sonnet agents (ado, jason, synthesis) are cost-effective for structured work
- Use `--effort low` for quick baseline checks, `--effort max` for final audits

$ARGUMENTS
