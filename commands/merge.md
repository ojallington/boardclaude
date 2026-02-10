# /bc:merge -- Integrate Winning Strategy Branch

Merge a strategy branch into the current branch (typically main). Archives
competing branches, updates the timeline, and cleans up worktrees.

## Usage

```
/bc:merge <winning-branch> [--into <target>] [--archive-losers] [--no-cleanup]
```

## Parameters

- `$ARGUMENTS` -- Required: the branch to merge. Optional flags.
- `<winning-branch>` -- The strategy branch to merge (e.g., `bc/dashboard-recharts`)
- `--into <target>` -- Target branch to merge into (default: current branch)
- `--archive-losers` -- Also archive all sibling strategy branches that forked from the same point
- `--no-cleanup` -- Keep worktree directories after merge (don't remove them)

## Execution Steps

1. **Validate prerequisites**:
   - Ensure `.boardclaude/` exists
   - Ensure the winning branch exists
   - Ensure the target branch exists and is checked out
   - Check for uncommitted changes in the current branch (warn if present)
   - Load state.json to find related branches (siblings forked from same point)

2. **Pre-merge check**:
   - Look for the most recent audit on the winning branch
   - If no audit exists, warn: "No audit found for this branch. Consider running /bc:audit first."
   - If an audit exists, display the score: "Merging bc/<name> (score: X/100)"

3. **Perform git merge**:
   ```bash
   git merge bc/<winning-branch> -m "merge(bc/<winning-branch>): BoardClaude score <score>/100 - <one-line rationale>"
   ```
   - If merge conflicts occur, inform the user and pause for manual resolution
   - After conflict resolution, the user should re-run `/bc:merge` or complete manually

4. **Update state.json**:
   - Update the worktree entry for the winning branch: `"status": "merged"`
   - If `--archive-losers`: update sibling branches: `"status": "abandoned"`
   - Update `latest_audit` and `latest_score` from the winning branch's audit

5. **Append merge event to timeline.json**:
   ```json
   {
     "id": "merge-{timestamp}",
     "type": "merge",
     "timestamp": "<ISO 8601>",
     "merged_branch": "bc/<winning-branch>",
     "into_branch": "<target>",
     "score": <composite from latest audit>,
     "score_delta": "<+/- from pre-fork score>",
     "rationale": "<from audit one_line or user-provided>"
   }
   ```

6. **Archive losing branches** (if `--archive-losers`):
   For each sibling branch that was forked from the same parent:
   - Record in timeline.json:
     ```json
     {
       "id": "abandon-{timestamp}",
       "type": "abandon",
       "timestamp": "<ISO 8601>",
       "branch": "bc/<losing-branch>",
       "reason": "Outscored by bc/<winning-branch> (<winner-score> vs <loser-score>)",
       "final_score": <composite>
     }
     ```
   - Do NOT delete the git branch (it is historical data)
   - Remove the worktree directory (unless `--no-cleanup`)

7. **Clean up worktrees** (unless `--no-cleanup`):
   ```bash
   git worktree remove .boardclaude/worktrees/<winning-branch>
   ```
   If `--archive-losers`:
   ```bash
   git worktree remove .boardclaude/worktrees/<losing-branch>
   ```
   Run `git worktree prune` to clean stale entries.

8. **Display results**:
   ```
   Merged: bc/<winning-branch> -> <target>
   Score: <composite>/100
   Delta: +<improvement> from pre-fork baseline

   Archived branches:
   - bc/<losing-a> (score: X, reason: outscored)
   - bc/<losing-b> (score: Y, reason: outscored)

   Worktrees cleaned up: <count>
   Timeline updated with merge event.

   Next steps:
   - Run /bc:audit to verify the merged result
   - Check the timeline in the dashboard for the full history
   ```

## Notes

- Merging does NOT delete git branches -- they remain in history
- Worktree directories are removed by default (use --no-cleanup to preserve)
- The timeline preserves the full story: fork, audits, comparison, merge, and abandonment
- Always run `/bc:audit` after merging to verify the combined result scores well
- If the merge introduces regressions, consider `/bc:fork` to try an alternative integration

$ARGUMENTS
