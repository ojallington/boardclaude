---
name: audit-runner
description: Run multi-agent panel audits on codebases. Use when evaluating code quality, running board reviews, or scoring projects against configurable criteria. Triggers on "audit", "evaluate", "review", "score", "panel", "board".
allowed-tools: Read, Grep, Glob, Bash, Write, Task, TeamCreate, TeamDelete, SendMessage
context: fork
agent: general-purpose
---

# Audit Runner — ultrathink

## Overview

Execute the full BoardClaude audit pipeline: load a panel configuration, spawn one agent per panel member, collect structured evaluations, run synthesis, calculate composite scores, generate radar chart data, and persist results to the `.boardclaude/` state directory. Supports delta comparison against previous audits for iteration tracking.

## Prerequisites

Before running, verify:
- Panel config exists: !`ls panels/*.yaml 2>/dev/null | head -5`
- BoardClaude state dir: !`ls .boardclaude/ 2>/dev/null || echo "NOT FOUND — will create"`
- Git status: !`git log --oneline -3 2>/dev/null || echo "No git history"`
- Previous audits: !`ls .boardclaude/audits/*.json 2>/dev/null | tail -3 || echo "None — this is the first audit"`

## Steps

1. **Load panel config** from `panels/[name].yaml` (default: `panels/hackathon-judges.yaml`). Parse the YAML to extract:
   - Panel name, type (professional/personal), version
   - Agent list with: name, role, weight, model, effort level, criteria
   - Debate configuration (rounds, format, verdict options)
   - Scoring config (scale, passing threshold, iteration target)
   - Verify all agent weights sum to 1.0

2. **Verify `.boardclaude/` directory** exists. If not, create the full structure:
   ```
   .boardclaude/
   ├── state.json
   ├── timeline.json
   └── audits/
   ```
   Initialize `state.json` with defaults and `timeline.json` with empty events array.

3. **Load previous audit** for delta comparison (if exists):
   - Read `.boardclaude/state.json` to find `latest_audit`
   - Load the corresponding audit JSON from `.boardclaude/audits/`
   - Extract previous scores per agent for comparison
   - If no previous audit exists, this is iteration 0 (baseline)

4. **For each agent in the panel**, spawn a teammate via Agent Teams (or subagent for quick reviews):
   a. Load the agent persona from the file specified in `prompt_file` (e.g., `agents/boris.md`)
   b. Pass to the agent:
      - Full codebase path and scope
      - Agent persona and evaluation criteria with weights
      - Previous scores for this agent (if available) for delta tracking
      - Instructions to cite specific files and line numbers
   c. Each agent must output structured JSON matching the Agent Evaluation Schema (below)
   d. Use the model specified in the panel config (Opus for deep evaluators, Sonnet for formulaic ones)

5. **Wait for all agents to complete**. Do NOT proceed to synthesis until every agent has reported. Track completion status.

6. **Run synthesis agent** to merge all findings:
   a. Pass ALL agent evaluations to the synthesis agent
   b. The synthesis agent must NOT invent findings — only merge what agents reported
   c. Present conflicts with analysis (e.g., Boris says architecture is strong but Jason says error handling is weak)
   d. Calculate composite scores using panel-defined weights
   e. Generate radar chart data with one axis per panel dimension
   f. Produce prioritized action items with effort estimates

7. **Calculate composite scores** (weighted averages):
   - Per-agent composite: sum of (criterion_score * criterion_weight) for each agent
   - Panel composite: sum of (agent_composite * agent_weight) for all agents
   - Grade mapping: A+ (95-100), A (90-94), A- (85-89), B+ (80-84), B (75-79), B- (70-74), C+ (65-69), C (60-64), C- (55-59), D (50-54), F (<50)
   - Verdict: STRONG_PASS (>=85), PASS (>=70), MARGINAL (>=55), FAIL (<55)

8. **Generate radar chart data** with axes matching panel evaluation dimensions:
   - architecture, product, innovation, code_quality, documentation, integration (for hackathon panel)
   - Map each agent's scores to the corresponding dimension
   - Average across agents for each dimension

9. **Save machine-readable output** to `.boardclaude/audits/audit-{timestamp}.json`

10. **Save human-readable report** to `.boardclaude/audits/audit-{timestamp}.md` with:
    - Summary header with composite score and grade
    - Per-agent cards with scores, strengths, weaknesses, verdict
    - Radar chart data (as ASCII or data for dashboard)
    - Prioritized action items
    - Iteration delta (if previous audit exists)

11. **Update `.boardclaude/state.json`**:
    ```json
    {
      "project": "<project name>",
      "panel": "<panel name>",
      "branch": "<current git branch>",
      "audit_count": <incremented>,
      "latest_audit": "audit-{timestamp}",
      "latest_score": <composite score>,
      "score_history": [<append new score>],
      "worktrees": [<active worktrees>],
      "status": "active"
    }
    ```

12. **Append to `.boardclaude/timeline.json`**:
    ```json
    {
      "id": "audit-{timestamp}",
      "type": "audit",
      "branch": "<current branch>",
      "timestamp": "<ISO 8601>",
      "parent": "<previous audit id or null>",
      "commit": "<git commit hash>",
      "scores": { "<agent>": <agent_composite>, "..." : "..." },
      "composite": <panel composite>,
      "label": "Iteration <N>: <grade> (<composite>)",
      "status": "active"
    }
    ```

13. **Seed action items ledger** (if this is the first audit or new items exist):
    - If `.boardclaude/action-items.json` does not exist, create it from the synthesis `action_items` array
    - If it already exists, merge new action items (match by `action` text to avoid duplicates; new items get `status: "open"`)
    - Items open for 3+ consecutive audits should be flagged as `chronic`
    - Update `stats` counts to reflect current ledger state

14. **Report results** to the user:
    - Composite score with grade and verdict
    - Top 3 strengths and top 3 weaknesses across all agents
    - Any critical issues flagged
    - Top 5 prioritized action items
    - Iteration delta summary (if applicable)
    - Path to full report files

## Agent Evaluation Schema (per-agent output)

Each agent must produce JSON in this format:

```json
{
  "agent": "<agent name>",
  "scores": {
    "<criterion_1>": <0-100>,
    "<criterion_2>": <0-100>,
    "<criterion_3>": <0-100>,
    "<criterion_4>": <0-100>
  },
  "composite": <weighted average of scores>,
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "critical_issues": ["<blocking issue if any>"],
  "action_items": [
    {
      "priority": 1,
      "action": "<specific action with file/line references>",
      "impact": "<expected improvement>"
    }
  ],
  "verdict": "<STRONG_PASS | PASS | MARGINAL | FAIL>",
  "one_line": "<single sentence summary>"
}
```

## Synthesis Output Schema (full audit report)

```json
{
  "audit_id": "audit-{timestamp}",
  "panel": "<panel name>",
  "target": "<what was evaluated>",
  "iteration": <number>,
  "timestamp": "<ISO 8601>",
  "agents": [
    {
      "agent": "<name>",
      "scores": { "<criterion>": <score>, "..." : "..." },
      "composite": <number>,
      "strengths": ["..."],
      "weaknesses": ["..."],
      "critical_issues": ["..."],
      "verdict": "<STRONG_PASS | PASS | MARGINAL | FAIL>"
    }
  ],
  "composite": {
    "score": <weighted average>,
    "radar": {
      "architecture": <avg>,
      "product": <avg>,
      "innovation": <avg>,
      "code_quality": <avg>,
      "documentation": <avg>,
      "integration": <avg>
    },
    "grade": "<A+ through F>",
    "verdict": "<STRONG_PASS | PASS | MARGINAL | FAIL>"
  },
  "highlights": {
    "top_strengths": ["<top 3 across all agents>"],
    "top_weaknesses": ["<top 3 across all agents>"],
    "divergent_opinions": [
      {
        "topic": "<what they disagree on>",
        "agent_a": { "agent": "<name>", "position": "<view>" },
        "agent_b": { "agent": "<name>", "position": "<view>" },
        "analysis": "<why they diverge and who is probably right>"
      }
    ]
  },
  "action_items": [
    {
      "priority": 1,
      "action": "<specific action>",
      "source_agent": "<who recommended it>",
      "impact": "<expected score improvement>",
      "effort": "<low | medium | high>"
    }
  ],
  "iteration_delta": {
    "previous_score": <number or null>,
    "current_score": <number>,
    "delta": <number or null>,
    "improvements": ["<what got better>"],
    "regressions": ["<what got worse>"]
  }
}
```

## Agent Team Configuration

When using Agent Teams for a full panel audit:

- **Create team** with one agent per panel member plus one synthesis agent
- **Team Lead coordinates** — the lead does NOT evaluate. It spawns teammates, assigns tasks, waits, then synthesizes.
- **Each teammate** receives:
  - The full agent persona prompt (from `agents/<name>.md`)
  - The codebase path and scope to evaluate
  - Previous scores for delta tracking
  - Output format requirements (the Agent Evaluation Schema above)
- **Teammates do NOT inherit conversation context** — pass all task-specific details in the spawn prompt
- **Wait for ALL agents to complete** before running synthesis
- **Synthesis runs as a subagent** (not a teammate) since it needs no peer interaction, only the collected results

### Model Routing

| Agent | Model | Effort | Rationale |
|-------|-------|--------|-----------|
| Boris | Opus 4.6 | max | Deep architectural reasoning |
| Cat | Opus 4.6 | high | Product insight requires nuance |
| Thariq | Opus 4.6 | max | AI innovation needs deep thinking |
| Lydia | Opus 4.6 | high | Pattern recognition, code analysis |
| Ado | Sonnet 4.5 | medium | Documentation checks are formulaic |
| Jason | Sonnet 4.5 | medium | Integration checks are structured |
| Synthesis | Sonnet 4.5 | medium | Merging is mechanical |

## Audit State Machine

The audit follows this state progression:

```
IDLE → INGEST → PANEL_AUDIT → SYNTHESIZE → REPORT → COMPLETE
                                    ↓
                              (if auto-implement)
                            IMPLEMENT → VERIFY → RE-AUDIT?
```

Track current state in `.boardclaude/state.json` under `current_audit.state`.

## Error Handling

- If an agent fails to produce valid JSON, retry once with explicit format instructions
- If an agent times out, record a null evaluation and note it in synthesis
- If `.boardclaude/` is missing, create it silently and proceed
- If no panel config is found, prompt the user to run init or specify a panel
- Never overwrite previous audit files — always create new timestamped files

## Personal Panel Mode

When the panel type is `personal`, the audit pipeline adds a deliberation phase:

1. **Round 1**: Independent assessment (same as professional)
2. **Round 2**: Cross-examination — each agent reads other agents' evaluations and responds:
   - Agreements are noted
   - Disagreements are argued with evidence
   - Agents with veto power can block scope additions
3. **Synthesis**: Produces verdict (SHIP / CONTINUE / PIVOT / PAUSE) plus single most important action
