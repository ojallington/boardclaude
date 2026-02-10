# /bc:fix -- Implement Audit Action Items

Implement fixes from audit action items using parallel batch execution
and verify improvements through the validation-runner and re-audit pipeline.

## Usage

```
/bc:fix [--max N] [--priority P] [--dry-run] [--serial] [--no-reaudit]
```

## Parameters

- `$ARGUMENTS` -- Optional: max items, priority filter, dry-run mode, execution mode
- `--max N` -- Maximum items to attempt (default: 5)
- `--priority P` -- Only items with priority <= P (default: 3)
- `--dry-run` -- Show proposed fixes without applying
- `--serial` -- Force sequential execution (disable parallelization)
- `--no-reaudit` -- Skip the re-audit step after fixes (just fix and validate)

## Execution Steps

1. **Load latest audit**: Read most recent audit from `.boardclaude/audits/`

2. **Load action items ledger**: Read `.boardclaude/action-items.json`. If it doesn't exist, extract action items from the latest audit and create the ledger.

3. **Filter items**: Select items where priority <= P, effort is "low" or "medium", and status is "open". Sort by priority (ascending), then by iterations_open (descending, chronic items first).

4. **Run validation baseline**: Execute validation-runner to capture pre-fix state.

5. **Dependency analysis**: Extract `file_refs` from each item, build a conflict graph (items sharing file refs conflict), and partition into independent batches. Items with no file overlap can run in parallel.

6. **Execute batches**:
   - For batches with 2+ independent items: spawn parallel Fix Workers via Agent Teams, one worker per item. Each worker reads context, implements its fix, and runs a quick `tsc` check.
   - After all workers in a batch complete: run centralized validation (tsc + vitest + lint).
   - If batch validation passes: accept all fixes, update ledger.
   - If batch validation fails: revert entire batch, retry items one-by-one with per-item validation.
   - For single-item batches or `--serial` mode: implement fixes sequentially with per-item validation.
   - If `--dry-run`: show proposed changes and batch plan without applying.

7. **Re-audit** (unless `--no-reaudit`): Run `/bc:audit` to measure composite score delta.

8. **Reconcile ledger**: Mark items where score improved as "resolved". Increment iterations_open for items still open.

9. **Report**: Display summary -- items fixed, score delta, batch execution stats, items remaining.

## Safety

- Only attempts low and medium effort items (high-effort items require manual implementation)
- Validates after each batch -- reverts entire batch if any metric regresses
- Conservative parallelism: items sharing ANY file ref are never run in parallel
- Batch integrity check: compares worker-reported files against `git diff --name-only`
- Graceful fallback: failed parallel batches are retried serially (no work lost)
- Never modifies files outside the project root
- Maximum 5 items per run by default (configurable via --max)
- Shows cost estimate before proceeding

## Notes

- This command depends on the fix-implementer skill, validation-runner skill, and fix-worker agent
- Items open for 3+ iterations are flagged as "chronic" and prioritized
- Use `--dry-run` first to review proposed changes and the batch plan before applying
- Use `--serial` to disable parallelization (original sequential behavior)
- Use `--no-reaudit` to skip the re-audit step when you just want fixes applied and validated
- Parallel execution uses Agent Teams -- the same mechanism as `/bc:audit`
- The action items ledger persists across sessions in `.boardclaude/action-items.json`

$ARGUMENTS
