# Data Flow Diagrams

> ASCII flow diagrams for the main operational flows in BoardClaude.
> These diagrams map command triggers through state transitions to output artifacts.

---

## 1. Audit Pipeline (Two-Tier Delegation)

The core `/bc:audit` command uses a two-tier delegation model:
- **Main agent** (launcher): Reads config, spawns coordinator, relays results. ~5-8 tool calls.
- **Coordinator** (autonomous): Ingests codebase, spawns judges, runs debate, writes files.

All spawned agents use `mode: "bypassPermissions"` — no permission prompts appear.

### Tier 1: Main Agent (Delegate Launcher)

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
| SPAWN COORDINATOR|  Task(subagent_type: "general-purpose",
|                  |       name: "audit-coordinator",
|                  |       mode: "bypassPermissions")
|                  |  Pass: coordinator instructions, panel YAML,
|                  |        iteration metadata, CLI flags, schemas
+--------+---------+
         |
         |  (main agent idles — coordinator handles everything)
         |
         v
+------------------+
| RECEIVE REPORT   |  Coordinator sends AUDIT_COMPLETE via SendMessage
|                  |  Contains: score, grade, verdict, top items, paths
+--------+---------+
         |
         v
+------------------+
| REPORT TO USER   |  Relay composite + grade + verdict
|                  |  Top 3 strengths / weaknesses
|                  |  Top 5 action items
|                  |  Iteration delta + file paths
+--------+---------+
         |
         v
+------------------+
|    TEARDOWN      |  Shutdown coordinator → TeamDelete
+------------------+
```

### Tier 2: Audit Coordinator (Autonomous)

```
Coordinator receives panel config + iteration metadata
  |
  v
+------------------+
|  SETUP & INGEST  |  mkdir -p .boardclaude/audits
|                  |  Load 2 most recent audit JSONs
|                  |  Glob + Read codebase files
|                  |  Build project summary
+--------+---------+
         |
         v
+------------------+
|  SPAWN 6 JUDGES  |  Task per agent, mode: "bypassPermissions"
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
                         | SEND REPORT    |
                         | to launcher    |
                         | via SendMessage|
                         +-------+--------+
                                 |
                                 v
                         +----------------+
                         | SHUTDOWN       |
                         | judges +       |
                         | synthesis      |
                         +----------------+
```

### State Machine

```
IDLE ──/bc:audit──> DELEGATE ──> [coordinator runs autonomously] ──> REPORT ──> COMPLETE
                                                                        |
                                  coordinator internally:          back to IDLE
                                  INGEST → PANEL_AUDIT → DEBATE →
                                  SYNTHESIZE → WRITE → REPORT_BACK
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

## 3. Implementation Loop (Closed Loop)

The audit-to-improvement pipeline. Closes the gap between evaluation and action.

### Full Loop Flow

```
User runs /bc:audit
  |
  v
+------------------+
|   AUDIT PIPELINE |  (See Section 1 above)
|   6 agents +     |  Produces structured evaluation JSON
|   synthesis       |
+--------+---------+
         |
         v
+------------------+
| EXTRACT ACTION   |  Synthesis identifies action items
| ITEMS            |  Assign: priority, effort, file_refs
|                  |  Write to .boardclaude/action-items.json
+--------+---------+
         |
         v
+------------------+
| ACTION ITEMS     |  Persistent ledger
| LEDGER           |  Tracks: open, in_progress, resolved,
|                  |  blocked, wont_fix, chronic
+--------+---------+
         |
         | User runs /bc:fix
         v
+------------------+
| FILTER ITEMS     |  priority <= 3
|                  |  effort: low | medium
|                  |  status: open (chronic items first)
+--------+---------+
         |
         v
+------------------+
| VALIDATION       |  Run validation-runner (baseline)
| BASELINE         |  Record: types, tests, lint, format
+--------+---------+
         |
    +----+----+
    |         |
    v         | (for each item, sequentially)
+--------+    |
| READ   |    |
| CONTEXT |   |
| for item|   |
+--------+    |
    |         |
    v         |
+--------+    |
| IMPLEMENT|  |
| FIX      |  |
+--------+    |
    |         |
    v         |
+------------------+
| VALIDATE FIX     |  Run validation-runner (post-fix)
|                  |  Compare against baseline
+--------+---------+
    |              |
   PASS           FAIL
    |              |
    v              v
+----------+  +----------+
| STAGE    |  | REVERT   |
| Mark:    |  | Mark:    |
| in_prog  |  | blocked  |
+----------+  +----------+
    |
    | (after all items)
    v
+------------------+
| RE-AUDIT         |  Run /bc:audit to measure delta
+--------+---------+
         |
         v
+------------------+
| RECONCILE LEDGER |
|                  |
| Score improved?  |
|   YES: resolved  |
|   NO: iterations |
|       _open++    |
|   3+: chronic    |
+--------+---------+
         |
         v
+------------------+
| REPORT           |
| Items fixed: N   |
| Score delta: +X  |
| Items remaining: M
| Cost: $Y         |
+------------------+
```

### Budget Safety Branch

```
Before each fix:
  Check running API cost
    |
    +-- Under budget checkpoint? → Proceed
    |
    +-- Approaching checkpoint? → ABORT
        Report: "Budget limit approaching. X items fixed, Y remaining."
        Save partial progress to ledger.
```

### Chronic Item Escalation

```
After ledger reconciliation:
  For each open item:
    iterations_open >= 3?
      |
      YES → Flag as "chronic"
      |     Synthesis highlights in next audit
      |     /bc:fix prioritizes in next run
      |     May indicate architectural issue
      |
      NO  → Continue normal tracking
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
  |
  +-- worktrees/                       # Git worktree directories
        +-- dashboard-recharts/        # Created by /bc:fork
        +-- dashboard-d3/             # Each gets own Claude session
```

### Data Dependencies

```
panels/*.yaml ─────> Audit Launcher ─────> agents/audit-coordinator.md
    (config)           (skill)                  (coordinator)
                          |                          |
                          v                          v
                   .boardclaude/state.json    agents/*.md (personas)
                          |                          |
                          v                          v
                   Audit Coordinator          Agent Team (6 judges)
                   (autonomous)               (parallel, bypassPermissions)
                          |                          |
                          v                          v
                   Synthesis Agent            evaluations via SendMessage
                   (bypassPermissions)               |
                          |                          |
                   +------+------+                   |
                   |             |                   |
                   v             v                   |
            audits/*.json  audits/*.md          debate transcript
                   |
                   v
            state.json (updated)
            timeline.json (appended)
            action-items.json (seeded/merged)
                   |
                   v
            Dashboard (reads JSON files)
```
