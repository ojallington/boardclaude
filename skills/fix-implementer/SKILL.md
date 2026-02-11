---
name: fix-implementer
description: >
  Implement fixes from audit action items using parallel batch execution.
  Analyzes file dependencies, batches independent fixes for parallel workers,
  validates each batch, and re-audits to measure improvement.
  Triggers on "fix", "implement", "resolve", "address findings".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task, TeamCreate, TeamDelete, SendMessage
context: fork
agent: general-purpose
---

# Fix Implementer — ultrathink

## Overview

Close the evaluate-fix-verify loop. Read prioritized action items from the latest audit, analyze file dependencies to identify independent batches, execute fixes in parallel via Agent Teams, validate each batch, and re-audit to measure score improvement. Falls back to serial execution when items conflict or parallelization is not beneficial.

## Safety Rails

**These constraints are non-negotiable:**

- **Effort cap**: Only attempt items with `effort: "low"` or `effort: "medium"`. Skip `"high"` — those need human planning.
- **Batch limit**: Maximum 5 items per run. Prevents runaway changes.
- **Validate after each batch**: Run centralized validation after each parallel batch completes. If validation regresses, revert the entire batch and retry items serially.
- **Scope lock**: Never modify files outside the project root directory.
- **Preview before apply**: Show the user a diff preview of proposed changes. Wait for confirmation unless running in auto mode.
- **Revert capability**: Track all changed files per worker. If a batch breaks something, restore all files in that batch.
- **No destructive operations**: Never delete files, drop data, or remove functionality. Fixes are additive or corrective only.
- **Conservative parallelism**: Items sharing ANY file ref are never executed in parallel. When in doubt, serialize.

## Prerequisites

Before running, verify:
- Latest audit exists: !`ls .boardclaude/audits/*.json 2>/dev/null | tail -1 || echo "NO AUDIT — run /bc:audit first"`
- Action items ledger: !`ls .boardclaude/action-items.json 2>/dev/null || echo "NO LEDGER — will create from audit"`
- Validation baseline: !`ls .boardclaude/validation/latest.json 2>/dev/null || echo "NO BASELINE — will run validation first"`
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

### Step 3: Run Validation Baseline

Run validation-runner to establish a pre-fix baseline:
- Save the current validation state for comparison after fixes
- Record baseline scores: type errors, test pass count, lint errors, format compliance

### Step 4: Filter to Actionable Items

- `priority <= 3` (top 3 priority levels only)
- `effort` is `"low"` or `"medium"`
- `status` is `"open"` (skip already resolved, blocked, or in-progress)
- Sort by priority ascending (most important first)
- Take at most 5 items (batch limit)

### Step 5: Dependency Analysis

Analyze file dependencies to partition items into independent batches:

1. **Extract file refs**: For each filtered item, collect its `file_refs` array.

2. **Infer missing refs**: Items with empty `file_refs` — scan the action text for file paths or component names, and attempt to infer likely files. If inference fails, place the item in a serial fallback batch.

3. **Build conflict graph**: Items sharing any file ref are connected (they conflict). Two items conflict if the intersection of their `file_refs` sets is non-empty.

4. **Partition into batches** via graph coloring:
   - Items with no conflicts to any other item form independent batches (can run in parallel).
   - Items that conflict with each other are placed in the same serial group.
   - A simple greedy approach: iterate items in priority order, assign each to the first batch where it has no conflicts. If no batch works, create a new batch.

5. **Serial fallback conditions** — skip teams and implement directly (original serial behavior) when:
   - Only 1 item total after filtering (a single item gains nothing from a team)
   - `--serial` flag is set
   - All items conflict with each other (single batch anyway)

6. **Log the batch plan**:
   ```
   Batch Plan:
     Batch 1 (parallel): ai-001 (layout.tsx), ai-003 (radar-chart.tsx), ai-005 (README.md)
     Batch 2 (parallel): ai-002 (types.ts), ai-004 (page.tsx)
     Serial fallback:    ai-006 (unknown files — inferred)
   ```

**Heuristic**: When in doubt, serialize. The cost of wasted parallelism is seconds; the cost of a file conflict is a full batch revert.

### Step 6: Execute Batches

For each batch:

#### Parallel Execution (batch has 2+ items with no file conflicts)

1. **Create Agent Team** using TeamCreate.

2. **Spawn one Fix Worker per item** using the Task tool with:
   - `subagent_type`: `"general-purpose"`
   - `team_name`: the team name from TeamCreate
   - `name`: `"fix-worker-{item.id}"` (e.g., `fix-worker-ai-001`)
   - Worker prompt includes:
     - The full Fix Worker instructions (from `agents/fix-worker.md`)
     - The specific action item: id, action, priority, effort, file_refs, source_agents, impact
     - The source agent's finding text from the audit (for context on why this was flagged)
     - Validation baseline summary (so the worker knows what metrics to protect)

3. **Wait for all workers** to complete or timeout:
   - Workers independently: read context files, implement fix, run quick `npx tsc --noEmit`, report back
   - Each worker reports: `files_changed`, `summary`, `local_validation` (pass/fail), `notes`

4. **Run centralized validation** (tsc + vitest + lint):
   - If validation passes: accept batch, update ledger items to `in_progress`, record fix attempts
   - If validation fails: revert entire batch (`git checkout -- <all files from all workers>`), then retry each item serially with per-item validation (fallback to original serial behavior for this batch only)

5. **Batch integrity check**: Compare workers' reported `files_changed` against `git diff --name-only`. If any worker modified files outside its reported set, or if two workers touched the same file (safety net), revert the batch and retry serially.

6. **Shutdown the team** via SendMessage shutdown requests to all workers.

#### Serial Execution (single item, or fallback)

For batches with 1 item, or when retrying after a parallel batch failure:

a. **Read context**: Load the file(s) referenced in the action item. Understand the surrounding code. Read the source agent's full finding for context.

b. **Plan the fix**: Determine what changes are needed. For each change:
   - Identify the exact file and location
   - Draft the change (Edit for modifications, Write for new content)
   - Assess risk: does this touch shared code? Could it break other things?

c. **Preview changes**: Show the user a summary:
   ```
   Fix #1: Add error boundary to dashboard layout
   File: src/app/dashboard/layout.tsx (line 15-30)
   Change: Wrap children in ErrorBoundary component
   Risk: Low — additive change, no existing behavior modified
   ```
   In auto mode (user pre-approved), skip preview and proceed.

d. **Apply the fix**: Use Edit for targeted changes, Write for new files. Keep changes minimal — fix exactly what was flagged, nothing more.

e. **Validate the fix**: Run validation-runner immediately after applying:
   - If type errors increased: REVERT and mark item as `"blocked"` with reason
   - If tests regressed (fewer passing): REVERT and mark as `"blocked"`
   - If lint errors increased: REVERT and mark as `"blocked"`
   - If validation is stable or improved: mark item as `"in_progress"`

f. **Record the attempt** in the ledger:
   ```json
   {
     "fix_attempts": [
       {
         "timestamp": "<ISO 8601>",
         "files_changed": ["src/app/dashboard/layout.tsx"],
         "validation_result": "pass",
         "reverted": false,
         "execution_mode": "serial"
       }
     ]
   }
   ```

### Step 7: Re-audit

After all batches processed, run a full re-audit (unless `--no-reaudit` flag is set):
- Execute `/bc:audit` (or the audit-runner skill) to get new scores
- Compare new composite score against the pre-fix baseline
- If `--no-reaudit` is set: skip this step, report fixes applied without score delta

### Step 8: Reconcile Ledger

Update the ledger based on audit results:
- Items where the relevant agent's score improved: mark `status: "resolved"`
- Items where the score did not change: keep `status: "in_progress"` (fix applied but no measurable impact yet)
- Items that were reverted: already marked `"blocked"`
- If re-audit was skipped: keep all successful items as `"in_progress"`

### Step 9: Report Results

Display summary to the user:
```
Fix Implementer Report
----------------------
Items attempted: 4 of 12 open
Items fixed:     3 (resolved)
Items blocked:   1 (reverted — type regression)
Items skipped:   8 (high effort or low priority)

Execution:
  Parallel batches: 2 (3 items + 1 item)
  Serial fallback:  1 item (retried after batch failure)

Score delta:     72.4 → 76.1 (+3.7)
Grade:           B- → B

Validation delta:
  Type errors:   12 → 9 (-3)
  Tests passing: 45/47 → 47/47 (+2)
  Lint errors:   1 → 0 (-1)

Still open: 9 items (4 low/medium, 5 high effort)
Next step:  Run /bc:audit for full re-evaluation or fix again for next batch
```

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

## Error Handling

- **No audit found**: Abort with message — "No audit results found. Run `/bc:audit` first to generate action items."
- **Empty action items**: Report "No actionable items found" — either all are resolved or all are high-effort.
- **File not found**: If a referenced file does not exist (deleted or moved), mark item as `"blocked"` with reason "File not found" and continue to next item.
- **Validation runner fails**: If validation-runner itself errors out (not the same as finding errors), abort the current fix, mark as `"blocked"`, and continue.
- **Git dirty state**: Warn the user but do not abort. Recommend committing first so reverts are clean.
- **All items blocked**: If every attempted item gets reverted, report the pattern — likely a systemic issue that needs human intervention.
- **Merge conflicts**: If editing a file that has been modified since the audit, re-read the file and adapt. If the relevant code has moved or been deleted, mark as `"blocked"`.
- **Worker timeout**: If a Fix Worker does not complete within 3 minutes, revert that worker's files (`git checkout -- <worker's file_refs>`), mark the item as `"blocked"` with reason "Worker timeout", and continue with remaining workers.
- **Worker reports `cannot_fix`**: Mark the item as `"blocked"` with the worker's explanation. No revert needed (worker should not have modified files).
- **Multiple workers modify same file**: Safety net — if `git diff --name-only` reveals overlapping files between workers despite the conflict graph, revert the entire batch and retry all items serially.
- **Batch integrity mismatch**: If workers' reported `files_changed` do not match `git diff --name-only`, revert the batch and retry serially. Log the discrepancy for investigation.
