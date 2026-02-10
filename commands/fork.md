# /bc:fork -- Create Strategy Branch

Create a git worktree for a parallel strategy experiment. This allows you to
try different approaches in isolation, audit each independently, then compare
scores to make a data-driven decision about which approach to merge.

## Usage

```
/bc:fork <strategy-name> [--from <branch>] [--hypothesis <reason>]
```

## Parameters

- `$ARGUMENTS` -- Required: strategy name. Optional: source branch and hypothesis.
- `<strategy-name>` -- Name for the strategy branch (will be prefixed with `bc/`)
- `--from <branch>` -- Branch to fork from (default: current branch)
- `--hypothesis <reason>` -- Why you're creating this fork (recorded in timeline)

## Execution Steps

1. **Validate prerequisites**:
   - Ensure `.boardclaude/` exists (if not, prompt to run `/bc:init`)
   - Ensure git is initialized in the project
   - Ensure the strategy name is valid (lowercase, hyphens, no spaces)
   - Check that branch `bc/<strategy-name>` doesn't already exist

2. **Create git worktree**:
   ```bash
   git worktree add .boardclaude/worktrees/<strategy-name> -b bc/<strategy-name>
   ```
   If `.boardclaude/worktrees/` doesn't exist, create it first.

3. **Copy BoardClaude config to worktree**:
   - Copy `.boardclaude/state.json` to the new worktree's `.boardclaude/`
   - Copy `.boardclaude/timeline.json` to the new worktree
   - Copy the active panel YAML to the new worktree
   - Do NOT copy audits/ (each branch generates its own)

4. **Update state.json** (in the source branch):
   - Add the new worktree to the `worktrees` array:
     ```json
     {
       "name": "bc/<strategy-name>",
       "forked_from": "<source-branch>",
       "forked_at_audit": "<latest audit ID or null>",
       "status": "active",
       "worktree_path": ".boardclaude/worktrees/<strategy-name>",
       "hypothesis": "<reason if provided>"
     }
     ```

5. **Append fork event to timeline.json**:
   ```json
   {
     "id": "fork-{timestamp}",
     "type": "fork",
     "timestamp": "<ISO 8601>",
     "from_branch": "<source branch>",
     "to_branch": "bc/<strategy-name>",
     "hypothesis": "<reason if provided>",
     "from_audit": "<latest audit ID or null>"
   }
   ```

6. **Display instructions to the user**:
   ```
   Strategy branch created: bc/<strategy-name>
   Worktree location: .boardclaude/worktrees/<strategy-name>

   To work on this strategy:
     cd .boardclaude/worktrees/<strategy-name>
     claude   # Start a new Claude Code session

   To audit this strategy:
     /bc:audit   # Run from within the worktree

   To compare strategies:
     /bc:compare bc/<strategy-name> bc/<other-strategy>

   To merge the winner:
     /bc:merge bc/<strategy-name>
   ```

## Example Workflows

**Dashboard library comparison:**
```
/bc:fork dashboard-recharts --hypothesis "Recharts has better React DX"
/bc:fork dashboard-d3 --hypothesis "D3 gives more visual control"
# Work on each, audit each, then:
/bc:compare bc/dashboard-recharts bc/dashboard-d3
```

**Architecture experiment:**
```
/bc:fork monorepo --hypothesis "Monorepo may simplify deployment"
/bc:fork modular --hypothesis "Separate packages for better modularity"
```

## Notes

- Each worktree gets its own independent Claude Code session
- CLAUDE.md is automatically available in worktrees (git-tracked)
- Worktrees share the git history, so you can cherry-pick between them
- Abandoned worktrees should be cleaned up with `git worktree remove`
- The timeline records ALL forks, including abandoned ones (they are data)
- Creating a fork does NOT run an audit -- do that manually in the worktree

$ARGUMENTS
