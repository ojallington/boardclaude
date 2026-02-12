# BoardClaude Dashboard

The web frontend for [BoardClaude](../README.md), a Claude Code plugin for multi-agent project evaluation. The dashboard provides audit visualization with per-agent scoring and radar charts, a "Try It" feature for instant 6-agent GitHub repo reviews, and panel template management.

## Prerequisites

- Node.js 20+
- npm

## Getting Started

```bash
cd dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | For "Try It" feature | Powers the free-tier 6-agent reviews |

BYOK users provide their own key at runtime. No environment variable is needed for basic dashboard viewing.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run typecheck` | Run TypeScript compiler check |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm test` | Run Vitest test suite |

## Project Structure

```
src/
  app/           # Next.js App Router pages
  components/    # React components
  hooks/         # Custom hooks
  lib/           # Utilities, types, validation
data/            # Audit JSON files, state, timeline
```

## Tech Stack

- Next.js 15 (App Router, Server Components)
- React 19, TypeScript strict mode
- Tailwind CSS v4
- Framer Motion for animations
- Recharts for data visualization
- Vitest for testing

## Deployment

Deployed to Vercel. Auto-deploys from the `main` branch with root directory set to `dashboard/`.

Live at [boardclaude.com](https://boardclaude.com).
