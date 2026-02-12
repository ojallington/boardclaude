# BoardClaude Quick Start

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- Node.js 20+ (for the web dashboard)
- Git

## Install

```bash
# 1. Clone the repository
git clone https://github.com/ojallington/boardclaude.git

# 2. Install into your project
./boardclaude/install.sh your-project/

# 3. Verify the plugin is detected
cd your-project
claude /bc:init
```

## Run Your First Audit

```bash
# Run a full panel audit (6 agents score your project in parallel)
claude /bc:audit

# Review the output -- you will see a composite score and per-agent breakdown
# Example: Composite: 68.4 / 100 (C+, MARGINAL)
```

## Fix the Top Issues

```bash
# Implement the 3 highest-priority action items, then validate
claude /bc:fix --max 3

# Re-audit to measure improvement
claude /bc:audit
```

## Open the Dashboard

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3000 to view radar charts, agent cards, and score history
```

## Next Steps

- Create a custom panel: see [custom-agent.md](custom-agent.md)
- Review the panel YAML format: see [minimal-panel.yaml](minimal-panel.yaml)
- Browse a full audit result: see [audit-example.json](audit-example.json)
