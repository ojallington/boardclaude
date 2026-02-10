# BoardClaude Context Folder

Reference material for building BoardClaude during the hackathon. Load specific files into context when working on related features. Do NOT load everything at once -- pick what is relevant to the current task.

## File Index

### judges/ -- Judge Dossier Files
Sourced research on each hackathon judge. Use when writing agent persona prompts, calibrating evaluation criteria, or mapping features to judge values.

| File | When to Reach For This |
|------|----------------------|
| `boris-cherny.md` | Writing Agent Boris prompt, designing verification loops, CLAUDE.md structure, architecture decisions |
| `cat-wu.md` | Writing Agent Cat prompt, extensibility design, SDK usage patterns, onboarding UX, "fun factor" |
| `thariq-shihipar.md` | Writing Agent Thariq prompt, Agent SDK patterns, MCP integration, model routing decisions |
| `lydia-hallie.md` | Writing Agent Lydia prompt, TypeScript config, React patterns, dashboard UI, performance tuning |
| `ado-kukic.md` | Writing Agent Ado prompt, README writing, documentation, security, developer onboarding |
| `jason-bigman.md` | Writing Agent Jason prompt, demo narrative, internationalization, community features |

### features/ -- Opus 4.6 Implementation Guides
Technical guides for each Opus 4.6 capability. Use when implementing specific features.

| File | When to Reach For This |
|------|----------------------|
| `agent-teams.md` | Building the 6-agent parallel evaluation pipeline, team coordination, debate |
| `extended-thinking.md` | Configuring per-agent thinking budgets, adaptive effort, "Keep Thinking Prize" |
| `million-token-context.md` | Full codebase ingestion, context management, MRCR benchmarks |
| `output-and-compaction.md` | 128K output for reports, context compaction, headless mode, git worktrees |
| `error-handling-patterns.md` | Agent timeouts, rate limits, context overflow, partial results, synthesis fallback |
| `tool-use-strategy.md` | When to Reach For This: MCP integration, tool configuration, agent tool permissions, graceful degradation |

### architecture/ -- System Design References
Pre-made architecture decisions and data structures. Use when building core systems.

| File | When to Reach For This |
|------|----------------------|
| `decisions.md` | ADRs for all pre-made choices (stack, agent routing, state, branching). Check before making changes. |
| `data-flow.md` | ASCII diagrams for audit, fork/compare, and implementation loop flows |
| `schemas.md` | Canonical schemas for Panel YAML, Audit JSON, State, Timeline. Source of truth for types. |
| `implementation-loop.md` | When to Reach For This: Implementing fix pipeline, action item tracking, validation gates, closed-loop design |

### stack/ -- Technology Stack References
Patterns and conventions for each technology in the stack. Use when writing dashboard code.

| File | When to Reach For This |
|------|----------------------|
| `nextjs15-patterns.md` | App Router patterns, Server Components, Suspense, streaming, route structure |
| `typescript-strict.md` | tsconfig flags, type patterns, common strict-mode pitfalls |
| `tailwind-recharts-framer.md` | Design system tokens, radar chart setup, animation patterns |

### strategy/ -- Hackathon Strategy
Competitive positioning and prize targeting. Use when writing submission materials or making scope decisions.

| File | When to Reach For This |
|------|----------------------|
| `prize-targeting.md` | Feature-to-prize mapping, what to emphasize in submission for each prize category |
| `competitive-landscape.md` | Differentiation from Compound Engineering Plugin, CodeRabbit, generic AI eval |
| `proof-layer.md` | External validation strategy -- evaluating known projects to calibrate persona accuracy |
| `web-frontend-vision.md` | Dual-runtime architecture (CLI + Web), Agent SDK web backend, no-code board builder UX, Tier 1/2 build plan |

## Judge-Topic Cross-Reference

Which judges care most about which topics. Use for prioritization.

| Topic | Boris | Cat | Thariq | Lydia | Ado | Jason |
|-------|-------|-----|--------|-------|-----|-------|
| Verification loops | **HIGH** | med | med | med | med | low |
| Agent Teams / SDK | **HIGH** | **HIGH** | **HIGH** | low | med | low |
| Extensibility / plugins | med | **HIGH** | med | low | med | med |
| TypeScript / code quality | med | low | low | **HIGH** | low | low |
| Visual polish / UI | low | med | low | **HIGH** | low | med |
| Documentation / README | low | med | low | med | **HIGH** | med |
| Performance / Web Vitals | low | low | low | **HIGH** | low | low |
| Narrative / storytelling | low | med | low | low | med | **HIGH** |
| Community / accessibility | low | med | low | med | med | **HIGH** |
| Internationalization | low | low | low | low | low | **HIGH** |
| Security / error handling | low | low | low | med | med | med |
| Tool use / MCP | med | med | **HIGH** | low | med | low |
| CLAUDE.md / compound learning | **HIGH** | **HIGH** | med | low | med | low |
| Novel AI application | med | med | **HIGH** | low | low | low |
| Product / market fit | med | **HIGH** | **HIGH** | low | low | med |
| Simplicity / elegance | **HIGH** | med | med | med | low | low |
