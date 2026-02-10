---
name: timeline-manager
description: Manage branching timeline for BoardClaude audits. Handle forks, merges, comparisons, and timeline visualization data. Triggers on "fork", "branch", "compare", "merge", "timeline", "strategy", "worktree".
allowed-tools: Read, Write, Bash, Glob
context: fork
agent: general-purpose
---

# Timeline Manager — ultrathink

## Overview

Manage the branching decision timeline that tracks every audit, fork, merge, and rollback in a BoardClaude project. The timeline makes strategic decisions visible: which approaches were tested in parallel, which won, and why. Every meaningful choice becomes a node in a horizontal tree, backed by git worktrees for isolated experimentation.

The timeline is the visual heart of BoardClaude. It tells the complete story of how a project evolved through structured experimentation rather than linear guessing.

## Prerequisites

- Git repository initialized: !`git rev-parse --is-inside-work-tree 2>/dev/null || echo "NOT A GIT REPO"`
- BoardClaude state dir: !`ls .boardclaude/state.json 2>/dev/null || echo "NOT FOUND"`
- Current branch: !`git branch --show-current 2>/dev/null`
- Active worktrees: !`git worktree list 2>/dev/null`

## Operations

### FORK — Create a Strategy Branch

Create an isolated worktree to test a hypothesis without affecting the main branch.

**Steps:**

1. **Validate inputs**: Require a branch name and hypothesis description
2. **Create git worktree**:
   ```bash
   BRANCH_NAME="bc/$1"
   WORKTREE_PATH=".boardclaude/worktrees/$1"
   git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"
   ```
3. **Copy `.boardclaude/` config** to the new worktree (panels, agent definitions — NOT audit history):
   ```bash
   cp -r panels/ "$WORKTREE_PATH/panels/"
   cp -r agents/ "$WORKTREE_PATH/agents/"
   mkdir -p "$WORKTREE_PATH/.boardclaude/audits"
   ```
4. **Initialize worktree state**: Create a fresh `state.json` in the worktree with the fork metadata:
   ```json
   {
     "project": "<project name>",
     "panel": "<active panel>",
     "branch": "bc/<branch-name>",
     "audit_count": 0,
     "latest_audit": null,
     "latest_score": null,
     "score_history": [],
     "forked_from": {
       "branch": "<source branch>",
       "audit_id": "<latest audit id at fork time>",
       "commit": "<git commit hash>",
       "score": <score at fork time>
     },
     "worktrees": [],
     "status": "active"
   }
   ```
5. **Record fork event** in the source branch's `timeline.json`:
   ```json
   {
     "id": "fork-<timestamp>",
     "type": "fork",
     "branch": "<source branch>",
     "timestamp": "<ISO 8601>",
     "hypothesis": "<what is being tested>",
     "children": [],
     "parent": "<latest audit id>",
     "to_branch": "bc/<branch-name>",
     "worktree_path": ".boardclaude/worktrees/<name>"
   }
   ```
6. **Update source `state.json`**: Add the new worktree to the `worktrees` array and record it in `branches`:
   ```json
   {
     "branches": {
       "bc/<branch-name>": {
         "forked_from": "<source branch>",
         "forked_at": "<audit id>",
         "status": "active",
         "hypothesis": "<what is being tested>",
         "latest_audit": null,
         "worktree_path": ".boardclaude/worktrees/<name>"
       }
     }
   }
   ```
7. **Report**: Tell the user the worktree path and how to start working in it

### COMPARE — Side-by-Side Branch Evaluation

Load audit results from two or more branches and produce a detailed comparison.

**Steps:**

1. **Load audit results** from each branch:
   - Read each branch's `.boardclaude/state.json` (or the worktree's state)
   - Load the latest audit JSON from each branch's `.boardclaude/audits/`
   - If a branch has no audits yet, prompt the user to run an audit first

2. **Produce side-by-side score comparison**:
   ```
   ┌──────────────────────────────────────────────────────────────┐
   │              Branch Comparison: <comparison id>               │
   ├─────────────┬──────────────────┬────────────────────────────┤
   │   Agent     │  <branch A>      │  <branch B>                │
   ├─────────────┼──────────────────┼────────────────────────────┤
   │ Boris       │  XX (+/-delta)   │  XX (+/-delta)             │
   │ Cat         │  XX (+/-delta)   │  XX (+/-delta)             │
   │ ...         │  ...             │  ...                       │
   ├─────────────┼──────────────────┼────────────────────────────┤
   │ COMPOSITE   │  XX.X            │  XX.X                      │
   └─────────────┴──────────────────┴────────────────────────────┘
   ```

3. **Calculate per-agent deltas**: For each agent, compute the score difference between branches and relative to the fork point (the last audit on the source branch before forking)

4. **Identify which branch wins on each dimension**:
   - Mark the winner per agent with an indicator
   - Note dimensions where the difference is within noise range (<3 points)
   - Highlight dimensions where one branch has a decisive advantage (>10 points)

5. **Produce recommendation**:
   - Overall winner based on composite score
   - Key differentiator (which agent/dimension swung the result)
   - Risk analysis (does the winner have any critical issues the loser does not?)
   - Recommended action: merge winner, continue experimenting, or hybrid approach

6. **Save comparison** to `.boardclaude/audits/compare-{timestamp}.json`:
   ```json
   {
     "comparison_id": "compare-<timestamp>",
     "timestamp": "<ISO 8601>",
     "branches": [
       {
         "name": "<branch A>",
         "audit_id": "<audit id>",
         "composite": <score>,
         "agent_scores": { "<agent>": <score>, "..." : "..." }
       },
       {
         "name": "<branch B>",
         "audit_id": "<audit id>",
         "composite": <score>,
         "agent_scores": { "<agent>": <score>, "..." : "..." }
       }
     ],
     "deltas": { "<agent>": <branch_a - branch_b>, "..." : "..." },
     "winner": "<branch name>",
     "key_differentiator": "<explanation>",
     "recommendation": "<merge | continue | hybrid>"
   }
   ```

### MERGE — Integrate Winning Branch

Merge the winning worktree branch into the target branch (usually main).

**Steps:**

1. **Validate**: Confirm the branch to merge exists and has at least one audit
2. **Merge the git branch**:
   ```bash
   git checkout <target-branch>
   git merge "bc/<branch-name>" -m "merge(bc/<branch-name>): score XX.X, <key differentiator>"
   ```
3. **Archive losing branches** — do NOT delete them, they are data:
   - Update their status to `"abandoned"` in `state.json`
   - Record the abandonment reason (from comparison data)
   - Remove their worktree directories:
     ```bash
     git worktree remove ".boardclaude/worktrees/<losing-branch>"
     ```
4. **Log merge event** in `timeline.json`:
   ```json
   {
     "id": "merge-<timestamp>",
     "type": "merge",
     "branch": "<target branch>",
     "timestamp": "<ISO 8601>",
     "merged_branch": "bc/<branch-name>",
     "score_delta": "+/-XX.X composite",
     "parent": "<winning branch's latest audit id>"
   }
   ```
5. **Update losing branches** in `timeline.json` — set their status:
   ```json
   {
     "id": "<losing branch audit id>",
     "status": "abandoned",
     "abandon_reason": "<from comparison recommendation>"
   }
   ```
6. **Clean up**: Prune stale worktree references:
   ```bash
   git worktree prune
   ```
7. **Report**: Show the merge result, updated score, and cleaned-up branches

### ROLLBACK — Revert to a Previous Audit State

Roll back to a known good state when an experiment goes wrong.

**Steps:**

1. Create a new branch from the target audit's commit (do NOT use `git reset --hard`):
   ```bash
   AUDIT_COMMIT=$(jq -r '.nodes[] | select(.id == "<audit-id>") | .commit' .boardclaude/timeline.json)
   git worktree add ".boardclaude/worktrees/rollback-<audit-id>" -b "bc/rollback-<audit-id>" "$AUDIT_COMMIT"
   ```
2. Restore `.boardclaude/state.json` from the target audit point
3. Log the rollback event in `timeline.json`:
   ```json
   {
     "id": "rollback-<timestamp>",
     "type": "rollback",
     "branch": "<current branch>",
     "timestamp": "<ISO 8601>",
     "target_audit": "<audit-id>",
     "reason": "<user-provided reason>",
     "parent": "<current latest audit>"
   }
   ```
4. Run a fresh audit on the restored state to confirm scores match expectations

## State Files

### `.boardclaude/state.json`

Tracks the current project state, audit history, and active branches.

```json
{
  "project": "<project name>",
  "panel": "<active panel name>",
  "branch": "<current git branch>",
  "audit_count": 5,
  "latest_audit": "audit-20260212-143022",
  "latest_score": 87,
  "score_history": [44, 58, 72, 81, 87],
  "current_audit": {
    "id": "<audit id or null>",
    "state": "<IDLE | INGEST | PANEL_AUDIT | SYNTHESIZE | REPORT | COMPLETE>",
    "started_at": "<ISO 8601 or null>",
    "panel": "<panel name>",
    "branch": "<branch>",
    "commit": "<git commit hash>"
  },
  "branches": {
    "bc/<branch-name>": {
      "forked_from": "<source branch>",
      "forked_at": "<audit id>",
      "status": "<active | merged | abandoned>",
      "hypothesis": "<what was being tested>",
      "latest_audit": "<audit id or null>",
      "worktree_path": "<path or null if removed>"
    }
  },
  "worktrees": ["<list of active worktree paths>"],
  "status": "<active | idle>"
}
```

### `.boardclaude/timeline.json`

Append-only event log that forms the branching tree visualization.

```json
{
  "nodes": [
    {
      "id": "<unique id>",
      "type": "<audit | fork | merge | rollback>",
      "branch": "<git branch>",
      "timestamp": "<ISO 8601>",
      "parent": "<parent node id or null>",

      "commit": "<git hash, for audit nodes>",
      "scores": { "<agent>": "<score>" },
      "composite": "<number, for audit nodes>",
      "label": "<human-readable description>",
      "status": "<active | merged | abandoned, for audit nodes>",
      "abandon_reason": "<string, for abandoned nodes>",

      "hypothesis": "<string, for fork nodes>",
      "children": ["<child node ids, for fork nodes>"],
      "to_branch": "<target branch, for fork nodes>",

      "merged_branch": "<branch that was merged, for merge nodes>",
      "score_delta": "<string description, for merge nodes>",

      "target_audit": "<audit id, for rollback nodes>",
      "reason": "<string, for rollback nodes>"
    }
  ]
}
```

**Node types and their required fields:**

| Field | audit | fork | merge | rollback |
|-------|-------|------|-------|----------|
| id | required | required | required | required |
| type | "audit" | "fork" | "merge" | "rollback" |
| branch | required | required | required | required |
| timestamp | required | required | required | required |
| parent | required | required | required | required |
| commit | required | - | - | - |
| scores | required | - | - | - |
| composite | required | - | - | - |
| label | required | - | - | - |
| status | optional | - | - | - |
| hypothesis | - | required | - | - |
| children | - | required | - | - |
| merged_branch | - | - | required | - |
| score_delta | - | - | required | - |
| target_audit | - | - | - | required |
| reason | - | - | - | required |

## Timeline Visualization Data

The timeline JSON is designed to be consumed by the dashboard's `TimelineTree` component:

- **Main branch** runs horizontally left-to-right
- **Fork nodes** branch downward, creating parallel tracks
- **Audit nodes** are circles with score-based coloring:
  - Red: composite < 55 (FAIL)
  - Yellow: composite 55-69 (MARGINAL)
  - Green: composite 70-84 (PASS)
  - Blue: composite >= 85 (STRONG_PASS)
- **Merge arrows** point from the winning branch back to main
- **Abandoned branches** are greyed out with the abandon reason on hover
- **Each audit node** shows a mini radar chart on hover

## Error Handling

- **No git repo**: Refuse to fork/merge. Timeline-only operations still work.
- **Dirty working tree**: Warn before fork. Require clean state for merge.
- **Merge conflicts**: Report the conflict, do NOT auto-resolve. Let the user decide.
- **Missing worktree**: If a recorded worktree path does not exist, update state to reflect removal.
- **Orphaned branches**: On any operation, check for branches in state that no longer exist in git and mark them as abandoned.

## Worktree Cleanup

Periodically clean up stale worktrees to prevent disk bloat:

```bash
# List all worktrees
git worktree list

# Remove a specific worktree
git worktree remove ".boardclaude/worktrees/<name>"

# Prune stale references
git worktree prune

# Delete the git branch after worktree removal (optional)
git branch -d "bc/<name>"
```

Always archive before removing — the audit data from abandoned branches is valuable for the timeline visualization and for understanding what approaches were tried.
