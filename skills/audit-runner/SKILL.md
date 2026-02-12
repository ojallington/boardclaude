---
name: audit-runner
description: Run multi-agent panel audits on codebases. Use when evaluating code quality, running board reviews, or scoring projects against configurable criteria. Triggers on "audit", "evaluate", "review", "score", "panel", "board".
allowed-tools: Read, Task, TeamCreate, TeamDelete, SendMessage
context: fork
agent: general-purpose
---

# Audit Runner — Delegate Launcher

## Overview

Thin launcher that loads panel config, creates a team, and delegates the entire audit pipeline to an autonomous audit-coordinator agent. The launcher never ingests codebase files or spawns judge agents directly — it only coordinates at a high level and relays results to the user.

## Prerequisites

Before running, verify:
- Panel config exists: !`ls panels/*.yaml 2>/dev/null | head -5`
- BoardClaude state dir: !`ls .boardclaude/ 2>/dev/null || echo "NOT FOUND — will create"`
- Previous audits: !`ls .boardclaude/audits/*.json 2>/dev/null | tail -3 || echo "None — this is the first audit"`

## Steps

### Step 1: Load Panel Config

Read `panels/[name].yaml` (default: `panels/hackathon-judges.yaml`). Parse the YAML to extract:
- Panel name, type (professional/personal), version
- Agent list with: name, role, weight, model, effort level, criteria
- Debate configuration (rounds, format, verdict options)
- Scoring config (scale, passing threshold, iteration target)
- Verify all agent weights sum to 1.0

### Step 2: Load State

Read `.boardclaude/state.json` to get:
- Current iteration number (`audit_count`)
- Latest audit ID (`latest_audit`)
- Score history for trend tracking
- If state.json doesn't exist, this is the first audit (iteration 0)

### Step 3: Create Team

Create a team for this audit run:

```
TeamCreate("audit-{timestamp}")
```

Use current epoch seconds for the timestamp.

### Step 4: Spawn Audit Coordinator

Read the full content of `agents/audit-coordinator.md` and spawn the coordinator as an autonomous teammate:

```
Task(
  subagent_type: "general-purpose",
  team_name: "audit-{timestamp}",
  name: "audit-coordinator",
  mode: "bypassPermissions",
  prompt: [see below]
)
```

The coordinator prompt must include:
- The full `agents/audit-coordinator.md` content (inline — the coordinator has no prior context)
- The panel config YAML (inline)
- Iteration metadata: iteration number, latest audit ID, score history
- Project root path
- Any CLI flags passed by the user: `--panel`, `--effort`, `--target`, `--previous`
- The Agent Evaluation Schema and Synthesis Output Schema (from the schemas below)

### Step 5: Wait for Completion

The coordinator will run the full pipeline autonomously:
1. Ingest the codebase
2. Spawn 6 judge agents (all with `mode: "bypassPermissions"`)
3. Collect evaluations
4. Run debate round
5. Spawn synthesis agent (with `mode: "bypassPermissions"`)
6. Write all output files
7. Send a structured completion report via SendMessage

Wait for the coordinator's completion report, delimited by `AUDIT_COMPLETE_START` and `AUDIT_COMPLETE_END`. Parse the structured fields from the delimited block (audit_id, composite, grade, verdict, top items, file paths, timed_out_agents, effective_weights).

Timeout: 15 minutes wall clock. If timeout: send shutdown to coordinator, report timeout to user, call TeamDelete.

If `AUDIT_FAILED` is received instead of `AUDIT_COMPLETE_START/END` (meaning < 4 judges reported), relay the error to the user with the list of timed-out and collected agents, then teardown.

If the completion report includes `timed_out_agents`, note which agents timed out in the user-facing report.

### Step 6: Report to User

Relay the coordinator's completion report. Display:

```
Audit Complete — Iteration {N}
================================
Composite: {score} ({grade}) — {verdict}

Top Strengths:
  1. {strength}
  2. {strength}
  3. {strength}

Top Weaknesses:
  1. {weakness}
  2. {weakness}
  3. {weakness}

Top Action Items:
  1. {item}
  2. {item}
  3. {item}
  4. {item}
  5. {item}

Score Delta: {delta} (from {previous} to {current})

Output files:
  JSON: .boardclaude/audits/{audit-id}.json
  Report: .boardclaude/audits/{audit-id}.md

To view in the dashboard: cd dashboard && npm run dev
Then open http://localhost:3000/results
```

### Step 7: Teardown

1. Send shutdown requests to the coordinator (who will shut down its children)
2. Call `TeamDelete` to clean up the team

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
      "scores": { "<criterion>": <score> },
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
      "source_agents": ["<who recommended it>"],
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

## Model Routing

| Agent | Model | Effort | Rationale |
|-------|-------|--------|-----------|
| Boris | Opus 4.6 | max | Deep architectural reasoning |
| Cat | Opus 4.6 | high | Product insight requires nuance |
| Thariq | Opus 4.6 | max | AI innovation needs deep thinking |
| Lydia | Opus 4.6 | high | Pattern recognition, code analysis |
| Ado | Sonnet 4.5 | medium | Documentation checks are formulaic |
| Jason | Sonnet 4.5 | medium | Integration checks are structured |
| Synthesis | Sonnet 4.5 | medium | Merging is mechanical |
| Coordinator | Sonnet 4.5 | medium | Orchestration, not evaluation |

## Error Handling

- **Coordinator timeout (15 min)**: Send shutdown to coordinator, report timeout to user with any partial context available, call TeamDelete.
- **`AUDIT_FAILED` relay**: If coordinator sends `AUDIT_FAILED` (< 4 judges reported), relay the error to the user including which agents timed out and which reported successfully. Suggest re-running with `--effort low` for faster execution.
- **Partial results**: If coordinator sends `AUDIT_COMPLETE_START/END` with `timed_out_agents`, include a note in the user report: "Note: {N} agent(s) timed out ({names}). Weights were redistributed among reporting agents."
- If `.boardclaude/` is missing, the coordinator will create it.
- If no panel config is found, prompt the user to run `/bc:init` or specify a panel.
- Never overwrite previous audit files — always create new timestamped files.

## Personal Panel Mode

When the panel type is `personal`, the coordinator adds a deliberation phase:

1. **Round 1**: Independent assessment (same as professional)
2. **Round 2**: Cross-examination — each agent reads other agents' evaluations and responds
3. **Synthesis**: Produces verdict (SHIP / CONTINUE / PIVOT / PAUSE) plus single most important action

## Notes

- The main agent stays lightweight (~5-8 tool calls total)
- All codebase ingestion happens inside the coordinator
- No permission prompts appear — all spawned agents use `mode: "bypassPermissions"`
- Agent Teams use approximately 7x more tokens than standard sessions
- Use `--effort low` for quick baseline checks, `--effort max` for final audits

$ARGUMENTS
