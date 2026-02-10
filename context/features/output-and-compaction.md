# Output & Compaction — BoardClaude Implementation Guide

## What It Is

Opus 4.6 ships with two complementary capabilities: 128K max output tokens (doubled from 64K) and context compaction (beta). Together, they enable BoardClaude to generate comprehensive evaluation reports in a single response and run long-lived agentic sessions without hitting context limits. Additionally, headless mode and session continuation enable programmatic batch evaluation, and git worktrees enable parallel branch evaluation for the fork/compare feature.

## How to Enable

**128K output tokens:**
```json
// .claude/settings.json
{
  "env": {
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "128000"
  }
}
```
Note: Default is 64K. Set explicitly to 128K for full audit report generation.

**Context compaction (beta):**
- Enabled by default in Claude Code — server-side automatic summarization
- Triggers automatically when context approaches limits
- Manual trigger: `/compact` command

**Headless mode:**
```bash
# Single prompt execution (no interactive terminal)
claude -p "Run the audit on src/" --output-format json

# Session continuation
session_id=$(claude -p "Start review" --output-format json | jq -r '.session_id')
claude --resume "$session_id" -p "Check compliance"
```

**Git worktrees for parallel branches:**
```bash
# Create worktree for strategy branch
git worktree add ../boardclaude-strategy-a -b strategy-a

# List active worktrees
git worktree list

# Remove after merge
git worktree remove ../boardclaude-strategy-a

# Prune stale references
git worktree prune
```

## How BoardClaude Uses It

**128K output — Full audit reports:**
- A complete 6-judge audit with scores, evidence, recommendations, and radar chart data can exceed 50K tokens
- 128K output ensures the synthesis agent can produce the full unified report in one pass
- Eliminates the need to split reports across multiple responses or truncate findings
- Markdown + JSON dual output: `.boardclaude/audits/audit-{timestamp}.md` and `.json`

**Context compaction — Long-running sessions:**
- Multi-audit sessions (iterating on a project across several audit cycles) benefit from compaction
- PreCompact hook fires before compaction — use to preserve: current scores, key findings, iteration count
- Enables "effectively infinite conversations" for long evaluation sessions

**Headless mode — Batch evaluation:**
- Run audits programmatically without interactive terminal
- CI/CD integration: trigger BoardClaude audit on every PR
- Batch evaluation scripts: evaluate multiple projects in sequence
- Session continuation: start an audit, then follow up with targeted deep-dives

**Git worktrees — Fork/compare feature:**
- `/boardclaude:fork` creates a worktree branch for an alternative strategy
- Each worktree gets its own Claude Code session with its own `.boardclaude/` config
- `/boardclaude:compare` runs parallel evaluations on different branches
- After comparison, merge the winning strategy back to main
- `.boardclaude/` config is tracked in git; worktree paths are gitignored

## Architecture Patterns

**Report generation pattern (128K output):**
1. Each judge agent produces a structured JSON evaluation (~5-8K tokens each)
2. Synthesis agent receives all 6 evaluations
3. Synthesis produces unified report in one response: executive summary, per-judge breakdown, radar chart data, prioritized actions, iteration comparison
4. Output written to both JSON (machine-readable) and Markdown (human-readable) formats

**Compaction-aware session design:**
- Structure long sessions as distinct phases: setup, evaluation, synthesis, output
- Use PreCompact hook to snapshot critical state before automatic compaction
- After compaction, re-inject essential context (active panel config, current scores)
- Prefer fresh sessions between full audit runs over relying on compaction

**Headless batch pipeline:**
```
Input: list of project paths
For each project:
  1. claude -p "Load panel config and run full audit" --output-format json
  2. Parse session_id from output
  3. claude --resume "$session_id" -p "Generate comparison report"
  4. Collect results
Output: comparative evaluation across projects
```

**Worktree isolation pattern:**
- Main branch: current project state
- Worktree A: apply strategy-a recommendations from audit
- Worktree B: apply strategy-b recommendations from audit
- Run parallel audits on both worktrees
- Compare scores to determine which strategy improved the project more

## Known Limitations

- 128K output is the hard ceiling — cannot be increased further
- Context compaction summarizes and may lose nuance from earlier conversation turns
- `/compact` is irreversible within a session
- Headless mode does not support Agent Teams (single-agent only)
- Session continuation (`--resume`) does not restore Agent Teams teammates
- Git worktrees share the same git objects — large repos may see disk contention
- Worktree `.boardclaude/` configs must be manually kept in sync if panel configs change

## Cost Implications

**128K output tokens:**
- Opus output: $75/M tokens
- Maximum 128K output: up to $9.60 per response (theoretical max)
- Typical full audit report: ~30-50K output tokens = $2.25-$3.75
- Sonnet output: ~$15/M tokens — synthesis reports at ~$0.45-$0.75

**Context compaction cost savings:**
- Compaction reduces context size, lowering input token costs on subsequent messages
- A session at 800K tokens costs ~$12/message in input; after compaction to 200K, costs ~$3/message
- Net savings compound over long sessions with many turns

**Headless mode efficiency:**
- No interactive overhead — pure input/output token costs
- Batch evaluation amortizes setup costs across multiple projects
- Session continuation avoids re-loading full context from scratch

**Worktree costs:**
- Each worktree audit is a separate session with its own token costs
- Fork/compare with 2 branches: effectively 2x the cost of a single audit
- Use Sonnet for fork/compare evaluations to control costs

## Judge Alignment

- **Boris**: Verification loops and batch automation align with his systematic approach. Headless mode for CI/CD integration shows infrastructure-level thinking he values.
- **Cat**: 128K output enabling comprehensive reports in one pass is the "docs to demos" ethos — produce complete artifacts, not fragments. Worktrees for fork/compare show creative use of Claude Code + git integration.
- **Thariq**: The combination of 128K output + context compaction enables novel long-running agentic workflows that weren't possible before Opus 4.6. This is the "new capability" story he wants to see.
- **Lydia**: Will evaluate whether the output quality justifies the token budget. Clean, well-structured reports demonstrate technical craftsmanship.
- **Ado**: Comprehensive audit reports with iteration tracking show autonomous agentic workflow patterns. Good documentation of the headless/batch pipeline earns points.

## Quick Reference

```json
// Enable 128K output in .claude/settings.json
{
  "env": {
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "128000"
  }
}
```

**Commands:**
```
/compact                                — Manual context compaction
claude -p "prompt" --output-format json — Headless mode
claude --resume "$session_id" -p "msg"  — Session continuation
git worktree add ../branch -b branch   — Create worktree
git worktree list                       — List worktrees
git worktree remove ../branch           — Remove worktree
```

**Key numbers:**
- 128K max output tokens (doubled from 64K)
- Opus output: $75/M tokens (~$9.60 max per response)
- Sonnet output: $15/M tokens (~$1.92 max per response)
- Typical full audit: 30-50K output tokens
- Compaction can reduce context by 60-75%
