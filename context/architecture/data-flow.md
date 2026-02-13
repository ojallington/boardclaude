# Data Flow Diagrams

> ASCII flow diagrams for the main operational flows in BoardClaude.
> These diagrams map command triggers through state transitions to output artifacts.

---

## 1. Audit Pipeline (Single-Tier Orchestration)

The `/bc:audit` command uses single-tier orchestration:
- **Skill runner** (launcher): Reads config, creates team, spawns all agents directly, collects results, writes files.
- All spawned agents use `mode: "bypassPermissions"` — no permission prompts appear.

### Audit Flow

```
User runs /bc:audit [--panel name] [--effort level]
  |
  v
+------------------+
|   LOAD CONFIG    |  Read panels/<name>.yaml
|                  |  Parse agents, weights, criteria
|                  |  Verify weights sum to 1.0
+--------+---------+
         |
         v
+------------------+
|   LOAD STATE     |  Read .boardclaude/state.json
|                  |  Get iteration number, latest audit ID
|                  |  Get score history for trend data
+--------+---------+
         |
         v
+------------------+
|  CREATE TEAM     |  TeamCreate("audit-{timestamp}")
+--------+---------+
         |
         v
+------------------+
|  INGEST CODEBASE |  Glob + Read codebase files
|                  |  Load 2 most recent audit JSONs
|                  |  Build project summary
+--------+---------+
         |
         v
+------------------+
|  SPAWN 6 JUDGES  |  Task per agent, mode: "bypassPermissions"
|                  |  team_name: current team
|                  |  Each receives: persona, project summary,
|                  |    cross-iteration context, criteria, schema
|                  |  Model routing: Opus/Sonnet per panel config
+--------+---------+
         |
         |  (all 6 judges run in parallel)
         |
    +----+----+----+----+----+----+
    |    |    |    |    |    |    |
    v    v    v    v    v    v    |
  Boris Cat Thariq Lydia Ado Jason|
  (Opus)(Opus)(Opus)(Opus)(Son)(Son)
    |    |    |    |    |    |    |
    +----+----+----+----+----+----+
         |
         |  (wait for ALL 6 evaluations via SendMessage)
         v
+------------------+
|     DEBATE       |  Identify divergent score pairs
|                  |  SendMessage cross-examination to idle judges
|                  |  Parse REVISED: scores, apply revisions
|                  |  Record debate transcript
+--------+---------+
         |
         v
+------------------+
|   SYNTHESIZE     |  Spawn synthesis agent (mode: "bypassPermissions")
|                  |  Input: all 6 evaluations + debate + weights
|                  |  Rules: never invent, only merge
|                  |  Calculate composite, radar, action items
+--------+---------+
         |
         v
+--------+---------+-------------------+
|                  |                   |
v                  v                   v
+-------------+ +-------------+ +----------------+
| SAVE JSON   | | SAVE MD     | | UPDATE STATE   |
| audits/     | | audits/     | | state.json:    |
| audit-{ts}  | | audit-{ts}  | |  audit_count++ |
| .json       | | .md         | |  latest_audit  |
+-------------+ +-------------+ |  latest_score  |
                               | |  score_history |
                               | +-------+--------+
                               |         |
                               v         v
                         +----------------+
                         | APPEND TO      |
                         | timeline.json  |
                         |  type: "audit" |
                         |  score, branch |
                         |  parent ref    |
                         +-------+--------+
                                 |
                                 v
                         +----------------+
                         | REPORT TO USER |
                         | Composite score|
                         | Top 3 strengths|
                         | Top 5 actions  |
                         +-------+--------+
                                 |
                                 v
                         +----------------+
                         | TEARDOWN       |
                         | Shutdown judges|
                         | + synthesis    |
                         | TeamDelete     |
                         +----------------+
```

### State Machine

```
IDLE ──/bc:audit──> INGEST ──> PANEL_AUDIT ──> DEBATE ──> SYNTHESIZE ──> WRITE ──> REPORT ──> IDLE
```

---

## 2. Fork / Compare / Merge Flow

These three commands work together for data-driven strategy exploration.

### /bc:fork

```
User runs /bc:fork "strategy-name"
  |
  v
+------------------------+
|  CREATE WORKTREE       |
|  git worktree add      |
|    .boardclaude/worktrees/strategy-name
|    -b bc/strategy-name |
+----------+-------------+
           |
           v
+------------------------+
|  COPY CONFIG           |
|  cp -r .boardclaude/   |
|    into worktree       |
|  (config travels,      |
|   state resets)        |
+----------+-------------+
           |
           v
+------------------------+
|  UPDATE STATE          |
|  state.json:           |
|    worktrees += "bc/strategy-name"
|    status = "active"   |
+----------+-------------+
           |
           v
+------------------------+
|  LOG TIMELINE EVENT    |
|  timeline.json append: |
|    type: "fork"        |
|    branch: "main"      |
|    new_branches: [     |
|      "bc/strategy-name"|
|    ]                   |
|    reason: user input  |
|    parent: latest evt  |
+----------+-------------+
           |
           v
+------------------------+
|  REPORT                |
|  "Forked to worktree.  |
|   Run 'cd <path> &&   |
|   claude' to start."  |
+------------------------+
```

### /bc:compare

```
User runs /bc:compare branch-a branch-b
  |
  v
+--------------------------+
|  CHECK RECENT AUDITS     |
|  Does branch-a have a    |  ──NO──> Run /bc:audit on branch-a
|  recent audit?           |
+-----------+--------------+
            |YES
            v
+--------------------------+
|  CHECK RECENT AUDITS     |
|  Does branch-b have a    |  ──NO──> Run /bc:audit on branch-b
|  recent audit?           |
+-----------+--------------+
            |YES
            v
+--------------------------+
|  LOAD BOTH AUDIT JSONs   |
|  Extract per-agent       |
|  scores from each        |
+-----------+--------------+
            |
            v
+--------------------------+
|  GENERATE COMPARISON     |
|                          |
|  +--------+------+------+
|  | Agent  |  A   |  B   |
|  +--------+------+------+
|  | Boris  |  78  |  72  |
|  | Cat    |  82  |  75  |
|  | Thariq |  70  |  74  |
|  | Lydia  |  80  |  65  |
|  | Ado    |  75  |  70  |
|  | Jason  |  77  |  72  |
|  +--------+------+------+
|  | TOTAL  | 77.0 | 71.3 |
|  +--------+------+------+
|                          |
|  Identify key diff:      |
|  "Lydia +15 for A        |
|   outweighs Thariq +4    |
|   for B"                 |
+-----------+--------------+
            |
            v
+--------------------------+
|  SAVE COMPARISON         |
|  audits/compare-a-vs-b   |
|    .json                 |
+-----------+--------------+
            |
            v
+--------------------------+
|  RECOMMEND               |
|  "Merge branch-a into    |
|   main (score: 77.0 vs   |
|   71.3)"                 |
+--------------------------+
```

### /bc:merge

```
User runs /bc:merge branch-a
  |
  v
+--------------------------+
|  GIT MERGE               |
|  git checkout main       |
|  git merge bc/branch-a   |
|    -m "merge(branch-a):  |
|    score 77.0 vs 71.3"  |
+-----------+--------------+
            |
            v
+--------------------------+
|  ARCHIVE LOSERS          |
|  For each losing branch: |
|    Mark as "abandoned"   |
|    in timeline.json      |
|    Remove worktree dir   |
|    git worktree remove   |
+-----------+--------------+
            |
            v
+--------------------------+
|  UPDATE STATE            |
|  state.json:             |
|    Remove merged/archived|
|    from worktrees[]      |
|    status = "idle" (if   |
|    no more worktrees)    |
+-----------+--------------+
            |
            v
+--------------------------+
|  LOG TIMELINE EVENT      |
|  timeline.json append:   |
|    type: "merge"         |
|    winning_branch        |
|    losing_branches       |
|    reason (with scores)  |
|    parent: winning audit |
+-----------+--------------+
            |
            v
+--------------------------+
|  REPORT                  |
|  "Merged branch-a into   |
|   main. Losing branches  |
|   archived in timeline." |
+--------------------------+
```

---

## 3. Fix Pipeline (Pull-Based Worker Pool)

The `/bc:fix` command uses native TaskCreate/TaskList for coordination. Workers self-organize around a shared task board.

### Full Fix Flow

```
User runs /bc:fix [--max N] [--serial] [--dry-run] [--audit] [--loop N]
  |
  v
+------------------+
|  LOAD AUDIT +    |  Read state.json -> latest audit
|  LEDGER          |  Load/create action-items.json
|                  |  Filter: open, priority, effort
+--------+---------+
         |
         v
+------------------+
|  CREATE TEAM     |  TeamCreate("fix-{timestamp}")
+--------+---------+
         |
         v
+------------------+
|  VALIDATION      |  tsc --noEmit, vitest run, next lint
|  BASELINE        |  Record pass/fail counts
+--------+---------+
         |
         v
+------------------+
|  DEPENDENCY      |  Build conflict graph from file_refs
|  ANALYSIS        |  Greedy graph coloring -> batches
+--------+---------+
         |
         v
+------------------+
|  CREATE TASKS    |  TaskCreate per item + validation gate per batch
|  (native)        |  Set blockedBy dependencies:
|                  |    Gate N blocked by batch N fix tasks
|                  |    Batch N+1 tasks blocked by gate N
+--------+---------+
         |
         |  --dry-run? -> display plan, cleanup, stop
         |
         v
+------------------+
|  SPAWN WORKER    |  min(max_batch_size, 4) fix-workers
|  POOL            |  Workers pull from TaskList autonomously
|                  |  subagent_type: "fix-worker"
+--------+---------+
         |
         |  Workers self-organize:
         |  TaskList -> claim lowest-ID pending task ->
         |  implement fix -> TaskUpdate(completed) ->
         |  loop back to TaskList
         |
    +----+----+----+----+
    |    |    |    |    |
    v    v    v    v    |
  fix-  fix-  fix-  fix-|
  wkr1  wkr2  wkr3  wkr4
    |    |    |    |    |
    +----+----+----+----+
         |
         v
+------------------+
| LEADER MONITOR   |  Poll TaskList every 30s
| LOOP             |  When gate's blockedBy all done:
|                  |    Run centralized validation
|                  |    Pass -> mark gate completed
|                  |    Fail -> revert, create retry tasks
|                  |  Worker health: nudge 3m, kill 3.5m
|                  |  Exit: all done or 10m ceiling
+--------+---------+
         |
         v
+------------------+
|  UPDATE LEDGER   |  Read results from task metadata
|                  |  Update action-items.json
|                  |  (resolved, in_progress, blocked)
+--------+---------+
         |
         v
+------------------+
|  REPORT          |  Items fixed/blocked/remaining
|                  |  Validation status
|                  |  Score delta (if --audit)
+--------+---------+
         |
         v
+------------------+
|  TEARDOWN        |  Shutdown workers
|                  |  TeamDelete (cleans up tasks)
+------------------+
```

### Validation Gate Pattern

```
Batch 1 tasks:     [fix-ai-001] [fix-ai-003]
                        |             |
                        v             v
                   +---gate-1---+
                        |
                        v  (leader runs tsc/vitest/lint)
                       PASS?
                      /     \
                    YES      NO
                     |        |
                     v        v
               Batch 2    Revert batch 1 files
               unblocked  Create retry tasks (attempt 2)
```

### Task State Transitions

```
pending ──(worker claims)──> in_progress ──(worker finishes)──> completed
                                  |                                  |
                           (timeout/kill)                    (leader reads
                                  |                          task metadata)
                                  v                                  |
                            revert files,                            v
                            create retry task                  ledger update
```

---

## 4. File System Layout (Runtime State)

```
.boardclaude/                          # Runtime state directory
  |
  +-- state.json                       # Current project state
  |     project, panel, branch,
  |     audit_count, latest_audit,
  |     latest_score, score_history,
  |     worktrees[], status
  |
  +-- timeline.json                    # Append-only event log
  |     events[]: audit, fork,
  |     merge, rollback
  |
  +-- audits/                          # Audit output files
  |     +-- audit-20260210-180000.json # Machine-readable (Synthesis Schema)
  |     +-- audit-20260210-180000.md   # Human-readable report
  |     +-- audit-20260211-200000.json
  |     +-- audit-20260211-200000.md
  |     +-- compare-a-vs-b.json       # Comparison outputs
  |
  +-- validation/                     # Validation results
  |     +-- latest.json               # Most recent validation-runner output
  |     +-- accessibility.json        # Most recent accessibility-auditor output
  |     +-- screenshots/              # Visual regression screenshots
  |
  +-- action-items.json               # Persistent action items ledger
  |                                   # (survives TeamDelete, unlike TaskList)
  |
  +-- worktrees/                       # Git worktree directories
        +-- dashboard-recharts/        # Created by /bc:fork
        +-- dashboard-d3/             # Each gets own Claude session
```

### Data Dependencies

```
panels/*.yaml ─────> Audit Skill Runner
    (config)           (single-tier)
                          |
                          v
                   .boardclaude/state.json
                          |
                          +──────────────────────+
                          |                      |
                          v                      v
                   agents/*.md (personas)   agents/fix-worker.md
                          |                      |
                          v                      v
                   Agent Team (6 judges)    Fix Worker Pool
                   (parallel, push-based)   (pull-based, TaskList)
                          |                      |
                          v                      v
                   evaluations via          task metadata
                   SendMessage              (authoritative)
                          |                      |
                          v                      v
                   Synthesis Agent          Validation Gates
                   (bypassPermissions)      (leader-only)
                          |                      |
                   +------+------+               |
                   |             |               |
                   v             v               v
            audits/*.json  audits/*.md    action-items.json
                   |                      (persistent ledger)
                   v
            state.json (updated)
            timeline.json (appended)
            action-items.json (seeded/merged)
                   |
                   v
            Dashboard (reads JSON files)
```
