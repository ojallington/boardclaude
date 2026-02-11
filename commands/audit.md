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

## Execution Steps

1. **Load panel configuration**: Read `panels/<name>.yaml` to get agent definitions, weights, and criteria.

2. **Check prerequisites**: Ensure `.boardclaude/` directory exists. If not, prompt user to run `/bc:init` first. Create `audits/` subdirectory if missing.

3. **Load previous state and cross-iteration context**: Read `.boardclaude/state.json` for audit history and `timeline.json` for event log. If a `--previous` audit is specified, load it for delta comparison. **Always load the 2 most recent audit JSONs** from `.boardclaude/audits/` (sorted by filename timestamp, descending). Extract from each:
   - Per-agent scores and composites
   - Action items (what was flagged, what was resolved)
   - Iteration delta (trend direction)
   - Key strengths/weaknesses
   This cross-iteration context will be included in every agent's prompt so they can evaluate iteration-over-iteration progress.

4. **Ingest target project**: Scan the target codebase using Read, Glob, and Grep tools. Build a project summary including:
   - File tree structure
   - Key configuration files (package.json, tsconfig.json, CLAUDE.md, etc.)
   - Source file contents (prioritize by relevance to each agent's criteria)

5. **Spawn Agent Team**: Create an Agent Team with one teammate per panel agent. Each teammate receives:
   - Their specific persona prompt from the panel YAML (or referenced prompt_file)
   - The ingested project summary
   - **Cross-iteration context**: The 2 most recent audit JSONs (loaded in step 3), formatted as a summary block:
     ```
     ## Previous Audit Context

     ### Most Recent Audit (iteration N, score X.XX)
     - Your previous scores: {agent's scores from that audit}
     - Your previous action items: {list}
     - Overall composite: X.XX (grade)
     - Resolved items since last audit: {list}

     ### Second Most Recent Audit (iteration N-1, score Y.YY)
     - Your previous scores: {agent's scores}
     - Overall composite: Y.YY (grade)

     ### Iteration Trend
     - Score trajectory: [list of composite scores across iterations]
     - Items resolved vs. introduced per iteration
     ```
   - Their specific evaluation criteria and weights
   - Instructions to output structured JSON matching the agent report schema
   - **Instruction to use iteration context**: "Reference your previous scores and action items. Verify whether previously-flagged issues have been resolved. Score improvement trajectory in your compound_learning or equivalent criterion. If you flagged an issue last iteration and it was resolved, acknowledge it explicitly in your strengths."

6. **Use delegate mode**: The lead agent should enter delegate mode (Shift+Tab) to avoid implementing changes itself. Wait for all teammates to complete their evaluations.

7. **Collect agent reports**: Gather the structured JSON output from each agent teammate. Each report includes:
   - Agent name
   - Per-criterion scores (0-100)
   - Composite score (weighted average of criteria)
   - Top 3 strengths with file/line references
   - Top 3 weaknesses with file/line references
   - Critical issues (blocking problems)
   - Prioritized action items with expected impact
   - Verdict: STRONG_PASS | PASS | MARGINAL | FAIL

8. **Run synthesis**: Spawn a synthesis subagent (using agents/synthesis.md) that merges all reports into a unified output:
   - Weighted composite score across all agents
   - Radar chart data (one axis per agent dimension)
   - Top strengths agreed by 2+ agents
   - Top weaknesses agreed by 2+ agents
   - Divergent opinions (where agents disagree by 20+ points)
   - Prioritized action items ranked by impact and effort
   - Iteration delta (improvement/regression from previous audit)
   - Overall verdict and letter grade

9. **Save outputs**:
   - Write JSON report to `.boardclaude/audits/audit-{timestamp}.json`
   - Write Markdown summary to `.boardclaude/audits/audit-{timestamp}.md`
   - Update `.boardclaude/state.json` with latest audit info and score history
   - Append audit event to `.boardclaude/timeline.json`

10. **Display results**: Show the Markdown summary to the user including:
    - Composite score with grade
    - Per-agent score breakdown
    - Top 3 action items
    - Iteration delta if applicable
    - Path to full report files
    - Dashboard link: `To view in the dashboard, run: cd dashboard && npm run dev` then open `http://localhost:3000/results`

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

When the panel type is `personal` (e.g., `--panel personal-oscar`), the audit adds a deliberation phase:

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

- Agent Teams use approximately 7x more tokens than standard sessions
- Opus agents (boris, cat, thariq, lydia) cost more but provide deeper analysis
- Sonnet agents (ado, jason) are more cost-effective for structured evaluation
- Use `--effort low` for quick baseline checks, `--effort max` for final audits
- The synthesis agent always runs as a subagent (not a teammate) after all judges complete
- Personal panels cost ~2x more than professional panels due to the cross-examination round

$ARGUMENTS
