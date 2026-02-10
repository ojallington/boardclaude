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

**Primary flow — Hackathon Judges Panel:**
- Team Lead spawns 6 judge agents (Boris, Cat, Thariq, Lydia, Ado, Jason), each with their persona prompt and evaluation criteria
- All 6 agents evaluate the project independently and in parallel
- Agents can challenge each other's conclusions via peer-to-peer messaging (debate mode)
- After all agents complete, the Synthesis agent merges findings into a unified report
- Results written to `.boardclaude/audits/audit-{timestamp}.json` and `.md`

**Secondary flows:**
- Template panel debate (e.g., personal-oscar template with configurable agents)
- Fork/compare: spawn agents on different git worktree branches, compare outcomes
- Code review panels: specialized agents for security, performance, accessibility, docs

## Architecture Patterns

**Team structure:**
- **Team Lead**: Main Claude Code session. Creates team, assigns tasks, synthesizes results. Should NOT implement — tell it "Wait for teammates to complete."
- **Teammates**: Work independently, each in own context window. Can message each other directly (peer-to-peer).
- **Shared task list**: Tasks with dependencies. Auto-unblock when dependencies complete.

**Display modes:**
- **In-process** (default): All in main terminal. `Shift+Up/Down` to select teammates.
- **Split panes**: Each gets own pane via tmux or iTerm2. See all agents simultaneously.
- **Delegate mode** (`Shift+Tab`): Restricts lead to coordination-only tools.

**What teammates inherit:** CLAUDE.md, MCP servers, skills — automatically. They do NOT inherit the lead's conversation history. Include task-specific details in each spawn prompt.

**Spawn template for hackathon judges panel:**
```
Create an agent team to evaluate this codebase from 6 different perspectives:
1. Agent Boris — Architecture & verification specialist
2. Agent Cat — Product & user impact evaluator
3. Agent Thariq — AI innovation & model usage reviewer
4. Agent Lydia — Frontend/DX & code quality auditor
5. Agent Ado — Documentation & accessibility reviewer
6. Agent Jason — Community impact & integration evaluator

Each agent should:
- Read their persona from .boardclaude/agents/{name}.yaml
- Read the panel config from .boardclaude/panels/hackathon-judges.yaml
- Independently evaluate the project against their criteria
- Score each criterion on a 0-10 scale with evidence and recommendations
- Report findings as structured JSON

Wait for ALL agents to complete before synthesizing.
Do NOT implement anything yourself — only coordinate.
```

**Best practices:**
- Include full task context in each teammate's spawn prompt (don't assume shared context)
- Use specific decomposition: each agent owns one clear evaluation perspective
- Require plan approval before implementation for risky tasks
- The more specific the brief, the better the output
- Have teammates "challenge each other's conclusions" for debate mode

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

## Judge Alignment

- **Boris**: Agent Teams is his daily workflow (10-15 concurrent sessions). Parallel orchestration with specialized roles directly mirrors his philosophy. He will evaluate whether the team coordination is elegant or over-engineered.
- **Cat**: Multi-agent workflows are her sweet spot (runs 3 Claude instances simultaneously). She championed extensibility and will look for whether the team spawn is hackable/configurable.
- **Thariq**: Authored the Agent SDK blog post and led the SDK workshop. Agent Teams is the headline Opus 4.6 feature he helped ship. Novel orchestration patterns will resonate strongly — this is the "Most Creative Opus 4.6 Exploration" prize target.
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
