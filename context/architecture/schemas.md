# Unified Schema Reference

> Single canonical reference for every data structure in BoardClaude.
> Schemas marked **CANONICAL** come from `prep-kit/skills/audit-runner/SKILL.md` and are the source of truth.
> Schemas marked **DERIVED** are distilled from handoff and companion docs.

---

## 1. Plugin Manifest -- `plugin.json`

**Source**: boardclaude-claude-code-handoff.md section 3.1
**Location**: `.claude-plugin/plugin.json`
**Status**: DERIVED

```json
{
  "name": "boardclaude",                // Plugin identifier (lowercase, no spaces)
  "version": "1.0.0",                   // Semver
  "description": "Configurable AI agent panels that evaluate projects from multiple expert perspectives. Triggers: board, panel, audit, evaluate, review, score, judge.",
  "author": {
    "name": "Your Name",                 // Builder name
    "url": "https://boardclaude.com"    // Homepage
  },
  "homepage": "https://boardclaude.com",
  "repository": "https://github.com/USERNAME/boardclaude",
  "license": "MIT",
  "keywords": ["evaluation", "code-review", "multi-agent", "panels", "audit"],
  "commands": "./commands/",            // Directory of slash command .md files
  "agents": "./agents/",               // Directory of subagent .md files
  "skills": [                           // Array of skill directory paths
    "./skills/audit-runner",
    "./skills/persona-builder",
    "./skills/timeline-manager"
  ],
  "hooks": "./hooks/hooks.json"         // Hook configuration file
}
```

**Key rules**:
- Only `plugin.json` goes inside `.claude-plugin/`
- Commands, agents, skills, hooks are at the plugin ROOT
- Plugin name becomes the namespace prefix: `/boardclaude:audit`

---

## 2. Panel YAML Schema

**Source**: boardclaude-day0-prep.md section 6
**Location**: `panels/*.yaml`
**Status**: DERIVED

```yaml
# BoardClaude Panel Configuration Schema v1.0

name: string                      # Display name (e.g., "hackathon-judges")
type: "professional"              # Evaluation mode ("personal" only in template panels)
version: string                   # Semver (e.g., "1.0.0")
description: string               # What this panel evaluates

# Only for template panels (e.g., personal-oscar). Not used in hackathon-judges.
context:
  goals: string[]                 # User's stated goals
  constraints: string[]           # Time, budget, energy limits
  patterns:
    strengths: string[]           # Known positive patterns
    weaknesses: string[]          # Known failure modes
    triggers: string[]            # Signals of scope creep, etc.
  definition_of_done: string[]    # Concrete shipping criteria

# Agent definitions -- weights MUST sum to 1.0
agents:
  - name: string                  # Display name (e.g., "boris")
    role: string                  # One-line role description
    weight: number                # 0.0-1.0, contribution to composite score
    model: string                 # "opus" | "sonnet" (optional, default: opus)
    effort: string                # "low" | "medium" | "high" | "max" (optional)
    # veto_power: boolean         # Deprecated — only in template panels
    prompt_file: string           # Path to agent .md file (e.g., "agents/boris.md")
    criteria:                     # Structured evaluation criteria (optional)
      - name: string              # Criterion name (e.g., "architecture")
        weight: number            # 0.0-1.0, within this agent, must sum to 1.0
        description: string       # What this criterion measures (optional)

# Only for template panels with multi-round debate (e.g., personal-oscar)
debate:
  rounds: number                  # Number of debate rounds (default: 1)
  format: string                  # "sequential" | "parallel"
  verdict_options:                # Possible panel verdicts
    - "SHIP"
    - "CONTINUE"
    - "PIVOT"
    - "PAUSE"
  final_output: string            # What synthesis should produce

# Scoring thresholds
scoring:
  scale: number                   # Max score (default: 100)
  passing_threshold: number       # Minimum composite for PASS (default: 70)
  iteration_target: number        # Target for re-audit loop (default: 85)
```

---

## 3. Agent Evaluation Schema (Per-Agent Output)

**Source**: prep-kit/skills/audit-runner/SKILL.md
**Status**: CANONICAL

Each panel agent must produce JSON in exactly this format:

```json
{
  "agent": "<agent name>",             // Matches panel YAML agent name
  "scores": {
    "<criterion_1>": 0,                // 0-100, criterion names from panel config
    "<criterion_2>": 0,                //   e.g., "architecture": 82
    "<criterion_3>": 0,                //   e.g., "verification": 75
    "<criterion_4>": 0                 //   e.g., "compound_learning": 68
  },
  "composite": 0,                      // Weighted average of scores (using criterion weights)
  "strengths": [                       // Exactly 3, ordered by significance
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "weaknesses": [                      // Exactly 3, ordered by severity
    "<weakness 1>",
    "<weakness 2>",
    "<weakness 3>"
  ],
  "critical_issues": [                 // Blocking issues only (may be empty array)
    "<blocking issue if any>"
  ],
  "action_items": [                    // Prioritized, specific, with file/line refs
    {
      "priority": 1,                   // 1 = highest priority
      "action": "<specific action with file/line references>",
      "impact": "<expected improvement>"
    }
  ],
  "verdict": "<STRONG_PASS | PASS | MARGINAL | FAIL>",
  "one_line": "<single sentence summary>"
}
```

**Verdict thresholds** (from SKILL.md scoring section):
- `STRONG_PASS`: composite >= 85
- `PASS`: composite >= 70
- `MARGINAL`: composite >= 55
- `FAIL`: composite < 55

---

## 4. Synthesis Output Schema (Full Audit Report)

**Source**: prep-kit/skills/audit-runner/SKILL.md
**Status**: CANONICAL

The synthesis agent merges all agent evaluations into this format:

```json
{
  "audit_id": "audit-{timestamp}",     // e.g., "audit-20260212-143022"
  "panel": "<panel name>",             // e.g., "hackathon-judges"
  "target": "<what was evaluated>",    // e.g., "boardclaude" or repo URL
  "iteration": 0,                      // 0-based audit cycle number
  "timestamp": "<ISO 8601>",           // e.g., "2026-02-12T14:30:22Z"

  "agents": [                          // One entry per panel agent
    {
      "agent": "<name>",              // e.g., "boris"
      "scores": {                      // Criterion scores from that agent
        "<criterion>": 0
      },
      "composite": 0,                 // Agent's weighted composite
      "strengths": ["..."],
      "weaknesses": ["..."],
      "critical_issues": ["..."],
      "verdict": "<STRONG_PASS | PASS | MARGINAL | FAIL>"
    }
  ],

  "composite": {                       // Panel-level aggregation
    "score": 0,                        // Weighted average across all agents
    "radar": {                         // One axis per evaluation dimension
      "architecture": 0,              // Average across relevant agents
      "product": 0,
      "innovation": 0,
      "code_quality": 0,
      "documentation": 0,
      "integration": 0
    },
    "grade": "<A+ through F>",        // See grade mapping below
    "verdict": "<STRONG_PASS | PASS | MARGINAL | FAIL>"
  },

  "highlights": {
    "top_strengths": [                 // Top 3 across ALL agents
      "<strength with agent attribution>"
    ],
    "top_weaknesses": [                // Top 3 across ALL agents
      "<weakness with agent attribution>"
    ],
    "divergent_opinions": [            // Where agents disagree by 20+ points
      {
        "topic": "<what they disagree on>",
        "agent_a": {
          "agent": "<name>",
          "position": "<view>"
        },
        "agent_b": {
          "agent": "<name>",
          "position": "<view>"
        },
        "analysis": "<why they diverge and who is probably right>"
      }
    ]
  },

  "action_items": [                    // Cross-agent prioritized improvements
    {
      "priority": 1,                   // 1 = highest
      "action": "<specific action>",
      "source_agent": "<who recommended it>",
      "impact": "<expected score improvement>",
      "effort": "<low | medium | high>"
    }
  ],

  "iteration_delta": {                 // Comparison to previous audit
    "previous_score": null,            // null if first audit (iteration 0)
    "current_score": 0,
    "delta": null,                     // null if first audit
    "improvements": ["<what got better>"],
    "regressions": ["<what got worse>"]
  }
}
```

**Grade mapping** (from SKILL.md):

| Range  | Grade |
|--------|-------|
| 95-100 | A+    |
| 90-94  | A     |
| 85-89  | A-    |
| 80-84  | B+    |
| 75-79  | B     |
| 70-74  | B-    |
| 65-69  | C+    |
| 60-64  | C     |
| 55-59  | C-    |
| 50-54  | D     |
| 0-49   | F     |

---

## 5. State File -- `state.json`

**Source**: boardclaude-companion-docs.md, boardclaude-claude-code-handoff.md section 6.3
**Location**: `.boardclaude/state.json`
**Status**: DERIVED

Created by `/bc:init`, updated after each audit.

```json
{
  "project": "<project name>",        // e.g., "boardclaude"
  "panel": "<active panel name>",     // e.g., "hackathon-judges"
  "branch": "<current git branch>",   // e.g., "main"
  "audit_count": 0,                   // Total audits run
  "latest_audit": null,               // Audit ID string or null (e.g., "audit-20260212-143022")
  "latest_score": null,               // Composite score number or null
  "score_history": [],                // Array of composite scores, append-only
  "worktrees": [],                    // Array of active worktree branch names
  "status": "idle"                    // "idle" | "active" | "auditing"
}
```

**Update rules**:
- `audit_count` increments by 1 after each completed audit
- `latest_audit` and `latest_score` overwrite with most recent
- `score_history` is append-only (never remove entries)
- `worktrees` tracks active `/bc:fork` branches, entries removed on merge/abandon
- `status` transitions: `idle` -> `auditing` -> `idle` (or `active` when worktrees exist)

---

## 6. Timeline File -- `timeline.json`

**Source**: boardclaude-companion-docs.md, judgeforge-implementation-spec.md section 4
**Location**: `.boardclaude/timeline.json`
**Status**: DERIVED

Append-only event log that powers the branching timeline visualization.

```json
{
  "events": [
    {
      "id": "evt_001",                // Unique event identifier
      "type": "audit",                // "audit" | "fork" | "merge" | "rollback"
      "timestamp": "<ISO 8601>",
      "branch": "<git branch>",
      "panel": "<panel name>",        // Only for audit events
      "composite_score": 0,           // Only for audit events
      "agent_scores": {               // Only for audit events
        "boris": 0,
        "cat": 0,
        "thariq": 0,
        "lydia": 0,
        "ado": 0,
        "jason": 0
      },
      "parent": null,                 // Event ID of parent event, or null for first
      "status": "completed",          // "completed" | "in-progress"
      "audit_file": "audits/audit-001.json"  // Relative path to audit output
    },
    {
      "id": "evt_002",
      "type": "fork",
      "timestamp": "<ISO 8601>",
      "branch": "<source branch>",
      "new_branches": [               // Branches created by this fork
        "bc/dashboard-recharts",
        "bc/dashboard-d3"
      ],
      "reason": "<hypothesis or rationale>",
      "parent": "evt_001"
    },
    {
      "id": "evt_003",
      "type": "merge",
      "timestamp": "<ISO 8601>",
      "winning_branch": "<branch merged>",
      "losing_branches": [            // Branches archived/abandoned
        "bc/dashboard-d3"
      ],
      "reason": "<rationale with scores>",
      "parent": "evt_002"
    }
  ]
}
```

**Event types**:

| Type     | Required Fields                                        | Description                            |
|----------|-------------------------------------------------------|----------------------------------------|
| audit    | branch, panel, composite_score, agent_scores, audit_file | Completed audit cycle                  |
| fork     | branch (source), new_branches, reason                  | Strategy branch creation               |
| merge    | winning_branch, losing_branches, reason                | Branch integration                     |
| rollback | branch, target_audit_id, reason                        | Revert to previous audit state         |

**Rules**:
- Events are append-only -- never modify or delete
- Every event must have a unique `id`, `type`, `timestamp`, and `parent`
- `parent` creates the tree structure for timeline visualization
- Fork events have multiple children (one per new branch)
- Merge events collapse branches back to main line

---

## 7. Audit Output Files

**Location**: `.boardclaude/audits/`
**Naming**: `audit-{timestamp}.json` and `audit-{timestamp}.md`

Each audit produces two files:
1. **JSON** (machine-readable) -- follows the Synthesis Output Schema (section 4 above)
2. **Markdown** (human-readable) -- summary with agent cards, scores, actions

The JSON file is consumed by the dashboard. The Markdown file is for terminal/GitHub viewing.

**File naming format**: `audit-YYYYMMDD-HHmmss` (e.g., `audit-20260212-143022`)

---

## 8. Agent Persona File Format

**Location**: `agents/*.md`
**Status**: DERIVED

```markdown
---
name: agent-boris                      # System identifier (kebab-case, prefixed)
description: >                         # When Claude should use this agent
  Architecture and verification specialist. Use when running hackathon panel audits.
tools: Read, Grep, Glob, Bash, Task   # Allowed tools
model: opus                            # opus | sonnet | haiku | inherit
skills: audit-runner                   # Auto-load these skills (optional)
---

System prompt goes here.
Includes: philosophy, evaluation criteria with weights, output format, voice description.
```

**Key fields**:
- `name` in frontmatter is the system identifier (e.g., `agent-boris`)
- `name` in panel YAML is the display name (e.g., `boris`)
- `model` determines which Claude model runs this agent
- `tools` restricts which tools the agent can use
- `skills` auto-loads specified skills into the agent context

---

## 9. Skill File Format (SKILL.md)

**Location**: `skills/*/SKILL.md`
**Status**: DERIVED

```markdown
---
name: audit-runner                     # Lowercase, hyphens, max 64 chars
description: >                         # Max 1024 chars, include trigger words
  Run multi-agent panel audits. Triggers on "audit", "evaluate", "review", "score".
allowed-tools: Read, Grep, Glob, Bash, Write, Task
context: fork                          # Run in isolated subagent context
agent: general-purpose                 # Which subagent type to use
disable-model-invocation: false        # false = Claude can auto-invoke
---

# Skill Name -- ultrathink             # "ultrathink" enables 31,999 token thinking

## Steps
[Step-by-step instructions]

## Output Format
[Expected output structure with schemas]
```

**Key rules**:
- Include "ultrathink" anywhere in content for max extended thinking budget (31,999 tokens)
- `context: fork` runs skill in isolated subagent context (protects main conversation)
- Dynamic content with `!` prefix runs shell commands before Claude sees the skill
- All skill descriptions loaded into context -- keep under 15,000 char budget total

---

## 10. Action Items Ledger -- `action-items.json`

**Source**: prep-kit/context/architecture/implementation-loop.md
**Location**: `.boardclaude/action-items.json`
**Status**: DERIVED

Persistent ledger tracking audit action items across iterations. Created by synthesis agent after each audit, updated by `/bc:fix`.

```json
{
  "items": [
    {
      "id": "ai-001",                          // Sequential ID (ai-NNN)
      "source_audit": "audit-20260210-180000", // Which audit created this item
      "source_agent": "boris",                 // Which agent recommended it
      "action": "Add error boundaries to dashboard components",
      "file_refs": [                           // Specific file:line references
        "dashboard/app/layout.tsx:15",
        "dashboard/app/audit/page.tsx:8"
      ],
      "priority": 1,                           // 1 = highest priority
      "effort": "low",                         // "low" | "medium" | "high"
      "status": "open",                        // See lifecycle below
      "resolved_in_audit": null,               // Audit ID where item was resolved (or null)
      "iterations_open": 0,                    // Incremented each audit where item stays open
      "created_at": "2026-02-10T18:00:00Z",
      "updated_at": "2026-02-10T18:00:00Z"
    }
  ],
  "metadata": {
    "total_items": 0,                          // Total items ever created
    "open": 0,                                 // Currently open items
    "resolved": 0,                             // Successfully resolved items
    "chronic": 0                               // Items open 3+ iterations
  }
}
```

**Status lifecycle**:
- `open`: New item from audit, not yet attempted
- `in_progress`: Fix implemented, awaiting re-audit verification
- `resolved`: Re-audit confirmed score improvement
- `wont_fix`: Manually marked by user (disagrees with recommendation)
- `chronic`: Open for 3+ iterations (auto-flagged)
- `blocked`: Fix attempted but validation failed

**Rules**:
- Items are created by the synthesis agent after each audit
- The `/bc:fix` command reads and updates the ledger
- `iterations_open` increments after each audit where the item remains open
- Items with `iterations_open >= 3` are auto-flagged as `chronic`
- `resolved_in_audit` is set when re-audit shows improvement for that item

---

## 11. Validation Results -- `latest.json`

**Source**: prep-kit/skills/validation-runner/SKILL.md
**Location**: `.boardclaude/validation/latest.json`
**Status**: DERIVED

Structured output from the validation-runner skill. Consumed by agents at audit start for data-backed evaluation.

```json
{
  "timestamp": "<ISO 8601>",                   // When validation was run
  "stack": {
    "framework": "next",                       // Detected from package.json
    "language": "typescript"                    // Detected from tsconfig.json
  },
  "typescript": {
    "errors": 0,                               // From npx tsc --noEmit
    "warnings": 0,
    "details": [                               // Up to 10 most severe errors
      {
        "file": "src/app/page.tsx",
        "line": 15,
        "message": "Property 'x' does not exist on type 'Y'"
      }
    ]
  },
  "tests": {
    "total": 0,                                // Total test count
    "passed": 0,
    "failed": 0,
    "coverage": null                           // Percentage if available, null otherwise
  },
  "lint": {
    "errors": 0,                               // From npx next lint or eslint
    "warnings": 0,
    "details": []                              // Up to 10 most severe issues
  },
  "format": {
    "compliant_pct": 0                         // From npx prettier --check
  },
  "lighthouse": {                              // Populated by accessibility-auditor (null until run)
    "performance": null,
    "accessibility": null,
    "best_practices": null,
    "seo": null
  }
}
```

**Rules**:
- `latest.json` is overwritten on each validation run (not append-only)
- Previous results can be compared by reading the timestamp
- `lighthouse` fields are null until accessibility-auditor populates them
- `details` arrays are capped at 10 entries to keep context manageable
- `coverage` is null if no coverage reporter is configured
