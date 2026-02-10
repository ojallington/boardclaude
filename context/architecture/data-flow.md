# Data Flow Diagrams

> ASCII flow diagrams for the main operational flows in BoardClaude.
> These diagrams map command triggers through state transitions to output artifacts.

---

## 1. Audit Pipeline (Main Flow)

The core `/bc:audit` command drives this pipeline. It follows a state machine
tracked in `.boardclaude/state.json` under `current_audit.state`.

```
User runs /bc:audit [--panel name] [--effort level]
  |
  v
+------------------+
|   LOAD CONFIG    |  Read panels/<name>.yaml
|                  |  Parse agents, weights, criteria, scoring thresholds
|                  |  Verify all agent weights sum to 1.0
+--------+---------+
         |
         v
+------------------+
|  VERIFY STATE    |  Check .boardclaude/ exists
|                  |    If missing: create state.json, timeline.json, audits/
|                  |  Read state.json for current status
+--------+---------+
         |
         v
+------------------+
|   LOAD HISTORY   |  Find latest_audit from state.json
|                  |  Load previous audit JSON (if exists)
|                  |  Extract per-agent scores for delta tracking
|                  |  If no previous audit: iteration = 0 (baseline)
+--------+---------+
         |
         v
+------------------+
|  SPAWN AGENTS    |  Create Agent Team (1 teammate per panel agent)
|                  |  Each agent receives:
|                  |    - Full persona prompt from agents/<name>.md
|                  |    - Codebase path and evaluation scope
|                  |    - Previous scores for this agent (delta tracking)
|                  |    - Output format: Agent Evaluation Schema
|                  |  Model routing per panel config (Opus/Sonnet)
+--------+---------+
         |
         |  (all agents run in parallel)
         |
    +----+----+----+----+----+----+
    |    |    |    |    |    |    |
    v    v    v    v    v    v    |
  Boris Cat Thariq Lydia Ado Jason|
  (Opus)(Opus)(Opus)(Opus)(Son)(Son)
    |    |    |    |    |    |    |
    +----+----+----+----+----+----+
         |
         |  (wait for ALL agents to complete)
         v
+------------------+
|   SYNTHESIZE     |  Run synthesis agent (Sonnet, subagent not teammate)
|                  |  Input: all 6 agent evaluation JSONs
|                  |  Rules: never invent findings, only merge
|                  |  Present conflicts with analysis
|                  |  Calculate weighted composite scores
+--------+---------+
         |
         v
+------------------+
|  CALCULATE       |  Per-agent composite: sum(criterion_score * criterion_weight)
|  SCORES          |  Panel composite: sum(agent_composite * agent_weight)
|                  |  Grade: A+ (95-100) ... F (<50)
|                  |  Verdict: STRONG_PASS / PASS / MARGINAL / FAIL
+--------+---------+
         |
         v
+------------------+
|  GENERATE        |  Radar chart axes: architecture, product, innovation,
|  RADAR DATA      |    code_quality, documentation, integration
|                  |  Average agent scores per dimension
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
                          |  Composite + grade + verdict
                          |  Top 3 strengths / weaknesses
                          |  Critical issues
                          |  Top 5 action items
                          |  Iteration delta
                          |  Paths to output files
                          +----------------+
```

### State Machine

```
IDLE ──/bc:audit──> INGEST ──> PANEL_AUDIT ──> SYNTHESIZE ──> REPORT ──> COMPLETE
                                                    |                       |
                                              (if auto-implement)      back to IDLE
                                                    |
                                                    v
                                              IMPLEMENT ──> VERIFY ──> RE-AUDIT?
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
panels/*.yaml ─────> Audit Runner ─────> agents/*.md
    (config)            (skill)           (personas)
                          |
                          v
                   .boardclaude/state.json  (read previous state)
                          |
                          v
                   Agent Team (6 agents in parallel)
                          |
                          v
                   Synthesis Agent (merges findings)
                          |
                   +------+------+
                   |             |
                   v             v
            audits/*.json  audits/*.md
                   |
                   v
            state.json (updated)
            timeline.json (appended)
                   |
                   v
            Dashboard (reads JSON files)
```
