# Error Handling Patterns — BoardClaude Implementation Guide

## What It Covers

BoardClaude runs 6 AI agents in parallel, any of which can timeout, hit rate limits, or exhaust context. This doc defines the five recovery patterns needed so an audit degrades gracefully instead of failing outright. Reference during M1-M3 implementation; not a formal spec.

## 1. Agent Timeout Handling

Opus at max effort can take minutes per evaluation. Without a timeout, a single slow agent blocks synthesis indefinitely.

**Timeout thresholds (per agent):**

| Model / Effort | Timeout |
|----------------|---------|
| Opus max       | 8 min   |
| Opus high      | 5 min   |
| Sonnet medium  | 3 min   |

**Recovery flow:**
1. Start a wall-clock timer when the agent subagent/team-member is invoked.
2. On timeout, capture whatever partial output exists (incomplete JSON, partial markdown).
3. Mark the agent result as `"status": "TIMED_OUT"` in the audit payload.
4. Do not retry automatically -- proceed to synthesis with available results.

**Synthesis behavior with timeouts:**
- Note in the report: "Agent X did not complete evaluation (timed out after Y min)."
- Redistribute that agent's weight proportionally across agents that did complete.
- If partial output exists and contains at least one scored criterion, include it with a `partial: true` flag but exclude it from composite score calculation.

## 2. API Quota / Rate Limit Recovery

Anthropic returns HTTP 429 when rate limits are hit. Running 6 agents in parallel increases the chance of hitting per-minute token limits.

**Backoff strategy:**
- Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s, cap at 30s.
- Jitter: add random 0-500ms to each wait to prevent thundering herd across agents.
- Max retries per agent: 3. After that, treat as a failure (same as timeout path).

**Priority queue on rate limit:**
When rate limited during a multi-agent audit, queue remaining agents by priority:

| Priority | Agent(s)          | Reason                                |
|----------|-------------------|---------------------------------------|
| 1        | Boris             | Highest weight (0.20), code quality   |
| 2        | Cat, Thariq, Lydia| Core evaluation criteria (0.18 each)  |
| 3        | Ado, Jason        | Supporting criteria (0.13 each)       |

Agents already in-flight continue. Queued agents start in priority order as capacity frees up.

**Budget tracking:**
- After each agent completes, log cumulative token usage and estimated cost.
- Define a budget checkpoint (configurable, default: no limit). If set and cumulative cost exceeds checkpoint, abort remaining agents and proceed to synthesis with what is available.
- Budget data goes into `audit.metadata.cost_tracking` in the output JSON.

## 3. Context Window Overflow Detection

The 1M token context window is large but not infinite. A full codebase scan + agent persona + audit history from multiple iterations can exceed it.

**Pre-invocation measurement:**
Before spawning each agent, estimate the input size:
- Codebase files selected for review (measure actual token count or approximate at 4 chars/token).
- Agent persona prompt (~2-5K tokens each).
- Panel config + evaluation criteria (~1-2K tokens).
- Previous audit results if iterative (~5-50K tokens depending on history depth).

**Reduction strategy (triggered when estimate > 800K tokens):**

| Step | Action                                            | Savings       |
|------|---------------------------------------------------|---------------|
| 1    | Drop audit history beyond last 2 iterations       | 10-40K tokens |
| 2    | Use targeted file sets instead of full codebase    | Variable      |
| 3    | Summarize previous findings instead of full JSON   | 20-30K tokens |
| 4    | Truncate large files to first 500 lines            | Variable      |

Apply steps in order until the estimate drops below 800K. If still over after all steps, log a warning and proceed -- the model will hit compaction but the audit will still run.

**Output annotation:**
When context was reduced, add `"context_reduced": true` and `"context_notes": "..."` to the agent result so synthesis knows the agent worked with limited information.

## 4. Partial Result Merging

The common case: 5 of 6 agents complete, one fails (timeout, rate limit, crash). Synthesis must still produce a useful report.

**Minimum viable audit:**

| Agents Completed | Action                                                        |
|------------------|---------------------------------------------------------------|
| 6/6              | Full synthesis, all weights as configured                     |
| 4-5/6            | Proceed with synthesis, redistribute missing weight           |
| 3/6              | Minimum threshold -- synthesis runs but flags as PARTIAL      |
| < 3/6            | Mark audit as INCOMPLETE, do not produce composite scores     |

**Weight redistribution formula:**
When agent X (weight W_x) is missing, redistribute proportionally:
```
adjusted_weight_i = original_weight_i / (1 - W_x)
```
For multiple missing agents, apply iteratively or compute:
```
adjusted_weight_i = original_weight_i / sum(weights of completing agents)
```

**Output flags:**
- `"evaluation_status": "complete" | "partial" | "incomplete"`
- `"missing_agents": ["agent-name", ...]`
- `"weight_adjustment": "proportional"` (or `"none"` if all agents completed)
- Each missing agent gets a placeholder entry in the results array with `"status": "FAILED"` or `"TIMED_OUT"` and the reason.

## 5. Synthesis Fallback

If the synthesis agent itself fails, we still need valid output that matches the expected schema.

**Mechanical aggregation fallback:**
1. Compute simple average of each criterion score across all completing agents (weighted by adjusted weights).
2. Collect all `strengths` arrays -- deduplicate, take top 5 by frequency.
3. Collect all `weaknesses` arrays -- deduplicate, take top 5 by frequency.
4. Skip: divergent opinion analysis, narrative summary, cross-agent debate synthesis.
5. Set `"synthesis_mode": "mechanical"` in output (vs. `"full"` for normal synthesis).

**Schema compatibility:**
The mechanical output uses the same JSON schema as full synthesis. Fields that require AI judgment are set to sensible defaults:
- `narrative_summary`: `"Mechanical aggregation -- full synthesis unavailable."`
- `divergent_opinions`: `[]`
- `recommended_actions`: Populated from highest-weighted weaknesses.
- `confidence`: Set to `0.5` (low confidence flag for mechanical mode).

**When mechanical is acceptable:**
- Intermediate iterations during development (not the final audit).
- Quick checks where speed matters more than depth.
- Never acceptable for final demo or submission audit -- retry full synthesis up to 2 times before falling back.

## Quick Reference: Error → Action Table

| Error                  | Detection              | Immediate Action           | Synthesis Impact               |
|------------------------|------------------------|----------------------------|--------------------------------|
| Agent timeout          | Wall-clock timer       | Capture partial, move on   | Redistribute weight            |
| 429 rate limit         | HTTP response code     | Backoff + retry (max 3)    | Queue by priority              |
| Context overflow       | Pre-invocation estimate| Reduce context in steps    | Note reduced context in output |
| Agent crash/unknown    | Process exit or error  | Log error, mark FAILED     | Same as timeout                |
| Synthesis failure      | Synthesis agent errors | Mechanical aggregation     | Flag `synthesis_mode`          |
| Budget exceeded        | Cost tracker           | Abort remaining agents     | Partial result merge           |
| < 3 agents complete    | Result count check     | Mark INCOMPLETE, suggest retry | No composite scores         |
