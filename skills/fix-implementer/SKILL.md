---
name: fix-implementer
description: >
  Thin launcher for the fix pipeline. Loads audit data, filters action items,
  spawns a fix-lead team to orchestrate workers, and reports results.
  Triggers on "fix", "implement", "resolve", "address findings".
allowed-tools: Read, Bash, Glob, Grep, Task, TeamCreate, TeamDelete, SendMessage
context: fork
agent: general-purpose
---

# Fix Implementer — Launcher

## Overview

Thin launcher that loads audit data, filters actionable items, and delegates all implementation to a fix-lead orchestrator via Agent Teams. The launcher never modifies source files — it only reads data, creates a team, and relays results.

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
- Sort by priority ascending (most important first)
- Take at most N items where N comes from `--max` flag (if set; default: all matching items)

If zero items remain after filtering, report "No actionable items found" and stop.

### Step 4: Spawn Fix Team

1. **Create team**: `TeamCreate("fix-{timestamp}")` where timestamp is current epoch seconds.

2. **Spawn fix-lead** as a teammate via Task with:
   - `subagent_type`: `"general-purpose"`
   - `team_name`: the team name from TeamCreate
   - `name`: `"fix-lead"`
   - Lead prompt includes:
     - The full fix-lead agent instructions (from `agents/fix-lead.md`)
     - The filtered action items array as JSON
     - CLI flags: `--dry-run`, `--audit`, `--loop N`, `--serial`, `--max`
     - Safety rails summary from this skill

3. **Wait for the lead's completion message** (timeout: 10 minutes).
   - The lead sends a structured completion report via SendMessage.
   - If timeout: send shutdown to lead, report timeout to user, clean up team.

### Step 5: Report Results

Relay the lead's completion report to the user. Display:
```
Fix Implementer Report
----------------------
Items attempted: X of Y open
Items fixed:     N (resolved)
Items blocked:   M (reverted)

Execution mode: parallel|serial
Validation:      tsc ✓/✗ | vitest ✓/✗ | lint ✓/✗
Score delta:     A → B (+/-C)  [only if --audit or --loop was used]

Still open: R items
Next step:  Run /bc:audit for full re-evaluation or /bc:fix again
```

Then shutdown the team via SendMessage shutdown requests and TeamDelete.

## Error Handling

- **No audit found**: Abort with message — "No audit results found. Run `/bc:audit` first."
- **Empty action items**: Report "No actionable items found" and stop.
- **Lead timeout**: After 10 minutes, shutdown team, report partial results if available.
- **Lead reports all items blocked**: Relay the pattern — likely a systemic issue needing human intervention.
- **Team creation failure**: Report the error and suggest running `/bc:fix --serial` as fallback.

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
