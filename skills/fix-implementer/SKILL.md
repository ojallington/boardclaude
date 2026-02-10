---
name: fix-implementer
description: >
  Implement fixes from audit action items. Reads latest audit findings,
  attempts low/medium effort fixes, validates each fix, then re-audits.
  Triggers on "fix", "implement", "resolve", "address findings".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
context: fork
agent: general-purpose
---

# Fix Implementer — ultrathink

## Overview

Close the evaluate-fix-verify loop. Read prioritized action items from the latest audit, implement fixes for low and medium effort items, validate each fix in isolation, and re-audit to measure score improvement. Every change is validated before it sticks.

## Safety Rails

**These constraints are non-negotiable:**

- **Effort cap**: Only attempt items with `effort: "low"` or `effort: "medium"`. Skip `"high"` — those need human planning.
- **Batch limit**: Maximum 5 items per run. Prevents runaway changes.
- **Validate after each fix**: Run validation-runner after every change. If validation regresses, revert immediately.
- **Scope lock**: Never modify files outside the project root directory.
- **Preview before apply**: Show the user a diff preview of proposed changes. Wait for confirmation unless running in auto mode.
- **Revert capability**: Track all changed files. If a fix breaks something, restore the original content.
- **No destructive operations**: Never delete files, drop data, or remove functionality. Fixes are additive or corrective only.

## Prerequisites

Before running, verify:
- Latest audit exists: !`ls .boardclaude/audits/*.json 2>/dev/null | tail -1 || echo "NO AUDIT — run /bc:audit first"`
- Action items ledger: !`ls .boardclaude/action-items.json 2>/dev/null || echo "NO LEDGER — will create from audit"`
- Validation baseline: !`ls .boardclaude/validation/latest.json 2>/dev/null || echo "NO BASELINE — will run validation first"`
- Git status clean: !`git status --porcelain 2>/dev/null | head -5 || echo "Not a git repo or dirty working tree"`

## Steps

1. **Load latest audit** from `.boardclaude/audits/`:
   - Read `.boardclaude/state.json` to find `latest_audit` identifier
   - Load the corresponding audit JSON file
   - Extract `action_items` array from the audit

2. **Load or create action items ledger** at `.boardclaude/action-items.json`:
   - If ledger exists, read it and merge with latest audit action items (new items get `status: "open"`)
   - If ledger does not exist, create it from the audit's action items
   - Each item in the ledger tracks: id, action, source_agent, priority, effort, status, file_refs, fix_attempts

3. **Run validation-runner** to establish a pre-fix baseline:
   - Save the current validation state for comparison after fixes
   - Record baseline scores: type errors, test pass count, lint errors, format compliance

4. **Filter to actionable items**:
   - `priority <= 3` (top 3 priority levels only)
   - `effort` is `"low"` or `"medium"`
   - `status` is `"open"` (skip already resolved, blocked, or in-progress)
   - Sort by priority ascending (most important first)
   - Take at most 5 items (batch limit)

5. **For each item (sequentially — not parallel)**:

   a. **Read context**: Load the file(s) referenced in the action item. Understand the surrounding code. Read the source agent's full finding for context on why this was flagged.

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
            "reverted": false
          }
        ]
      }
      ```

6. **After all items processed**, run a full re-audit:
   - Execute `/bc:audit` (or the audit-runner skill) to get new scores
   - Compare new composite score against the pre-fix baseline

7. **Update the ledger** based on audit results:
   - Items where the relevant agent's score improved: mark `status: "resolved"`
   - Items where the score did not change: keep `status: "in_progress"` (fix applied but no measurable impact yet)
   - Items that were reverted: already marked `"blocked"`

8. **Report results** to the user:
   ```
   Fix Implementer Report
   ----------------------
   Items attempted: 4 of 12 open
   Items fixed:     3 (resolved)
   Items blocked:   1 (reverted — type regression)
   Items skipped:   8 (high effort or low priority)

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
