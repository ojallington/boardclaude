# /bc:init -- BoardClaude Setup Wizard

Initialize BoardClaude for the current project. Creates the directory structure,
lets the user choose or customize a panel, and optionally runs a baseline audit.

## Usage

```
/bc:init [--template <name>] [--skip-audit]
```

## Parameters

- `$ARGUMENTS` -- Optional: template name or flags
- `--template <name>` -- Start from a pre-built template: hackathon-judges, code-review, personal-shipper, startup-pitch
- `--skip-audit` -- Skip the initial baseline audit after setup
- `--custom` -- Build a panel from scratch interactively

## Execution Steps

1. **Check existing setup**: Look for `.boardclaude/` directory. If it already exists, ask the user:
   - "BoardClaude is already initialized. Reset and start fresh, or add a new panel?"
   - If reset: back up existing state.json and timeline.json before overwriting

2. **Create directory structure**:
   ```
   .boardclaude/
   ├── state.json          # Project state and audit history
   ├── timeline.json       # Append-only event log
   └── audits/             # Generated audit reports
   ```

3. **Choose panel configuration**:

   If `--template` is specified, copy the matching template from `panels/templates/`:
   - `code-review` -- 3 agents: Architect, Nitpicker, User Advocate
   - `personal-shipper` -- 4 agents: Shipper, Strategist, Realist, Visionary (prompts user to fill in context)
   - `startup-pitch` -- 3 agents: Technical VC, Market VC, Operator VC
   - `hackathon-judges` -- 6 agents: Boris, Cat, Thariq, Lydia, Ado, Jason

   If `--custom` is specified, walk the user through interactive panel creation:
   a. "What type of panel? (professional / personal)"
   b. "How many agents? (2-8 recommended)"
   c. For each agent:
      - "Agent name:"
      - "Agent role (one-line description):"
      - "What should this agent evaluate? (list criteria)"
      - "Agent weight (0.0-1.0, must sum to 1.0 across all agents):"
      - "Does this agent have veto power? (yes/no)"
   d. If personal panel:
      - "What are your goals?"
      - "What are your constraints?"
      - "What are your known weaknesses/patterns?"
      - "What does 'done' look like for your current project?"
   e. Generate the panel YAML and save to `.boardclaude/panels/`

   If no flag specified, show the menu:
   - "Choose a panel template or create custom:"
   - List available templates with descriptions
   - Option to create custom

4. **Initialize state.json**:
   ```json
   {
     "project": "<directory name>",
     "panel": "<chosen panel name>",
     "branch": "<current git branch or 'main'>",
     "audit_count": 0,
     "latest_audit": null,
     "latest_score": null,
     "score_history": [],
     "worktrees": [],
     "status": "initialized"
   }
   ```

5. **Initialize timeline.json**:
   ```json
   {
     "events": [
       {
         "type": "init",
         "timestamp": "<ISO 8601>",
         "branch": "<current branch>",
         "panel": "<chosen panel>",
         "template": "<template name or 'custom'>"
       }
     ]
   }
   ```

6. **For personal-shipper template**: After copying, guide the user through customizing the context section:
   - Replace all "REPLACE:" placeholders with their actual goals, constraints, patterns
   - Validate that definition_of_done has at least 3 concrete items
   - Confirm the agent weights sum to 1.0

7. **Run baseline audit** (unless `--skip-audit`):
   - Run `/bc:audit --effort low` to establish a baseline score
   - Display: "Baseline established. Score: X/100. Run /bc:audit to get a full evaluation."

8. **Display setup summary**:
   - Panel name and agent count
   - Panel file location
   - State file location
   - Available commands: /bc:audit, /bc:fork, /bc:compare, /bc:merge, /bc:review
   - If baseline was run, show the score

## Notes

- The init wizard is designed to be completed in under 2 minutes for templates
- Custom panel creation takes 5-10 minutes depending on agent count
- Personal panels require the most setup but provide the most value
- All state files are designed to be git-tracked (commit .boardclaude/ to share with team)
- The audits/ subdirectory can be gitignored if reports shouldn't be in version control
- When running as an installed plugin (not co-located), agent prompt_files in panel YAMLs resolve relative to the plugin installation directory. Custom panels created via `--custom` store agents in `.boardclaude/agents/` within the user's project.

$ARGUMENTS
