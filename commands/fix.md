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

## Execution Steps

1. **Load latest audit**: Read most recent audit from `.boardclaude/audits/`

2. **Load action items ledger**: Read `.boardclaude/action-items.json`. If it doesn't exist, extract action items from the latest audit and create the ledger.

3. **Filter items**: Select items where priority <= P (if set) and status is "open". Sort by priority (ascending), then by iterations_open (descending, chronic items first). All effort levels are attempted.

4. **Run validation baseline**: Execute validation-runner to capture pre-fix state.

5. **Dependency analysis**: Extract `file_refs` from each item, build a conflict graph (items sharing file refs conflict), and partition into independent batches. Items with no file overlap can run in parallel.

6. **Execute batches**:
   - For batches with 2+ independent items: spawn parallel Fix Workers via Agent Teams, one worker per item. Each worker reads context, implements its fix, and runs a quick `tsc` check.
   - After all workers in a batch complete: run centralized validation (tsc + vitest + lint).
   - If batch validation passes: accept all fixes, update ledger.
   - If batch validation fails: revert entire batch, retry items one-by-one with per-item validation.
   - For single-item batches or `--serial` mode: implement fixes sequentially with per-item validation.
   - If `--dry-run`: show proposed changes and batch plan without applying.

7. **Re-audit** (only if `--audit` or `--loop` is set): Run `/bc:audit` to measure composite score delta.

8. **Reconcile ledger**: Mark items where score improved as "resolved". Increment iterations_open for items still open.

9. **Report**: Display summary -- items fixed, score delta, batch execution stats, items remaining.

## Safety

- Validates after each batch -- reverts entire batch if any metric regresses
- Conservative parallelism: items sharing ANY file ref are never run in parallel
- Batch integrity check: compares worker-reported files against `git diff --name-only`
- Graceful fallback: failed parallel batches are retried serially (no work lost)
- Never modifies files outside the project root
- Attempts all open items by default (use --max and --priority to limit scope)
- Shows cost estimate before proceeding

## Notes

- This command **always delegates** to an Agent Team — even for a single item
- The fix-implementer skill is a thin launcher: it loads data, filters items, then spawns a fix-lead orchestrator
- The fix-lead orchestrates fix-workers, runs centralized validation, handles retries, and updates the ledger
- `--serial` means workers run one-at-a-time (still delegated via team, not inline)
- `--dry-run` causes the lead to report its batch plan without spawning workers or modifying files
- Default behavior: fix all open items, validate (tsc + vitest + lint), report results, stop — no audit
- `--audit` opts in to a single re-audit after fixes for score delta measurement
- `--loop N` runs N autonomous iterations of (fix -> validate -> audit -> extract new items -> fix). Exits early on: no new items, score plateau (2 consecutive flat iterations), or all items blocked
- Items open for 3+ iterations are flagged as "chronic" and prioritized
- The action items ledger persists across sessions in `.boardclaude/action-items.json`
- Each item gets at most 2 attempts (batch + retry) before being marked as blocked

$ARGUMENTS
