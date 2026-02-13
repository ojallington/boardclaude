---
name: fix-implementer
description: >
  Full orchestrator for the fix pipeline. Loads audit data, filters action items,
  runs validation baseline, spawns fix-workers directly as team members, validates
  batches, retries failures, updates the ledger, and reports results.
  Triggers on "fix", "implement", "resolve", "address findings".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task, TeamCreate, TeamDelete, SendMessage
context: fork
agent: general-purpose
---

# Fix Implementer — Single-Tier Orchestrator

## Overview

Full orchestrator that loads audit data, filters actionable items, runs validation baseline, spawns fix-workers directly as team members, validates batches, retries failures, updates the ledger, and reports results to the user. All orchestration happens in this skill runner — no fix-lead middleman.

## Safety Rails

**These constraints are non-negotiable:**

- **Scope lock**: Never modify files outside the project root directory.
- **No destructive operations**: Never delete files, drop data, or remove functionality.
- **Conservative parallelism**: Items sharing ANY file ref are never executed in parallel.
- **Two-attempt limit**: Each item gets at most 2 attempts (batch + retry) before being marked blocked.

## Prerequisites

Before running, verify:
- Latest audit exists: !`ls .boardclaude/audits/*.json 2>/dev/null | tail -1 || echo "NO AUDIT — run /bc:audit first"`
- Action items ledger: !`ls .boardclaude/action-items.json 2>/dev/null || echo "NO LEDGER — will create from audit"`
- Git status clean: !`git status --porcelain 2>/dev/null | head -5 || echo "Not a git repo or dirty working tree"`

## Steps

### Step 1: Load Latest Audit

Load from `.boardclaude/audits/`:
- Read `.boardclaude/state.json` to find `latest_audit` identifier
- Load the corresponding audit JSON file
- Extract `action_items` array from the audit

### Step 2: Load or Create Action Items Ledger

At `.boardclaude/action-items.json`:
- If ledger exists, read it and merge with latest audit action items (new items get `status: "open"`)
- If ledger does not exist, create it from the audit's action items
- Each item in the ledger tracks: id, action, source_agent, priority, effort, status, file_refs, fix_attempts

### Step 3: Filter to Actionable Items

- `priority <= P` where P comes from `--priority` flag (if set; default: no limit)
- All effort levels are attempted (`"low"`, `"medium"`, and `"high"`)
- `status` is `"open"` (skip already resolved, blocked, or in-progress)
- Sort by priority ascending (most important first), then by `iterations_open` descending (chronic items first)
- Take at most N items where N comes from `--max` flag (if set; default: all matching items)

If zero items remain after filtering, report "No actionable items found" and stop.

### Step 4: Create Team

Create a team for this fix run:

```
TeamCreate("fix-{timestamp}")
```

Use current epoch seconds for the timestamp.

### Step 5: Validation Baseline

Run validation to capture the pre-fix state:

```bash
cd dashboard && npx tsc --noEmit 2>&1 | tail -5; echo "EXIT:$?"
npx vitest run --reporter=verbose 2>&1 | tail -10; echo "EXIT:$?"
npx next lint 2>&1 | tail -5; echo "EXIT:$?"
```

Record baseline counts: type errors, test pass/fail, lint errors.

### Step 6: Dependency Analysis & Batch Plan

Analyze file dependencies to partition items into independent batches:

1. **Extract file refs**: For each item, collect its `file_refs` array.

2. **Infer missing refs**: Items with empty `file_refs` — scan the action text for file paths or component names. If inference fails, place in a serial fallback batch.

3. **Build conflict graph**: Items sharing any file ref are connected. Two items conflict if the intersection of their `file_refs` sets is non-empty.

4. **Partition into batches** via greedy graph coloring:
   - Iterate items in priority order.
   - Assign each to the first batch where it has no conflicts.
   - If no batch works, create a new batch.

5. **Log the batch plan**:
   ```
   Batch Plan:
     Batch 1 (parallel): ai-001 (layout.tsx), ai-003 (radar-chart.tsx)
     Batch 2 (parallel): ai-002 (types.ts), ai-004 (page.tsx)
     Serial fallback:    ai-006 (unknown files)
   ```

If `--dry-run` is set: display the batch plan to the user and stop. Do not spawn workers or modify any files.

If `--serial` is set: place all items in a single serial queue (one at a time).

### Step 7: Execute Batches

For each batch:

#### Parallel Execution (batch has 2+ independent items)

1. **Spawn one fix-worker per item** using Task with:
   - `subagent_type`: `"general-purpose"`
   - `team_name`: current team name (CRITICAL: makes them team members)
   - `name`: `"fix-worker-{item.id}"`
   - `mode`: `"bypassPermissions"`
   - Worker prompt includes:
     - The full fix-worker agent instructions (from `agents/fix-worker.md`)
     - The specific action item (id, action, priority, effort, file_refs, source_agents, impact)
     - Source agent's finding text
     - Validation baseline summary

2. **Wait for all workers** to report or timeout (3 minutes per worker).
   - Each worker sends a structured `FIX_REPORT_START/FIX_REPORT_END` via SendMessage.
   - If a worker times out: revert that worker's `file_refs` via `git checkout -- <files>`, mark item as `blocked` with reason "Worker timeout".

3. **Run centralized validation** (tsc + vitest + lint):
   - If validation passes: accept batch, continue to next batch.
   - If validation fails: revert entire batch via `git checkout -- <all changed files>`, add all items from this batch to the retry queue.

4. **Batch integrity check**: Compare workers' reported `files_changed` against `git diff --name-only`. If mismatch or overlap, revert batch and add items to retry queue.

5. **Shutdown completed workers** via SendMessage shutdown requests.

#### Serial Execution (single item, retry, or `--serial` mode)

For each item:

1. Spawn a single fix-worker (same as above, one item).
2. Wait for the worker's report (3-minute timeout).
3. Run centralized validation.
4. If validation passes: accept the fix.
5. If validation fails: revert via `git checkout -- <files>`, mark item as `blocked`.
6. Shutdown the worker.

### Step 8: Retry Queue

Items that failed in a parallel batch get one more attempt serially:

- Each item gets **at most 2 attempts**: once in its batch, once in retry.
- An item that fails both -> `blocked`.
- Process retry items one at a time with per-item validation.

**Termination condition**: All items are either accepted or blocked. No unbounded loops.

### Step 9: Re-audit (Optional — only if `--audit` or `--loop` is set)

By default, **skip this phase entirely**. Only run a re-audit if the caller explicitly passed `--audit` or `--loop N`.

If `--audit` is set (single re-audit):
- Run the audit skill to get new scores.
- Compare new composite score against the pre-fix baseline.
- Record the score delta.

If `--loop N` is set (autonomous fix-validate-audit cycles):
- This is the start of an iteration loop. After the re-audit:
  1. Extract new action items from the audit. Merge into the ledger (new items get `status: "open"`).
  2. Check termination conditions:
     - **Max iterations reached**: Current iteration >= N -> exit.
     - **No new items**: Audit produced no new actionable items -> exit.
     - **Score plateau**: Composite score unchanged for 2 consecutive iterations -> exit.
     - **All blocked**: All remaining items are blocked -> exit.
  3. If none met: go back to Step 6 (re-plan batches from newly open items) and repeat.
- Report cumulative results across all iterations when the loop terminates.

### Step 10: Update Ledger

Read `.boardclaude/action-items.json` and update:

- Items where validation passed and (if `--audit` or `--loop` was used) the relevant agent's score improved: set `status: "resolved"`, set `resolved_at` to current ISO timestamp.
- Items where fix was applied but no re-audit was run: set `status: "in_progress"` (validation passed but score delta unknown).
- Items that were reverted: set `status: "blocked"`, set `blocked_reason`.
- Record `fix_attempts` on each item:
  ```json
  {
    "timestamp": "<ISO 8601>",
    "files_changed": ["src/foo.ts"],
    "validation_result": "pass|fail",
    "reverted": false,
    "execution_mode": "parallel|serial|retry"
  }
  ```
- Update `stats` counters.
- Write the updated ledger back to `.boardclaude/action-items.json`.

### Step 11: Report to User

Display results directly:

```
Fix Report
----------
Items attempted: X of Y open
Items fixed:     N (resolved)
Items blocked:   M (reverted)

Execution mode: parallel|serial|mixed
Validation:      tsc ✓/✗ | vitest ✓/✗ | lint ✓/✗
Score delta:     A → B (+/-C)  [only if --audit or --loop was used]

Still open: R items
Next step:  Run /bc:audit for full re-evaluation or /bc:fix again
```

### Step 12: Teardown

1. Send shutdown requests to all fix-workers still alive
2. Call `TeamDelete` to clean up the team

## Error Handling

- **No audit found**: Abort with message — "No audit results found. Run `/bc:audit` first."
- **Empty action items**: Report "No actionable items found" and stop.
- **Worker timeout (3 min)**: Revert worker's file_refs, mark item as blocked, continue.
- **Worker reports `cannot_fix`**: Mark item as blocked with explanation. No revert needed.
- **Validation runner fails**: Mark current item(s) as blocked, continue to next batch.
- **File not found**: If a referenced file doesn't exist, mark item as blocked.
- **All items blocked**: Report the pattern — likely a systemic issue needing human intervention.
- **Git dirty state**: Warn but continue. Reverts may be incomplete.
- **Team creation failure**: Report the error and suggest running `/bc:fix --serial` as fallback.
- **Overall timeout (10 min)**: Shutdown all workers, report partial results, TeamDelete.

## Action Items Ledger Schema

Stored at `.boardclaude/action-items.json`:

```json
{
  "audit_id": "audit-{timestamp}",
  "created": "<ISO 8601>",
  "updated": "<ISO 8601>",
  "items": [
    {
      "id": "ai-001",
      "action": "Add error boundary to dashboard layout",
      "source_agent": "boris",
      "priority": 1,
      "effort": "low",
      "status": "open",
      "file_refs": ["src/app/dashboard/layout.tsx"],
      "impact": "Prevents white screen crashes, +2-3 points architecture",
      "fix_attempts": [],
      "resolved_at": null,
      "blocked_reason": null
    }
  ],
  "stats": {
    "total": 12,
    "open": 9,
    "in_progress": 0,
    "resolved": 3,
    "blocked": 0
  }
}
```

### Status Values

| Status | Meaning |
|--------|---------|
| `open` | Not yet attempted |
| `in_progress` | Fix applied, awaiting audit confirmation |
| `resolved` | Fix applied and audit score improved |
| `blocked` | Fix attempted but caused regression — reverted |
| `deferred` | Manually marked to skip (user decision) |
| `wont_fix` | Decision made not to address this item |
| `chronic` | Failed 3+ iterations — needs investigation or architectural change |

## Notes

- All validation, dependency analysis, and batch orchestration happens in this skill runner
- All source code editing happens inside fix-workers (this runner never edits source files directly)
- No permission prompts — all spawned agents use `mode: "bypassPermissions"`
- `--serial` means workers run one-at-a-time (still delegated via team, not inline)
- `--dry-run` causes the runner to report its batch plan without spawning workers or modifying files
- Default behavior: fix all open items, validate, report results, stop — no audit
- `--audit` opts in to a single re-audit after fixes for score delta measurement
- `--loop N` runs N autonomous iterations of (fix -> validate -> audit -> extract new items -> fix). Exits early on: no new items, score plateau (2 consecutive flat), or all items blocked
- Items open for 3+ iterations are flagged as "chronic" and prioritized

$ARGUMENTS
