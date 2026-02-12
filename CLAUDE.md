# BoardClaude

Claude Code plugin: configurable AI agent panels for multi-perspective project evaluation.

## Architecture

- Plugin: `.claude-plugin/plugin.json`, `agents/`, `commands/`, `skills/`, `hooks/`
- Dashboard: Next.js 15 App Router in `dashboard/`
- State: `.boardclaude/` (tracked in git; synced to `dashboard/data/` at build time)
- Panels: `panels/*.yaml` define agent configurations
- Reference: `context/` -- consolidated research docs (see below)

## Commands

- `/bc:audit [target]` -- Run full panel audit (Agent Teams, 6 judges + synthesis)
- `/bc:init` -- Setup wizard, choose template or create custom panel
- `/bc:fork [name]` -- Create strategy branch via git worktree
- `/bc:compare [a] [b]` -- Side-by-side branch or audit comparison
- `/bc:merge [branch]` -- Integrate winning branch, archive losers
- `/bc:review [agent] [target]` -- Quick single-agent review (subagent, no debate)
- `/bc:fix [--max N]` -- Implement top-N audit action items, validate, re-audit

## Coding Conventions

- TypeScript strict mode. No `any`. No `as unknown as X`.
- React: Function components, hooks only. No class components.
- Server Components by default, `'use client'` only when needed.
- Tailwind v4 for styling. No CSS modules, no styled-components.
- Use `interface` not `type` for object shapes.
- Prefer named exports (except `page.tsx`).
- Imports: absolute from `@/` alias. Group: react, next, external, internal.
- Test with `npm run typecheck && npm run lint` before committing.
- Run `npm run format` in `dashboard/` before committing to avoid CI failures. A pre-commit hook enforces this.

## Agent System

- 6 judge agents + 1 synthesis agent per evaluation panel
- Each agent has: persona prompt (`.md`), evaluation criteria, weighted scoring
- Model routing: Opus for Boris/Cat/Thariq/Lydia, Sonnet for Ado/Jason/Synthesis
- Agent Teams for parallel evaluation with debate capability
- Subagents for single-agent tasks (`/bc:review`) and synthesis
- Personal panels available as templates (e.g., `panels/templates/personal-oscar.yaml`)

## Build Strategy

Milestone-based, continuous agent-team execution across parallel tracks.

### Parallel Tracks

| Track | Focus | Key Deliverables |
|-------|-------|-----------------|
| A: Core Engineering | /bc:audit, /bc:fix, validation, /bc:init, packaging | Working plugin commands |
| B: Dashboard | Next.js components, charts, timeline, polish | Visual audit display |
| C: Self-Improvement | Audit-fix-re-audit cycles | Demo data, score progression |
| D: Demo Production | Script, recording, editing (starts at M5) | 3:10 demo video |

### Milestones

- **M1 (0-6h):** First Audit — `/bc:audit` produces valid JSON, Agent Teams stable
- **M2 (6-18h):** Closed Loop — `/bc:fix` working, validation gates active
- **M3 (18-36h):** Dashboard MVP — AgentCards + RadarChart rendering real data
- **M4 (36-52h):** Self-Improvement Proof — 3+ audit cycles, composite 85+
- **M5 (52-72h):** Framework + Polish — Templates, plugin installable, README
- **M6 (72-84h):** Demo Ready — All data cached, video script rehearsed
- **M7 (84-100h):** Public Launch — Video, GitHub release, community posts, deployed to boardclaude.com

### Focus Rule

If it doesn't advance the current milestone, it goes in BACKLOG.md.

## Tool Strategy

- validation-runner provides real data (types, tests, lint) to agents before evaluation
- Boris and Thariq have WebSearch access for researching evaluated projects
- Playwright MCP available for visual/accessibility testing (M4+)
- All tool failures degrade gracefully -- agents proceed with reduced confidence
- See `context/features/tool-use-strategy.md` for full tool capability matrix

## Common Mistakes

- Don't put components in `.claude-plugin/` -- only `plugin.json` goes there
- Panel agent weights must sum to 1.0
- Audit JSON must match TypeScript types in `dashboard/src/lib/types.ts`
- Always run prettier after editing dashboard files
- Check `.boardclaude/` exists before writing state
- Don't use `useEffect` for data fetching -- use server components
- Don't use index as key in lists with dynamic content
- Don't import from `recharts` without checking the component exists

## Design System

Agent colors: Boris=#3b82f6 (blue), Cat=#8b5cf6 (violet), Thariq=#06b6d4 (cyan),
Lydia=#f59e0b (amber), Ado=#10b981 (emerald), Jason=#ef4444 (red), Synthesis=#6366f1 (indigo)

Dark mode default. Inter font (via next/font). Framer Motion for animations.
Cards: subtle colored left border matching agent. Rounded-lg default, rounded-xl for cards.

## File Naming

- Components: PascalCase (`AgentCard.tsx`)
- Utilities: camelCase (`parseAudit.ts`)
- Commands/agents: kebab-case (`audit.md`, `boris.md`)
- Panels: kebab-case (`hackathon-judges.yaml`)

## Context Reference Library

`context/` has 24 reference docs. Do NOT load all at once -- pick files relevant to the current task.

| Task | Load |
|------|------|
| Writing/modifying agent personas | `context/judges/<name>.md` for that judge |
| Implementing Opus 4.6 features | `context/features/<feature>.md` |
| Tool use, MCP integration, agent tools | `context/features/tool-use-strategy.md` |
| Dashboard UI development | `context/stack/*.md` |
| Architecture decisions or refactors | `context/architecture/decisions.md` |
| Defining TypeScript types or schemas | `context/architecture/schemas.md` |
| Understanding audit/fork/merge flows | `context/architecture/data-flow.md` |
| Implementation loop, fix pipeline, action items | `context/architecture/implementation-loop.md` |
| Submission, demo prep, or prize strategy | `context/strategy/*.md` |
| Web frontend, Agent SDK backend, board builder | `context/strategy/web-frontend-vision.md` |

Full index with judge-topic cross-reference: `context/README.md`

## Git Workflow

- `main` = stable. Tag releases (`v0.1.0`, `v0.2.0`, etc.)
- Feature branches: `feat/description`
- Worktree branches: `bc/strategy-name` (created by `/bc:fork`)
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
