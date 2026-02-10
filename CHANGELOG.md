# Changelog

All notable changes to BoardClaude will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Locale-aware date formatting (replaces hardcoded en-US)
- ScoreProgression component tests
- CHANGELOG.md

### Changed

- Error boundary strings moved to centralized messages.ts
- RadarChart and ScoreProgression lazy-loaded with `next/dynamic`
- Shared ui-constants.ts replaces duplicated style maps

## [0.3.0] - 2026-02-11

### Added

- `install.sh` one-command installer script
- Runtime validation for ProjectState, Timeline, ActionItemsLedger loaders
- Agent-level validation in `validate.ts` (one_line, action_items, scores)

### Changed

- Landing page install section synced with README install flow
- All 5 data loaders now validate JSON before entering the type system

### Fixed

- `noUncheckedIndexedAccess` and `noImplicitReturns` enabled; 4 type errors resolved

## [0.2.0] - 2026-02-10

### Added

- Full audit detail page with RadarChart, ScoreProgression, AgentCard grid
- Error boundaries (`error.tsx`, `loading.tsx`, `not-found.tsx`) for all routes
- 13 component tests (AgentCard, RadarChart)
- Runtime validation via `parseSynthesisReport` in audit loader
- MIT LICENSE file

### Changed

- `results/page.tsx` wired to real audit data via `getAllAuditSummaries()`
- Prettier compliance raised to 100%

## [0.1.0] - 2026-02-10

### Added

- Initial release of BoardClaude plugin
- 6 judge agents: Boris, Cat, Thariq, Lydia, Ado, Jason
- 7 slash commands: `/bc:audit`, `/bc:init`, `/bc:fix`, `/bc:review`, `/bc:fork`, `/bc:compare`, `/bc:merge`
- Hackathon judges panel (`panels/hackathon-judges.yaml`)
- Next.js 15 dashboard with landing page and results listing
- TypeScript strict mode with canonical type definitions
- CI pipeline: tsc, eslint, prettier, vitest, next build
