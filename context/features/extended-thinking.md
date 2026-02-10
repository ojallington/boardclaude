# Extended Thinking — BoardClaude Implementation Guide

## What It Is

Extended thinking gives Opus 4.6 a dedicated "thinking" budget where the model reasons through complex problems before responding. The default budget is 31,999 tokens. Opus 4.6 also introduces adaptive thinking — the model dynamically decides when and how much to think based on task difficulty, replacing the previous binary on/off toggle. This is the core capability targeted by the "Keep Thinking Prize" ($5,000).

## How to Enable

**Settings-based configuration (recommended):**
```json
// .claude/settings.json
{
  "env": {
    "MAX_THINKING_TOKENS": "31999"
  },
  "alwaysThinkingEnabled": true
}
```

**Keyword triggers (deprecated Jan 16, 2026 — may still work):**
- `"think"` — ~4,000 token thinking budget
- `"think hard"` / `"megathink"` — ~10,000 token budget
- `"think harder"` / `"ultrathink"` — ~31,999 token budget (maximum)

**In skills:** Include "ultrathink" anywhere in SKILL.md content to enable max thinking for that skill.

**Effort levels via `/effort` command:**
- `low` — Minimal thinking, fastest response
- `medium` — Balanced thinking/speed
- `high` — Thorough reasoning
- `max` — Absolute highest capability, full thinking budget

**API-level configuration:**
```json
{
  "thinking": {
    "type": "adaptive"
  }
}
```
Adaptive thinking is the recommended mode — the model decides when and how deeply to think based on task complexity.

## How BoardClaude Uses It

**Model routing by agent role:**

| Agent | Model | Effort | Thinking Budget | Rationale |
|-------|-------|--------|-----------------|-----------|
| Boris | Opus | max | 31,999 | Architecture analysis requires deep multi-step reasoning |
| Cat | Opus | high | ~20,000 | Product evaluation needs nuance but less raw depth |
| Thariq | Opus | max | 31,999 | Innovation assessment involves complex comparative reasoning |
| Lydia | Opus | high | ~20,000 | Code quality review benefits from thorough analysis |
| Ado | Sonnet | medium | ~8,000 | Documentation review is more checklist-oriented |
| Jason | Sonnet | medium | ~8,000 | Community impact and integration checks are structured |
| Synthesis | Sonnet | medium | ~8,000 | Aggregation, not original deep reasoning |

**Specific flows:**
- `audit-runner` skill includes "ultrathink" in SKILL.md to ensure max thinking during evaluation
- Boris and Thariq agents explicitly instructed to "think deeply" about architecture and innovation
- Synthesis agent uses medium effort — it aggregates, not originates
- Template panels (e.g., personal-oscar) default to Sonnet with medium effort for cost savings

## Architecture Patterns

**Adaptive thinking for task routing:**
- Complex evaluation tasks (scoring, evidence gathering, cross-referencing) get max effort
- Simple tasks (formatting output, reading configs, file operations) get low effort
- Let the model decide via adaptive mode when effort level is ambiguous

**Thinking in Agent Teams context:**
- Each teammate manages its own thinking budget independently
- The lead should use high effort for synthesis/coordination
- Teammates use the effort level specified in their agent config

**Skill-level thinking control:**
- Place "ultrathink" keyword in any SKILL.md to activate max thinking for that skill
- This is the recommended pattern for BoardClaude's audit-runner skill
- Other skills (persona-builder, timeline-manager) use default thinking

## Known Limitations

- Thinking tokens are invisible to the user — you see the output, not the reasoning chain
- Cannot inspect or debug what the model "thought about"
- Keyword triggers are officially deprecated; rely on settings for production use
- Adaptive thinking may under-think on tasks that seem simple but are actually complex
- No per-agent thinking budget control in Agent Teams — each agent uses its own session settings

## Cost Implications

**Thinking tokens are billed as output tokens:**
- Opus output: $75/M tokens
- 31,999 thinking tokens per invocation: ~$2.40
- Sonnet output: significantly cheaper (~$15/M tokens)
- 31,999 thinking tokens on Sonnet: ~$0.48

**Per-audit cost estimate (thinking tokens only):**
- 4 Opus agents at max effort: 4 x $2.40 = $9.60
- 2 Sonnet agents at medium effort: 2 x $0.12 = $0.24
- 1 Sonnet synthesis at medium: $0.12
- **Total thinking cost per audit: ~$10**

**Optimization strategies:**
- Route formulaic agents (Ado, Jason, Synthesis) to Sonnet — saves ~70% on those agents
- Use adaptive thinking to avoid wasting budget on simple subtasks
- Template panels always use Sonnet — acceptable quality at fraction of cost
- Budget for ~20-30 full audits across the hackathon week with $500 credits

## Judge Alignment

- **"Keep Thinking" Prize ($5,000)**: This prize explicitly rewards best use of extended/adaptive thinking. BoardClaude's model routing (max effort for complex agents, medium for formulaic) demonstrates intelligent thinking allocation.
- **Boris**: Values verification loops and deep reasoning. Max-effort thinking on architecture evaluation aligns with his 2-3x quality improvement claim for feedback loops.
- **Thariq**: Interested in adaptive thinking as a novel Opus 4.6 capability. Demonstrating effort-level routing across agents shows sophisticated model utilization.
- **Cat**: Cares about the practical result — extended thinking should produce noticeably better evaluations, not just burn tokens.
- **Lydia**: Will evaluate whether the thinking actually translates into higher-quality code analysis.

## Quick Reference

```json
// Enable max thinking in .claude/settings.json
{
  "env": {
    "MAX_THINKING_TOKENS": "31999"
  },
  "alwaysThinkingEnabled": true
}
```

**Effort levels:** `/effort low` | `/effort medium` | `/effort high` | `/effort max`

**In skills:** Add "ultrathink" to SKILL.md content to activate max thinking.

**API mode:** `"thinking": {"type": "adaptive"}` — model auto-calibrates depth.

**Cost rule of thumb:** 31,999 Opus thinking tokens = ~$2.40 per invocation.
