# /bc:fix -- Implement Audit Action Items

Implement fixes from audit action items using parallel batch execution
and verify improvements through the validation-runner and re-audit pipeline.

## Usage

```
/bc:fix [--max N] [--priority P] [--dry-run] [--serial] [--audit] [--loop N]
```

## Parameters

- `$ARGUMENTS` -- Optional: max items, priority filter, dry-run mode, execution mode
- `--max N` -- Maximum items to attempt (default: all open items)
- `--priority P` -- Only items with priority <= P (default: all priorities)
- `--dry-run` -- Show proposed fixes without applying
- `--serial` -- Force sequential execution (disable parallelization)
- `--audit` -- Run a re-audit after fixes to measure score delta (off by default)
- `--loop N` -- Run N autonomous fix-validate-audit cycles (implies --audit)

## Architecture: Two-Tier Delegation

The fix pipeline uses a two-tier delegation model to keep the main agent lightweight:

```
MAIN AGENT (delegate launcher, ~6-8 tool calls)
  |
  v
FIX-LEAD (autonomous, bypassPermissions)
  |
  +---> FIX-WORKERS (autonomous, bypassPermissions, parallel or serial)
```

- **Main agent**: Reads audit data + ledger, filters items, creates team, spawns fix-lead, relays results. Never reads source files, never edits code, never runs validation.
- **Fix-lead**: Orchestrates fix-workers, runs centralized validation, handles batch retries, updates the ledger.
- **Fix-workers**: Each implements a single action item, runs a quick `tsc` check, reports back to the lead.

All spawned agents use `mode: "bypassPermissions"` — no permission prompts appear.

## Main Agent Constraints

The main agent NEVER:
- Reads source code files (only `.boardclaude/` data files)
- Runs `tsc`, `vitest`, `eslint`, or any validation command
- Calls Edit, Write, Glob, or Grep on project source files
- Spawns fix-workers directly (only the fix-lead does this)
- Implements fixes or modifies any code

The main agent ONLY:
- Reads `.boardclaude/state.json`, audit JSONs, and `action-items.json`
- Reads `agents/fix-lead.md` for the lead's instructions
- Creates a team (TeamCreate)
- Spawns exactly 1 teammate: the fix-lead (Task)
- Waits for the lead's `FIX_LEAD_REPORT_START/END` completion message
- Relays results to the user
- Tears down the team (SendMessage shutdown + TeamDelete)

## Execution Steps

1. **Load latest audit**: Read `.boardclaude/state.json` to find `latest_audit`, then read the corresponding audit JSON from `.boardclaude/audits/`.

2. **Load action items ledger**: Read `.boardclaude/action-items.json`. If it doesn't exist, extract action items from the latest audit (this is metadata, not source code).

3. **Filter items**: Select items where `status == "open"`, `priority <= P` (if set). Sort by priority ascending, then by `iterations_open` descending (chronic items first). Take at most N items (if `--max` set). If zero items remain, report "No actionable items found" and stop.

4. **Create team**: `TeamCreate("fix-{timestamp}")` where timestamp is current epoch seconds.

5. **Spawn fix-lead**: Launch the fix-lead as an autonomous teammate via Task with `mode: "bypassPermissions"`. Pass it:
   - Full `agents/fix-lead.md` instructions
   - The filtered action items array as JSON
   - CLI flags: `--dry-run`, `--audit`, `--loop N`, `--serial`, `--max`
   - Safety rails summary

   The fix-lead then autonomously:
   - Runs validation baseline (`tsc` + `vitest` + `lint`)
   - Performs dependency analysis (builds conflict graph from `file_refs`)
   - Partitions items into independent batches
   - Spawns fix-workers (all with `mode: "bypassPermissions"`, parallel or serial per flags)
   - Runs centralized batch validation after each batch
   - Reverts failed batches and retries items serially
   - Updates the action items ledger (`.boardclaude/action-items.json`)
   - Optionally runs re-audit if `--audit` or `--loop` was specified
   - Sends structured completion report via SendMessage wrapped in `FIX_LEAD_REPORT_START/FIX_LEAD_REPORT_END`

6. **Wait for completion**: The main agent idles until the fix-lead reports via `FIX_LEAD_REPORT_START/FIX_LEAD_REPORT_END` delimiters. Timeout: 10 minutes. If timeout: send shutdown to lead, report timeout to user, clean up team.

7. **Collect results**: Parse the lead's delimited `FIX_LEAD_REPORT_START/END` block to extract items_attempted, items_fixed, items_blocked, validation results, and score delta.

8. **Display results**: Show the summary to the user:
   ```
   Fix Report
   ----------
   Items attempted: X of Y open
   Items fixed:     N (resolved)
   Items blocked:   M (reverted)

   Execution mode: parallel|serial
   Validation:      tsc ✓/✗ | vitest ✓/✗ | lint ✓/✗
   Score delta:     A → B (+/-C)  [only if --audit or --loop was used]

   Still open: R items
   Next step:  Run /bc:audit for full re-evaluation or /bc:fix again
   ```

9. **Teardown**: Send shutdown requests to fix-lead, then `TeamDelete`.

## Completion Report Schema

The fix-lead sends results wrapped in delimiters:

```
FIX_LEAD_REPORT_START
{
  "items_attempted": 5,
  "items_fixed": 3,
  "items_blocked": 1,
  "items_skipped": 1,
  "execution_mode": "parallel",
  "validation": { "tsc": true, "vitest": true, "lint": true },
  "score_delta": { "before": 72, "after": 78, "delta": 6 },
  "fixed_items": ["ai-001", "ai-003", "ai-005"],
  "blocked_items": [{ "id": "ai-002", "reason": "caused test regression" }],
  "still_open": 4
}
FIX_LEAD_REPORT_END
```

## Safety

- Validates after each batch — reverts entire batch if any metric regresses
- Conservative parallelism: items sharing ANY file ref are never run in parallel
- Batch integrity check: compares worker-reported files against `git diff --name-only`
- Graceful fallback: failed parallel batches are retried serially (no work lost)
- Never modifies files outside the project root
- Each item gets at most 2 attempts (batch + retry) before being marked blocked
- Shows cost estimate before proceeding

## Notes

- The main agent stays lightweight (~6-8 tool calls, minimal context usage)
- All source code reading, editing, and validation happens inside the fix-lead and its workers
- No permission prompts — all spawned agents use `mode: "bypassPermissions"`
- `--serial` means workers run one-at-a-time (still delegated via team, not inline)
- `--dry-run` causes the lead to report its batch plan without spawning workers or modifying files
- Default behavior: fix all open items, validate, report results, stop — no audit
- `--audit` opts in to a single re-audit after fixes for score delta measurement
- `--loop N` runs N autonomous iterations of (fix -> validate -> audit -> extract new items -> fix). Exits early on: no new items, score plateau (2 consecutive flat), or all items blocked
- Items open for 3+ iterations are flagged as "chronic" and prioritized

$ARGUMENTS
