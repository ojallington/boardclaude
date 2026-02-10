# BoardClaude

**Assemble a board of AI agents that evaluate your project from multiple expert perspectives.**

BoardClaude is a [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin that creates configurable panels of AI evaluator agents. Each agent brings a distinct perspective -- architecture, product, innovation, code quality, documentation, community impact -- and scores your project against weighted criteria. Then it fixes the issues it finds, validates the fixes, and re-audits to prove improvement.

## Features

- **Multi-Agent Evaluation** -- 6 specialized agents score your project in parallel using Agent Teams
- **Closed-Loop Improvement** -- Audit, fix, validate, re-audit. Track score progression across iterations
- **Configurable Panels** -- YAML-defined agent panels. Use built-in templates or create your own
- **Real Validation** -- Agents cite real `tsc`, `jest`, `eslint`, `prettier` output, not opinions
- **Visual Dashboard** -- Web UI with radar charts, agent cards, score progression, timeline visualization
- **Panel Builder** -- No-code web interface to design custom evaluation panels

## Quick Start

### As a Claude Code Plugin

```bash
# In any project with Claude Code installed
/bc:init           # Setup wizard - choose a panel template
/bc:audit          # Run full panel audit (6 agents + synthesis)
/bc:fix            # Implement top action items from audit
/bc:audit          # Re-audit to measure improvement
```

### Available Commands

| Command | Description |
|---------|-------------|
| `/bc:audit [target]` | Run full panel audit with all agents |
| `/bc:init` | Setup wizard, choose template or create custom panel |
| `/bc:fix [--max N]` | Implement top-N audit action items, validate, re-audit |
| `/bc:review [agent] [target]` | Quick single-agent review |
| `/bc:fork [name]` | Create strategy branch via git worktree |
| `/bc:compare [a] [b]` | Side-by-side branch or audit comparison |
| `/bc:merge [branch]` | Integrate winning branch, archive losers |

### Web Dashboard

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3000
```

## Example Output

BoardClaude's first self-audit scored **68.4 / 100 (C+, MARGINAL)** with 6 agents finding real issues:

- **Boris** (Architecture): "Strong architecture with real feedback loops, but zero tests and 20% format compliance"
- **Cat** (Product): "Genuinely novel feedback loop, but adoption path is too steep"
- **Thariq** (AI Innovation): "Smart multi-agent architecture, but emergent behavior is still theoretical"
- **Lydia** (Code Quality): "Clean TypeScript interfaces, but zero test coverage and missing performance optimizations"
- **Ado** (Docs/A11y): "Outstanding README, but not community-ready -- no CONTRIBUTING.md"
- **Jason** (Community): "Strong narrative, but hardcoded English strings limit global reach"

See the full audit JSON: [`examples/audit-example.json`](examples/audit-example.json)

## Architecture

```
boardclaude/
├── .claude-plugin/plugin.json    # Plugin manifest
├── agents/                       # 7 agent persona files
├── commands/                     # 7 slash command definitions
├── skills/                       # 6 skill implementations
├── panels/                       # Panel YAML configurations
│   ├── hackathon-judges.yaml     # Default: 6-agent evaluation panel
│   └── templates/                # Additional panel templates
├── dashboard/                    # Next.js 15 web app
│   ├── src/app/                  # App Router pages
│   ├── src/components/           # React components
│   └── src/lib/types.ts          # Canonical TypeScript interfaces
└── .boardclaude/                 # Runtime state (gitignored)
    ├── state.json                # Project state
    ├── timeline.json             # Event timeline
    ├── action-items.json         # Action item ledger
    └── audits/                   # Audit result files
```

## Panel Agents

The default `hackathon-judges` panel includes 6 specialized agents:

| Agent | Role | Weight | Model |
|-------|------|--------|-------|
| **Boris** | Architecture & Verification | 20% | Opus |
| **Cat** | Product & User Impact | 18% | Opus |
| **Thariq** | AI Innovation & Intelligence | 18% | Opus |
| **Lydia** | Frontend/DX & Code Quality | 18% | Opus |
| **Ado** | DevRel/Docs & Accessibility | 13% | Sonnet |
| **Jason** | Community Impact & Integration | 13% | Sonnet |

## How It Works

1. **Audit** -- Each agent independently evaluates the codebase against their weighted criteria
2. **Synthesize** -- A synthesis agent merges findings, identifies divergent opinions, prioritizes actions
3. **Fix** -- The fix command implements top-priority action items with validation gates
4. **Re-audit** -- A follow-up audit measures improvement and tracks score delta
5. **Iterate** -- Repeat until target score is reached or improvements plateau

## Custom Panels

Create your own evaluation panel with a YAML config:

```yaml
name: my-review-panel
type: professional
version: "1.0.0"
description: "Custom code review panel"

agents:
  - name: security-expert
    role: "Security & Vulnerability Analysis"
    weight: 0.40
    model: opus
    prompt_file: "agents/security.md"
    criteria:
      - name: vulnerability_scan
        weight: 0.50
      - name: auth_review
        weight: 0.50

  - name: perf-analyst
    role: "Performance & Optimization"
    weight: 0.60
    model: sonnet
    prompt_file: "agents/performance.md"
    criteria:
      - name: response_times
        weight: 0.50
      - name: resource_usage
        weight: 0.50

scoring:
  scale: 100
  passing_threshold: 70
  iteration_target: 85
```

## Tech Stack

- **Plugin**: Claude Code Agent Teams, subagent orchestration
- **Dashboard**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Visualization**: Recharts, Framer Motion
- **Deployment**: Vercel

## License

MIT
