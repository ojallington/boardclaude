# Architecture Decision Records (ADRs)

> Canonical reference for all pre-made architecture decisions in BoardClaude.
> Each ADR is sourced from discussions in the handoff document, day-0 prep, and implementation spec.
> Format: lightweight ADR (5-8 lines per decision).

---

## ADR-1: Next.js 15 App Router Over Alternatives

- **Decision**: Use Next.js 15 with App Router for the dashboard
- **Options considered**: Remix, Astro, plain Vite+React, SvelteKit
- **Choice**: Next.js 15 (App Router, RSC, Suspense, streaming SSR)
- **Rationale**: Lydia Hallie co-authored patterns.dev and teaches React/Next.js patterns on Frontend Masters. Using modern patterns (RSC, Suspense boundaries, streaming) demonstrates mastery of what she evaluates. Vercel deployment is zero-config.
- **Judge alignment**: Lydia (patterns, performance, modern React)

---

## ADR-2: TypeScript Strict Mode

- **Decision**: Enable TypeScript strict mode with additional strict flags
- **Options considered**: Standard TypeScript, strict: true only, strict + extras
- **Choice**: Strict mode plus `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`, `exactOptionalPropertyTypes`
- **Rationale**: Lydia advocates strict TypeScript in her Frontend Masters courses. Strict mode signals "this person knows what they're doing." No `any` types anywhere. Type safety is documentation that cannot go stale.
- **Judge alignment**: Lydia (TypeScript strictness, code quality)

---

## ADR-3: Agent Teams vs Subagents (When to Use Which)

- **Decision**: Use Agent Teams for panel audits and personal debates; use Subagents for single-agent tasks and synthesis
- **Options considered**: Agent Teams only, Subagents only, hybrid approach
- **Choice**: Hybrid -- Agent Teams when agents need to debate/share findings; Subagents for independent single-perspective tasks
- **Rationale**: Agent Teams enable cross-examination and peer messaging (critical for debate rounds). Subagents are cheaper, faster, and more reliable for tasks that need no coordination. Synthesis runs as a subagent because it only reads collected results -- no peer interaction needed.
- **Judge alignment**: Thariq (AI innovation, Agent Teams usage), Boris (parallel architecture)

| Use Case                 | Mechanism    | Reason                                   |
|--------------------------|-------------|------------------------------------------|
| Hackathon panel (6 judges) | Agent Teams | Debate, parallel eval, peer messaging    |
| Template panels (e.g., personal-oscar) | Agent Teams | Multi-round debate (template feature) |
| Quick `/bc:review`         | Subagent    | Single perspective, no debate             |
| Synthesis after team       | Subagent    | Merges findings, no peer interaction      |
| Batch evaluation           | Subagents   | Parallel but independent per repo         |

---

## ADR-4: Model Routing -- Opus for 4 Judges, Sonnet for 2 + Synthesis

- **Decision**: Route Boris, Cat, Thariq, and Lydia through Opus 4.6; route Ado, Jason, and Synthesis through Sonnet 4.5
- **Options considered**: All Opus, all Sonnet, mixed routing
- **Choice**: Mixed routing with effort levels calibrated per agent
- **Rationale**: Boris/Cat/Thariq/Lydia require deep reasoning (architecture analysis, product nuance, AI innovation detection, pattern recognition). Ado/Jason perform more structured/formulaic checks (docs completeness, integration checklists). Estimated savings: ~30% vs all-Opus. Template panels (e.g., personal-oscar) default to Sonnet for cost savings.
- **Judge alignment**: Thariq (efficient model usage, cost-aware), Boris (smart resource allocation)

| Agent     | Model      | Effort | Rationale                        |
|-----------|-----------|--------|----------------------------------|
| Boris     | Opus 4.6  | max    | Deep architectural reasoning     |
| Cat       | Opus 4.6  | high   | Product insight requires nuance  |
| Thariq    | Opus 4.6  | max    | AI innovation needs deep thinking|
| Lydia     | Opus 4.6  | high   | Pattern recognition, code analysis|
| Ado       | Sonnet 4.5| medium | Documentation checks are formulaic|
| Jason     | Sonnet 4.5| medium | Integration checks are structured|
| Synthesis | Sonnet 4.5| medium | Merging is mechanical            |

---

## ADR-5: File-Based JSON State Over Database

- **Decision**: Store all runtime state as JSON files in `.boardclaude/`
- **Options considered**: SQLite, PostgreSQL, Redis, file-based JSON
- **Choice**: File-based JSON (`state.json`, `timeline.json`, `audits/*.json`)
- **Rationale**: No database means no setup friction. Audits are files by nature. Git can track config while runtime state stays gitignored. Simplicity serves the 7-day hackathon timeline. A stranger can clone and run without a database server. Zero dependencies.
- **Judge alignment**: Boris (simplicity, "surprisingly vanilla"), Ado (quick setup), Jason (no external dependencies)

---

## ADR-6: Recharts Over D3 for Charting

- **Decision**: Use Recharts for all dashboard visualizations including radar charts
- **Options considered**: D3.js, Recharts, Chart.js, Nivo, Victory
- **Choice**: Recharts -- React-native charting with built-in radar chart support
- **Rationale**: D3 is powerful but a time sink for a hackathon. Recharts has a clean React API, composable components, and a built-in RadarChart. The fork/compare experiment in the implementation spec showed Recharts winning on DX score (Lydia: +15 vs D3). Speed of iteration matters more than chart customization depth.
- **Judge alignment**: Lydia (DX, React patterns), Boris (simplicity over cleverness)

---

## ADR-7: Claude Code Plugin Architecture for Distribution

- **Decision**: Package BoardClaude as a native Claude Code plugin
- **Options considered**: Standalone CLI tool, VS Code extension, npm package, Claude Code plugin
- **Choice**: Claude Code plugin (`.claude-plugin/plugin.json` + `commands/`, `agents/`, `skills/`, `hooks/`)
- **Rationale**: The hackathon IS about Claude Code. A plugin is the native distribution mechanism, gets auto-discovered, and integrates seamlessly. Commands are namespaced (`/bc:audit`), agents are auto-loaded, and skills get model-invoked. The plugin bundles everything into one installable unit.
- **Judge alignment**: Jason (integration, standard interfaces), Boris (Claude Code ecosystem fit), Ado (installable in <5 min)

---

## ADR-8: Tailwind CSS Over CSS-in-JS

- **Decision**: Use Tailwind CSS v4 for all dashboard styling
- **Options considered**: styled-components, CSS modules, Tailwind, vanilla CSS
- **Choice**: Tailwind CSS v4 with utility-first approach
- **Rationale**: No CSS-in-JS runtime overhead. Fast iteration with utility classes. Consistent design system via Tailwind's default scale. Familiar to all judges. Works perfectly with dark mode toggle. No hydration mismatches (a common CSS-in-JS issue with RSC).
- **Judge alignment**: Lydia (performance, no runtime overhead, modern patterns)

---

## ADR-9: Git Worktrees for Fork/Compare Feature

- **Decision**: Use git worktrees for the `/bc:fork` and `/bc:compare` strategy branching system
- **Options considered**: Regular git branches (switch), git worktrees, separate clones
- **Choice**: Git worktrees -- parallel directories sharing one `.git` history
- **Rationale**: Worktrees provide real file isolation without cloning. Each worktree gets its own Claude Code session. Boris uses separate git checkouts for parallel work -- worktrees are the lighter-weight equivalent. The `.boardclaude/` config is copied into each worktree, and worktree paths are gitignored.
- **Judge alignment**: Boris (parallel architecture, separate checkouts), Thariq (parallel agent evaluation)

---

## ADR-10: Dark Mode Default

- **Decision**: Ship with dark mode as the default theme, light mode available via toggle
- **Options considered**: Light mode default, dark mode default, system preference only
- **Choice**: Dark mode default with light mode toggle in the header
- **Rationale**: Matches the Claude Code terminal aesthetic. Developers overwhelmingly prefer dark themes. Radar charts and agent color cards have better visual contrast on dark backgrounds. Light mode still available for accessibility and personal preference.
- **Judge alignment**: Lydia (developer aesthetic, accessibility options), Ado (accessibility)

---

## ADR-11: YAML for Panel Configurations

- **Decision**: Define panel configurations in YAML files
- **Options considered**: JSON, YAML, TOML, TypeScript config files
- **Choice**: YAML (`.yaml` files in `panels/` directory)
- **Rationale**: YAML is human-readable and writable without escaping quotes. Panel configs include multi-line prompt strings which are painful in JSON. YAML supports comments for inline documentation. The Claude Code ecosystem uses YAML frontmatter in agent/skill files, maintaining consistency. Easy to version control and diff.
- **Judge alignment**: Ado (human-readable configs, good DX), Jason (standard format, configuration flexibility)

---

## ADR-12: Framer Motion for Animations

- **Decision**: Use Framer Motion for all dashboard animations
- **Options considered**: CSS transitions, Framer Motion, React Spring, GSAP, no animations
- **Choice**: Framer Motion -- production-grade React animation library
- **Rationale**: Score count-up animations, card entrance effects, radar chart drawing, and streaming audit progress all benefit from declarative animation. Framer Motion integrates with React's component lifecycle and supports `AnimatePresence` for exit animations. CSS transitions alone cannot handle the radar chart fill animation or coordinated card entrances.
- **Judge alignment**: Lydia (production-grade patterns, polished DX)

---

## ADR-13: Action Items Ledger (Persistent JSON)

- **Decision**: Track audit action items in a persistent JSON ledger at `.boardclaude/action-items.json`
- **Options considered**: GitHub Issues, SQLite table, append-only log file, in-memory only
- **Choice**: Persistent JSON file with structured schema (items array + metadata)
- **Rationale**: Lighter weight than GitHub Issues (no API dependency, works offline). Richer than a log file (supports status updates, iteration tracking). Enables the closed-loop pipeline: audit → track → fix → verify → re-audit. Items persist across sessions and accumulate cross-iteration intelligence (chronic item detection).
- **Judge alignment**: Boris (verification loop closure, compound learning), Thariq (self-improving system)

---

## ADR-14: Validation-Runner Integration (Real Tool Output)

- **Decision**: Run actual project validation tools (tsc, jest, eslint, prettier) and feed structured results to agents
- **Options considered**: Grep-based code estimation, LLM-only assessment, manual verification, automated tool output
- **Choice**: Automated validation suite that produces structured JSON consumed by agents at audit start
- **Rationale**: Agents making claims like "the code has good type safety" should be backed by data: "0 type errors across 47 files." Real tool output eliminates opinion-based assessment. The validation-runner runs pre-audit (context) and post-fix (verification), creating a data-backed feedback loop. Boris gets real verification data instead of grep-based estimates. Lydia gets actual type error counts and lint scores.
- **Judge alignment**: Boris (data-backed verification), Lydia (real metrics not guesses), Ado (transparency)

---

## ADR-15: MCP + Web Tools for Agent Evaluation

- **Decision**: Expand agent tool access beyond code reading to include WebSearch, Playwright MCP, and validation tools
- **Options considered**: Read-only agents (pure code analysis), full tool access for all agents, selective tool expansion
- **Choice**: Selective expansion — Boris and Thariq get WebSearch; accessibility-auditor gets Playwright MCP; all agents receive validation-runner data
- **Rationale**: Read-only agents miss important context: community reception, real performance metrics, external best practices. Selective expansion keeps most agents focused (Cat, Lydia, Ado, Jason stay read-only) while giving research-oriented agents (Boris, Thariq) the tools to gather external context. Playwright enables real Lighthouse scores and accessibility audits. Tool failures degrade gracefully — agents proceed with reduced confidence rather than failing.
- **Judge alignment**: Thariq (tool composition, MCP mastery), Ado (transparency, real data), Boris (verification with real tools), Lydia (Lighthouse metrics)
