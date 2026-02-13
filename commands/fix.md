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

## Architecture: Single-Tier Orchestration

The fix pipeline uses a single-tier orchestration model where the skill runner directly manages all workers:

```
SKILL RUNNER (full orchestrator)
  |
  +---> FIX-WORKERS (team members, bypassPermissions, parallel or serial)
```

- **Skill runner**: Reads audit data, filters items, runs validation baseline, performs dependency analysis, spawns fix-workers directly, validates batches, retries failures, updates ledger, displays results.
- **Fix-workers**: Each implements a single action item, runs a quick `tsc` check, reports back to skill runner via SendMessage.

All spawned workers use `mode: "bypassPermissions"` and `team_name` — they are proper team members that can communicate via SendMessage.

## Execution Steps

1. **Load latest audit**: Read `.boardclaude/state.json` to find `latest_audit`, then read the corresponding audit JSON from `.boardclaude/audits/`.

2. **Load action items ledger**: Read `.boardclaude/action-items.json`. If it doesn't exist, extract action items from the latest audit.

3. **Filter items**: Select items where `status == "open"`, `priority <= P` (if set). Sort by priority ascending, then by `iterations_open` descending (chronic items first). Take at most N items (if `--max` set). If zero items remain, report "No actionable items found" and stop.

4. **Create team**: `TeamCreate("fix-{timestamp}")` where timestamp is current epoch seconds.

5. **Run validation baseline**: Capture pre-fix state (tsc, vitest, lint error counts).

6. **Dependency analysis & batch plan**: Build conflict graph from `file_refs`, partition into independent batches via greedy graph coloring. If `--dry-run`: display plan and stop. If `--serial`: single serial queue.

7. **Execute batches**: For each batch, spawn fix-workers directly as team members. Wait for `FIX_REPORT_START/FIX_REPORT_END` reports. Run centralized validation after each batch. Revert and retry on failure.

8. **Retry queue**: Failed parallel items get one serial retry. Two-attempt maximum per item.

9. **Re-audit (optional)**: Only if `--audit` or `--loop N` was specified. Run `/bc:audit` to measure score delta.

10. **Update ledger**: Mark items as resolved, in_progress, or blocked in `.boardclaude/action-items.json`.

11. **Display results**: Show items attempted/fixed/blocked, validation status, score delta, and next steps.

12. **Teardown**: Shutdown all workers + TeamDelete.

## Completion Report Format

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

## Safety

- Validates after each batch — reverts entire batch if any metric regresses
- Conservative parallelism: items sharing ANY file ref are never run in parallel
- Batch integrity check: compares worker-reported files against `git diff --name-only`
- Graceful fallback: failed parallel batches are retried serially (no work lost)
- Never modifies files outside the project root
- Each item gets at most 2 attempts (batch + retry) before being marked blocked
- Shows cost estimate before proceeding

## Notes

- All validation, dependency analysis, and batch orchestration happens inside the skill runner
- All source code editing happens inside fix-workers (skill runner never edits source directly)
- No permission prompts — all spawned agents use `mode: "bypassPermissions"`
- `--serial` means workers run one-at-a-time (still delegated via team, not inline)
- `--dry-run` causes the runner to report its batch plan without spawning workers or modifying files
- Default behavior: fix all open items, validate, report results, stop — no audit
- `--audit` opts in to a single re-audit after fixes for score delta measurement
- `--loop N` runs N autonomous iterations of (fix -> validate -> audit -> extract new items -> fix). Exits early on: no new items, score plateau (2 consecutive flat), or all items blocked
- Items open for 3+ iterations are flagged as "chronic" and prioritized

$ARGUMENTS
