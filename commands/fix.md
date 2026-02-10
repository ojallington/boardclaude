# /bc:fix -- Implement Audit Action Items

Implement fixes from audit action items and verify improvements through
the validation-runner and re-audit pipeline.

## Usage

```
/bc:fix [--max N] [--priority P] [--dry-run]
```

## Parameters

- `$ARGUMENTS` -- Optional: max items, priority filter, dry-run mode
- `--max N` -- Maximum items to attempt (default: 5)
- `--priority P` -- Only items with priority <= P (default: 3)
- `--dry-run` -- Show proposed fixes without applying

## Execution Steps

1. **Load latest audit**: Read most recent audit from `.boardclaude/audits/`

2. **Load action items ledger**: Read `.boardclaude/action-items.json`. If it doesn't exist, extract action items from the latest audit and create the ledger.

3. **Filter items**: Select items where priority <= P, effort is "low" or "medium", and status is "open". Sort by priority (ascending), then by iterations_open (descending, chronic items first).

4. **Run validation baseline**: Execute validation-runner to capture pre-fix state.

5. **For each item** (up to N, sequentially):
   a. Read referenced files and understand the context
   b. If --dry-run: show proposed changes and skip to next item
   c. Implement the fix using Edit/Write tools
   d. Run validation-runner to verify the fix
   e. If validation passes: update ledger (status: "in_progress"), stage changes
   f. If validation fails: revert changes, update ledger (status: "blocked"), log reason

6. **Re-audit**: Run `/bc:audit` to measure composite score delta

7. **Reconcile ledger**: Mark items where score improved as "resolved". Increment iterations_open for items still open.

8. **Report**: Display summary -- items fixed, score delta, items remaining, cost estimate

## Safety

- Only attempts low and medium effort items (high-effort items require manual implementation)
- Validates after each fix -- reverts if any metric regresses
- Never modifies files outside the project root
- Maximum 5 items per run by default (configurable via --max)
- Shows cost estimate before proceeding

## Notes

- This command depends on the fix-implementer skill and validation-runner skill
- Items open for 3+ iterations are flagged as "chronic" and prioritized
- Use --dry-run first to review proposed changes before applying
- The action items ledger persists across sessions in `.boardclaude/action-items.json`

$ARGUMENTS
