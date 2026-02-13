# Agent Teams — BoardClaude Implementation Guide

## What It Is

Agent Teams is an experimental Claude Code feature (research preview, Feb 2026) that enables multiple Claude Code instances to work in parallel, coordinating autonomously through a shared task list and inbox-based messaging. It shipped alongside Opus 4.6 and is the single most impactful new capability for BoardClaude — enabling 6 judge agents to evaluate a project simultaneously with real-time debate. Anthropic demonstrated Agent Teams by having 16 agents autonomously build a clean-room C compiler (100,000 lines) that boots Linux 6.9.

## How to Enable

```json
// .claude/settings.json (project-level, committed to git)
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Optional spawn backend configuration:
```bash
CLAUDE_CODE_SPAWN_BACKEND=in-process  # default: all in main terminal
CLAUDE_CODE_SPAWN_BACKEND=tmux        # each agent gets own pane
CLAUDE_CODE_SPAWN_BACKEND=auto-detect # auto-select based on environment
```

Config storage location: `~/.claude/teams/{team-name}/config.json`

## How BoardClaude Uses It

### Audit Pipeline (Push-Based, Fixed Roles)

The `/bc:audit` command uses **push-based assignment** with fixed roles:
- Skill runner creates team, spawns 6 judge agents directly (single-tier, no coordinator middleman)
- Each judge receives its persona, criteria, and project summary in the spawn prompt
- All 6 evaluate in parallel, report via `EVAL_REPORT_START/END` SendMessage delimiters
- Debate phase: cross-examination via peer-to-peer SendMessage
- Synthesis agent merges findings into unified report
- Results written to `.boardclaude/audits/audit-{timestamp}.json` and `.md`

This is intentionally push-based — judges have fixed roles and there's no benefit to a pull model.

### Fix Pipeline (Pull-Based, Worker Pool)

The `/bc:fix` command uses **pull-based coordination** with native TaskCreate/TaskList:

1. **Leader creates tasks**: One TaskCreate per action item, plus validation gates per batch. Dependencies enforce batch ordering via `blockedBy`.
2. **Leader spawns worker pool**: A fixed pool of `min(max_batch_size, 4)` fix-workers, each registered as `subagent_type: "fix-worker"`.
3. **Workers self-organize**: Each worker runs a pull loop — `TaskList` -> find lowest-ID pending unclaimed task -> `TaskUpdate(claim)` -> implement fix -> `TaskUpdate(completed)` -> loop.
4. **Leader monitors gates**: When all fix tasks in a batch complete, the leader runs centralized validation (tsc + vitest + lint). Pass = mark gate completed (unblocks next batch). Fail = revert + create retry tasks.
5. **Retry = new tasks**: Failed items get retry tasks (attempt: 2) created automatically. Workers pick them up from the same TaskList. No separate retry code path.

**Why pull-based for fixes:**
- Workers handle multiple items per lifecycle (no 1-worker-per-item waste)
- Dependencies auto-enforce batch ordering (no manual sequencing)
- Workers see the full task board (better coordination)
- Retries are just new tasks (simpler code)

### Secondary Flows

- Template panel debate (e.g., personal-oscar template with configurable agents)
- Fork/compare: spawn agents on different git worktree branches, compare outcomes
- Code review panels: specialized agents for security, performance, accessibility, docs

## Architecture Patterns

### Single-Tier Spawning

All BoardClaude commands use **single-tier orchestration**: the skill runner directly spawns all agents with `team_name`. There is no coordinator or fix-lead middleman.

```
Skill Runner (leader)
  |
  +-- spawns --> Judge 1 (Boris)     \
  +-- spawns --> Judge 2 (Cat)        |  /bc:audit
  +-- spawns --> Judge 3 (Thariq)     |  (push-based)
  +-- spawns --> Judge 4 (Lydia)      |
  +-- spawns --> Judge 5 (Ado)        |
  +-- spawns --> Judge 6 (Jason)     /
  +-- spawns --> Synthesis Agent
  |
  +-- spawns --> fix-worker-1        \
  +-- spawns --> fix-worker-2         |  /bc:fix
  +-- spawns --> fix-worker-3         |  (pull-based)
  +-- spawns --> fix-worker-4        /
```

### Native Task Coordination (Fix Pipeline)

The fix pipeline uses Claude Code's native task system:

```
TaskCreate (leader)
  |
  +-- "Fix ai-001: Add error boundary"     batch 1
  +-- "Fix ai-003: Update radar chart"     batch 1
  +-- "Validation gate: batch 1"           blockedBy: [ai-001, ai-003]
  +-- "Fix ai-002: Fix type exports"       batch 2, blockedBy: [gate-1]
  +-- "Fix ai-004: Optimize page load"     batch 2, blockedBy: [gate-1]
  +-- "Validation gate: batch 2"           blockedBy: [ai-002, ai-004]
```

Workers pull from this shared board. The leader only intervenes at validation gates.

### Validation Gate Pattern

Validation gates are leader-only checkpoints between batches:

1. Workers complete all fix tasks in batch N
2. Gate N becomes unblocked (all `blockedBy` tasks completed)
3. Leader detects this via TaskList polling
4. Leader runs centralized validation (tsc + vitest + lint)
5. Pass: mark gate completed -> batch N+1 tasks unblock automatically
6. Fail: revert files, create retry tasks, mark gate completed

Workers NEVER claim gate tasks. This is enforced in the fix-worker agent instructions.

### Dual Data Stores

| Store | Scope | Lifetime | Purpose |
|-------|-------|----------|---------|
| Native TaskList | Single fix run | Ephemeral (deleted with TeamDelete) | Real-time coordination |
| action-items.json | Cross-session | Persistent (survives TeamDelete) | Durable ledger |

Task metadata is the **authoritative source** for fix results within a run. The ledger is updated from task metadata at the end of each run.

### Agent Registration

Agents are registered via symlinks in `.claude/agents/`:

```
.claude/agents/
  ado.md -> ../../agents/ado.md
  boris.md -> ../../agents/boris.md
  cat.md -> ../../agents/cat.md
  fix-worker.md -> ../../agents/fix-worker.md
  jason.md -> ../../agents/jason.md
  lydia.md -> ../../agents/lydia.md
  synthesis.md -> ../../agents/synthesis.md
  thariq.md -> ../../agents/thariq.md
```

This ensures frontmatter (`model: sonnet`, `tools: [...]`) is respected when agents are spawned via `subagent_type`.

**Team structure:**
- **Team Lead**: Skill runner. Creates team, creates tasks, monitors gates, synthesizes results. Should NOT implement — all source editing happens in workers.
- **Teammates**: Work independently, each in own context window. Can message each other and the lead via SendMessage.
- **Shared task list**: Native TaskCreate/TaskList with dependencies. Auto-unblock when dependencies complete.

**Display modes:**
- **In-process** (default): All in main terminal. `Shift+Up/Down` to select teammates.
- **Split panes**: Each gets own pane via tmux or iTerm2. See all agents simultaneously.
- **Delegate mode** (`Shift+Tab`): Restricts lead to coordination-only tools.

**What teammates inherit:** CLAUDE.md, MCP servers, skills — automatically. They do NOT inherit the lead's conversation history. Include task-specific details in each spawn prompt.

**Best practices:**
- Include full task context in each teammate's spawn prompt (don't assume shared context)
- Use specific decomposition: each agent owns one clear evaluation perspective
- Require plan approval before implementation for risky tasks
- The more specific the brief, the better the output
- Have teammates "challenge each other's conclusions" for debate mode
- For fix workers: let them pull from TaskList rather than pushing items to them

## Known Limitations

1. **No session resumption**: `/resume` and `/rewind` do not restore teammates
2. **Task status lag**: Teammates sometimes fail to mark tasks complete — lead must poll
3. **Slow shutdown**: Teammates finish their current request before stopping
4. **One team per session**: Must clean up current team before starting a new one
5. **No nested teams**: Teammates cannot spawn their own sub-teams
6. **Lead implementation drift**: Lead may start implementing instead of delegating — explicitly instruct "Wait for teammates to complete"

## Cost Implications

- Agent Teams use approximately **7x more tokens** than standard single-agent sessions
- Each teammate maintains its own context window (up to 1M tokens each)
- With 6 judge agents + synthesis: expect ~$15-25 per full audit at Opus pricing
- Mitigation: Route Ado, Jason, Synthesis to Sonnet (much cheaper) for formulaic evaluations
- Fix workers always run on Sonnet (registered via agent frontmatter `model: sonnet`)
- Budget $500 API credits across 7 days: plan for ~20-30 full audit runs

**Model routing to control costs:**

| Agent | Model | Effort | Rationale |
|-------|-------|--------|-----------|
| Boris | Opus | max | Deep architecture reasoning |
| Cat | Opus | high | Product insight needs nuance |
| Thariq | Opus | max | Innovation assessment is complex |
| Lydia | Opus | high | Code quality requires depth |
| Ado | Sonnet | medium | Documentation review is more formulaic |
| Jason | Sonnet | medium | Community/integration checks are structured |
| Synthesis | Sonnet | medium | Aggregation, not original analysis |
| Fix Workers | Sonnet | medium | Implementation is structured, not creative |

## Judge Alignment

- **Boris**: Agent Teams is his daily workflow (10-15 concurrent sessions). Parallel orchestration with specialized roles directly mirrors his philosophy. He will evaluate whether the team coordination is elegant or over-engineered.
- **Cat**: Multi-agent workflows are her sweet spot (runs 3 Claude instances simultaneously). She championed extensibility and will look for whether the team spawn is hackable/configurable.
- **Thariq**: Authored the Agent SDK blog post and led the SDK workshop. Agent Teams is the headline Opus 4.6 feature he helped ship. Novel orchestration patterns (like pull-based workers with native TaskList) will resonate strongly — this is the "Most Creative Opus 4.6 Exploration" prize target.
- **Lydia**: Less directly aligned, but will evaluate the DX of spawning and monitoring agents.
- **Ado**: Will look at how the team workflow is documented and whether it follows autonomous agentic patterns.

## Quick Reference

```json
// Enable Agent Teams in .claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CLAUDE_CODE_SPAWN_BACKEND": "in-process"
  }
}
```

**Keyboard shortcuts:**
- `Shift+Up/Down` — Select teammate (in-process mode)
- `Shift+Tab` — Toggle delegate mode (lead coordinates only)

**Key constraints:**
- Max: one team per session
- No nested teams
- No session resumption for teams
- ~7x token cost multiplier
- Teammates inherit CLAUDE.md + MCP + skills, NOT conversation history
