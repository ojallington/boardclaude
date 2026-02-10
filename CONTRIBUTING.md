# Contributing to BoardClaude

Thanks for your interest in contributing! BoardClaude is a Claude Code plugin for multi-perspective project evaluation.

## Setup

```bash
git clone https://github.com/ojallington/boardclaude.git
cd boardclaude

# Dashboard (Next.js 15)
cd dashboard
npm install
npm run dev        # http://localhost:3000

# Run checks
npm run typecheck  # TypeScript strict mode
npm run lint       # ESLint
npm run test       # Vitest
```

## Development Workflow

1. **Fork** the repo and create a branch from `main`
2. **Make changes** -- follow existing patterns (see CLAUDE.md for conventions)
3. **Run checks**: `npm run typecheck && npm run lint && npm run test`
4. **Format**: Prettier runs automatically via PostToolUse hooks, or run manually with `npx prettier --write .`
5. **Commit** using [conventional commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
6. **Open a PR** against `main` with a clear description

## How to Add a New Agent

1. Create `agents/your-agent.md` with the persona frontmatter and evaluation instructions
2. Add the agent to your panel YAML in `panels/` with weight, model, and criteria
3. The agent will be spawned automatically during `/bc:audit`

## How to Create a Panel Template

1. Create `panels/templates/your-panel.yaml` following the schema in `panels/hackathon-judges.yaml`
2. Define agents (with `prompt_file` references), weights (must sum to 1.0), and scoring config
3. Test with `/bc:audit --panel your-panel`

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `agents/` | Agent persona markdown files |
| `commands/` | Slash command definitions |
| `skills/` | Skill implementations (SKILL.md) |
| `panels/` | Panel YAML configurations |
| `dashboard/` | Next.js 15 web app |
| `dashboard/src/lib/types.ts` | Canonical TypeScript interfaces |
| `.boardclaude/` | Runtime state (gitignored) |

## Code Style

- **TypeScript**: Strict mode, no `any` types, explicit return types on exports
- **React**: Server Components by default, `"use client"` only for interactivity
- **Naming**: kebab-case files, PascalCase components, camelCase functions
- **Tests**: Vitest, co-located in `__tests__/` directories

## Questions?

Open an issue or start a discussion on GitHub.
