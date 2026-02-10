# Million-Token Context — BoardClaude Implementation Guide

## What It Is

Opus 4.6 is the first Opus-class model with a 1 million token context window (beta). This is a qualitative leap: on the MRCR v2 8-needle benchmark at 1M tokens, Opus 4.6 scores 76% versus Sonnet 4.5's 18.5%. This means the model can actually *use* the full context effectively, not just accept it. For BoardClaude, this enables ingesting an entire codebase plus all agent personas plus full audit history into a single evaluation session.

## How to Enable

The 1M context window is enabled by default on Opus 4.6 — no special configuration needed.

**Monitor context usage:**
```
/context    — Check current context usage (percentage and token count)
/compact    — Manually trigger context compaction when nearing limits
```

**Recommended handoff threshold:**
- At ~60% context usage, consider compacting or handing off to a fresh session for complex tasks
- Simple tasks can continue past 60% safely

**MCP server management:**
```json
// Disable unused MCP servers to save context space
// MCP tool definitions consume context tokens even when idle
// Only enable servers actively needed for the current session
```

## How BoardClaude Uses It

**Full codebase ingestion:**
- Load the entire BoardClaude plugin source (commands, skills, agents, panel configs, hooks)
- All 7 agent personas loaded simultaneously for cross-referencing during synthesis
- Complete audit history available for iteration tracking and trend analysis

**Agent Teams context isolation:**
- Each agent teammate gets its own 1M context window (not shared)
- The lead agent can hold the full project context while teammates hold their slice
- Subagents preserve main context — their work stays in their own window, not the lead's

**Evaluation depth enabled by 1M context:**
- Boris agent can see entire architecture + all file relationships + test coverage simultaneously
- Cat agent can evaluate full user journey across all components without truncation
- Synthesis agent can reference every individual agent's full evaluation when merging

**Audit history for self-improvement:**
- Load previous audit JSONs alongside current codebase for iteration comparison
- Track score progression across audits (BoardClaude's score climbed from 44 to 90 over 5 iterations)
- Identify patterns in recurring recommendations

## Architecture Patterns

**Context budget allocation for a full audit:**

| Content | Estimated Tokens | Notes |
|---------|-----------------|-------|
| Codebase (medium project) | 100K-300K | Depends on project size |
| Agent personas (7) | ~15K | ~2K per persona YAML |
| Panel config | ~2K | Active panel YAML |
| Previous audit results | ~20K | Last 2-3 audits for comparison |
| CLAUDE.md + settings | ~3K | Project configuration |
| System prompt + tools | ~50K | MCP definitions, permissions |
| **Available for reasoning** | **~600K-800K** | Ample room for deep analysis |

**Context preservation with PreCompact hook:**
- Fires before automatic compaction occurs
- Use to preserve critical state: current audit progress, agent scores, key findings
- Ensures no loss of evaluation data during long-running sessions

**Subagent strategy for context management:**
- Delegate focused research to subagents (Task tool) to avoid polluting main context
- Each subagent has its own context — their research doesn't consume the lead's window
- Use for: deep-diving into specific files, running focused searches, generating subsections

**When to compact vs. start fresh:**
- Compact: mid-audit when context is growing but evaluation is ongoing
- Fresh session: between full audit runs, or when switching between panels
- Always compact before starting synthesis — synthesis needs clean context for merging

## Known Limitations

- 1M context is in beta — occasional edge cases with very long contexts
- Retrieval quality degrades somewhat past ~800K tokens even with Opus 4.6
- MCP server tool definitions consume context tokens even when servers are idle — disable unused ones
- Context compaction (when triggered) summarizes and may lose nuance in earlier messages
- `/compact` is irreversible — cannot "un-compact" to retrieve original messages
- Token counting is approximate — `/context` gives estimates, not exact counts

## Cost Implications

**Input token pricing:**
- Opus input: $15/M tokens
- A full 1M context session: ~$15 in input tokens alone
- Each subsequent message re-sends the full context

**Optimization strategies:**
- Use subagents for exploratory research (keeps main context lean)
- Compact proactively at ~60% to avoid paying for re-sending bloated context
- Disable unused MCP servers to reclaim ~5-20K tokens per server
- Route agents that don't need full codebase context to Sonnet (cheaper input at $3/M)
- Selective file loading: only ingest files relevant to each agent's evaluation scope

**Budget impact across hackathon:**
- Full codebase audit with 1M context: ~$15-20 in input tokens per run
- With 7 agent teammates each loading context: could multiply to ~$100+ per full team audit
- Plan for 10-15 full team audits with careful context management

## Judge Alignment

- **Boris**: Runs 10-15 concurrent sessions. He understands context management deeply. Efficient use of the 1M window (not wasteful loading) demonstrates systems thinking.
- **Cat**: The 1M context enables her "docs to demos" philosophy — load everything, produce working output. She will notice if the project intelligently uses context vs. just dumping files.
- **Thariq**: 1M context for Opus is a headline Opus 4.6 feature. Using it for something that was genuinely impossible before (full codebase multi-agent evaluation) aligns with the "Most Creative Exploration" prize.
- **Lydia**: Will evaluate whether the large context actually improves output quality vs. smaller focused contexts. Performance-aware.
- **Ado**: Appreciates that full codebase context enables more thorough documentation and accessibility review.

## Quick Reference

```
/context                — Check current context usage
/compact                — Manually trigger compaction
```

**Key numbers:**
- 1M token context window (Opus 4.6 beta)
- 76% on MRCR v2 8-needle 1M benchmark (vs 18.5% Sonnet 4.5)
- Handoff at ~60% for complex tasks
- Input cost: $15/M tokens (Opus), $3/M tokens (Sonnet)

**Context hygiene checklist:**
- Disable unused MCP servers
- Use subagents for exploratory research
- Compact proactively at ~60%
- Load only relevant files per agent scope
- Preserve critical state via PreCompact hook
