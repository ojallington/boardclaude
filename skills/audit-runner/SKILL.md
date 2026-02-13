---
name: audit-runner
description: Run multi-agent panel audits on codebases. Use when evaluating code quality, running board reviews, or scoring projects against configurable criteria. Triggers on "audit", "evaluate", "review", "score", "panel", "board".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task, TeamCreate, TeamDelete, SendMessage
context: fork
agent: general-purpose
---

# Audit Runner — Single-Tier Orchestrator

## Overview

Full orchestrator that loads panel config, creates a team, ingests the codebase, spawns judge agents directly as team members, runs debate, spawns synthesis, writes output files, and displays results to the user. All orchestration happens in this skill runner — no coordinator middleman.

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

### Step 4: Codebase Ingestion

Ingest the target codebase to build a project summary for judges:

1. **Create output directory**:
   ```bash
   mkdir -p .boardclaude/audits
   ```

2. **Discover project structure**: Use Glob to find key files:
   - `package.json`, `tsconfig.json`, `CLAUDE.md`, `README.md`
   - Source files: `src/**/*.ts`, `src/**/*.tsx`
   - Tests: `**/*.test.*`, `**/*.spec.*`
   - Config: `.eslintrc*`, `prettier*`, `next.config.*`

3. **Read key files**: Read the most important files to understand the project:
   - `package.json` (dependencies, scripts)
   - `CLAUDE.md` (project instructions)
   - `README.md` (project description)
   - Key source files prioritized by relevance (components, lib, pages)

4. **Build project summary**: Compile a comprehensive summary (~2000-4000 tokens) that all judges will receive. Include:
   - Project purpose and architecture
   - Tech stack and dependencies
   - File structure overview
   - Key patterns observed
   - Test coverage indicators

### Step 5: Load Cross-Iteration Context

Read the 2 most recent audit JSONs from `.boardclaude/audits/` (sorted by filename timestamp, descending). Extract from each:
- Per-agent scores and composites
- Action items (what was flagged, what was resolved)
- Iteration delta (trend direction)
- Key strengths/weaknesses

If no previous audits exist, note this is a baseline audit.

### Step 6: Spawn Judges

For each agent defined in the panel config, read the agent persona file (`agents/{name}.md`) and spawn as a team member:

```
Task(
  subagent_type: "<agent-type from panel>",  // e.g., "agent-boris"
  team_name: "audit-{timestamp}",            // CRITICAL: makes them team members
  name: "<agent name>",                      // e.g., "boris"
  mode: "bypassPermissions",
  prompt: <see Judge Prompt Template below>
)
```

**Model routing** follows the panel config:
- Opus agents: boris, cat, thariq, lydia (deep analysis)
- Sonnet agents: ado, jason (structured evaluation)

Spawn all 6 judges in parallel (multiple Task calls in a single message).

### Step 7: Collect Evaluations

1. **Initialize tracking**:
   - `expected`: list of agent names from panel config (6 agents)
   - `collected`: empty map (agent_name -> evaluation JSON)
   - `timed_out`: empty list
   - `start_time`: current wall clock time

2. **Primary collection**: As each judge sends a message via SendMessage, parse for
   `EVAL_REPORT_START` and `EVAL_REPORT_END` delimiters. Extract the JSON between them.
   Validate: must be parseable JSON with required fields (agent, scores, composite, verdict).
   Add to `collected` map. Log: "Collected {N}/{expected}: {agent_name} ({composite})"

3. **Nudge at 3 min**: For any agent not yet in `collected`:
   - Send nudge via SendMessage: "Evaluation expected. Send your complete JSON wrapped in
     EVAL_REPORT_START / EVAL_REPORT_END delimiters."

4. **Timeout at 5 min per agent**: For any agent still missing after 5 minutes from spawn:
   - Record null evaluation: `{ agent: "<name>", scores: null, timed_out: true }`
   - Add to `timed_out` list
   - Log: "TIMEOUT: {agent_name} did not report within 5 minutes"

5. **Verification gate**: Assert:
   - `len(collected) + len(timed_out) == len(expected)` (accounting complete)
   - `len(collected) >= 4` (minimum viable panel)
   - If gate fails (<4 successful agents): ABORT audit, report error to user:
     "AUDIT_FAILED: Only {N}/6 agents reported. Minimum 4 required."
     List timed_out and collected agents. Suggest re-running with `--effort low`. Teardown and exit.

6. **Weight redistribution**: If any agents timed out, redistribute their weight
   proportionally among successful agents:
   - For each timed_out agent: distribute its weight across collected agents
     proportionally to their original weights
   - Formula: `new_weight(a) = original_weight(a) + timed_out_weight * (original_weight(a) / sum_of_remaining_weights)`
   - Log redistribution table

7. **Proceed with summary**: Log collection summary before moving to debate:
   "Collection complete: {N}/6 agents, {M} timed out. Effective weights: {table}"

### Step 8: Debate

Read the panel's `debate:` config. If `debate.enabled` is false or missing, skip to Step 9.

1. **Identify divergent pairs**: For each pair in `debate.related_criteria`, extract scores from the respective agent evaluations. Calculate the absolute delta. Flag pairs where delta >= `debate.divergence_threshold`. Sort by delta descending. Take top `debate.max_pairs`.

2. **For each divergent pair** (Agent A = higher scorer, Agent B = lower scorer):

   a. Send `SendMessage` to Agent A:
      ```
      {agent_b_name} ({role}) scored {criterion} at {score}.
      Their reasoning: {B's relevant strengths/weaknesses}.
      You scored {related_criterion} at {your_score}.
      In 2-3 sentences, respond: where do you agree, where do you disagree?
      If you'd revise any score, include: REVISED: {criterion}: {new_score} (max +/-5 from original).
      ```

   b. Wait for Agent A's response.

   c. Forward Agent A's response to Agent B via SendMessage:
      ```
      {agent_a_name} responded: '{A's reply}'.
      Your counter-response? Same revision format if applicable.
      ```

   d. Wait for Agent B's response.

   e. Parse both responses for score revisions using regex: `REVISED:\s*(\w+):\s*(\d+)`.

   f. Record the exchange in a debate transcript.

3. **Apply revisions**: Update agent scores with any REVISED values. Bound changes to +/-`debate.score_revision_bound` from original. Recalculate composites.

### Step 9: Synthesis

Spawn the synthesis agent as a team member:

```
Task(
  subagent_type: "agent-synthesis",
  team_name: "audit-{timestamp}",  // CRITICAL: makes it a team member
  name: "synthesis",
  mode: "bypassPermissions",
  prompt: <all 6 evaluations + debate transcript + panel weights + output schema + timed_out_agents + effective_weights>
)
```

The synthesis agent must:
- NOT invent findings — only merge what agents reported
- Calculate weighted composite scores using panel weights (effective weights if redistribution occurred)
- Generate radar chart data (one axis per dimension)
- Produce prioritized action items with effort estimates
- Include iteration delta if previous audit data exists

Wait for the synthesis agent to send its JSON via SendMessage. Parse for `SYNTHESIS_REPORT_START` and `SYNTHESIS_REPORT_END` delimiters. Extract the JSON between them and validate against the Synthesis Output Schema.

Timeout: 5 minutes. If timeout: attempt once more with simplified input (scores only, no full text). If second attempt also times out, ABORT and report error to user.

### Step 10: Calculate & Validate

After receiving synthesis output:

1. **Verify composite calculation**:
   - Per-agent composite: sum(criterion_score * criterion_weight)
   - Panel composite: sum(agent_composite * agent_weight)

2. **Map grade**: A+ (95-100), A (90-94), A- (85-89), B+ (80-84), B (75-79), B- (70-74), C+ (65-69), C (60-64), C- (55-59), D (50-54), F (<50)

3. **Map verdict**: STRONG_PASS (>=85), PASS (>=70), MARGINAL (>=55), FAIL (<55)

### Step 11: Write Output Files

Use real current timestamps (`date -u +%Y%m%d-%H%M%S` in Bash). The audit ID format is `audit-YYYYMMDD-HHmmss`.

1. **Write audit JSON** to `.boardclaude/audits/audit-{timestamp}.json` matching the Synthesis Output Schema.

2. **Write audit Markdown** to `.boardclaude/audits/audit-{timestamp}.md` with:
   - Summary header with composite score and grade
   - Per-agent cards with scores, strengths, weaknesses, verdict
   - Radar chart data
   - Prioritized action items
   - Iteration delta (if previous audit exists)

3. **Update `.boardclaude/state.json`**: Read current state, then update:
   - `audit_count`: increment
   - `latest_audit`: new audit ID
   - `latest_score`: composite score
   - `score_history`: append new score
   - `status`: "active"

4. **Append to `.boardclaude/timeline.json`**: Add audit event with type, branch, timestamp, scores, composite, label, parent reference.

5. **Update action items ledger** at `.boardclaude/action-items.json`:
   - If it doesn't exist, create from synthesis action_items
   - If it exists, merge new items (match by action text to avoid duplicates)
   - Items open for 3+ consecutive audits get flagged as `chronic`
   - Update stats counters

### Step 12: Report to User

Display results directly:

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

If any agents timed out, include: "Note: {N} agent(s) timed out ({names}). Weights were redistributed among reporting agents."

### Step 13: Teardown

1. Send shutdown requests to all judges and synthesis agent
2. Call `TeamDelete` to clean up the team

## Judge Prompt Template

Each judge receives a prompt structured as:

```
You are {agent_name}, evaluating the project at {project_root}.

{Full agent persona from agents/{name}.md}

## Project Summary
{Ingested codebase summary from Step 4}

## Your Evaluation Criteria
{criteria list with weights from panel config}

## Previous Audit Context
{Cross-iteration context from the 2 most recent audits, if any}

### Iteration Trend
- Score trajectory: {list of composite scores}
- Items resolved vs. introduced per iteration

## Instructions
- Evaluate the project against YOUR specific criteria
- Score each criterion 0-100
- Calculate your composite as weighted average of your criteria
- Cite specific files and line numbers
- Reference your previous scores and action items if available
- If previously-flagged issues were resolved, acknowledge explicitly in strengths
- Output your evaluation as structured JSON (schema below)
- Wrap your JSON in EVAL_REPORT_START / EVAL_REPORT_END delimiters
- Send via SendMessage EXACTLY ONCE — no partial results or status updates before the final report

## Output Schema
{Agent Evaluation Schema JSON}
```

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

## Error Handling

- **Overall timeout (15 min)**: If the entire audit exceeds 15 minutes wall clock, shut down all agents, report timeout to user with any partial context available, call TeamDelete.
- **Agent timeout (5 min)**: Record a null evaluation and add to `timed_out` list. Pass `timed_out_agents` to synthesis.
- **Minimum viable panel (4/6)**: If fewer than 4 agents report successfully, ABORT the audit. Report which agents timed out and which reported. Suggest re-running with `--effort low` for faster execution.
- **Partial results**: If any agents timed out, include a note in the user report: "Note: {N} agent(s) timed out ({names}). Weights were redistributed among reporting agents."
- **Malformed JSON**: If an agent sends `EVAL_REPORT_START/END` delimiters but the JSON between them is invalid, send a retry message with explicit format instructions. Allow one retry per agent.
- **Missing delimiters**: If an agent sends a message without `EVAL_REPORT_START/END` delimiters, attempt to extract JSON from the raw message. If successful, use it. If not, send a nudge requesting the delimited format.
- **Synthesis timeout (5 min)**: Attempt once more with simplified input (scores only, no full text). If second attempt fails, ABORT.
- **Missing `.boardclaude/`**: Create it silently via `mkdir -p`.
- **No panel config found**: Prompt the user to run `/bc:init` or specify a panel.
- **File safety**: Never overwrite previous audit files — always create new timestamped files.

## Personal Panel Mode

When the panel type is `personal`, add a deliberation phase:

1. **Round 1**: Independent assessment (same as professional)
2. **Round 2**: Cross-examination — each agent reads other agents' evaluations and responds
3. **Synthesis**: Produces verdict (SHIP / CONTINUE / PIVOT / PAUSE) plus single most important action

## Notes

- All codebase ingestion happens inside this skill runner (Step 4)
- No permission prompts appear — all spawned agents use `mode: "bypassPermissions"`
- Agent Teams use approximately 7x more tokens than standard sessions
- Use `--effort low` for quick baseline checks, `--effort max` for final audits
- Use real timestamps, never fabricated dates
- Write all files atomically (complete content, not incremental appends)

$ARGUMENTS
