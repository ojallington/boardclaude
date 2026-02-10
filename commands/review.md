# /bc:review -- Quick Single-Agent Review

Run a lightweight, single-agent review using one specific agent persona.
Faster and cheaper than a full panel audit. Good for quick feedback on
specific changes or a particular dimension.

## Usage

```
/bc:review [agent-name] [target] [--panel <name>]
```

## Parameters

- `$ARGUMENTS` -- Optional: agent name and/or target path
- `[agent-name]` -- Which agent to use (e.g., `boris`, `lydia`, `The Architect`). If omitted, defaults to a general code review.
- `[target]` -- Specific file or directory to review (default: recent changes or current directory)
- `--panel <name>` -- Load agent definition from a specific panel (default: from state.json or code-review template)

## Execution Steps

1. **Resolve the agent**:
   - If an agent name is provided, look it up in the active panel YAML
   - If the agent name matches an agent in `agents/` directory, use that .md file
   - If no agent specified, use "The Architect" from the code-review panel template
   - Load the agent's persona prompt, criteria, and scoring configuration

2. **Determine review scope**:
   - If a specific file/directory target is given, scope to that
   - If no target, check for recent changes:
     - `git diff --name-only HEAD~1` for recent commits
     - `git diff --name-only` for uncommitted changes
   - If no git or no changes, review the entire current directory

3. **Spawn a single subagent** (NOT an Agent Team -- this is lightweight):
   - Use the resolved agent's persona prompt
   - Include the target files/changes as context
   - Use the agent's configured model (opus or sonnet)
   - Request structured output matching the agent report schema

4. **Run the review**:
   The subagent evaluates the target using the agent's criteria and produces:
   - Per-criterion scores (0-100)
   - Composite score (weighted average)
   - Top strengths with file references
   - Top weaknesses with file references
   - Action items ordered by impact

5. **Display results directly** (no file saving for quick reviews):
   ```
   Quick Review: <agent-name> on <target>
   Score: <composite>/100

   Strengths:
   - <strength 1 with file reference>
   - <strength 2 with file reference>

   Improvements:
   - <weakness 1 with file reference>
   - <weakness 2 with file reference>

   Top Action: <highest priority action item>
   ```

6. **Optionally save** (if `--save` flag is added):
   - Write to `.boardclaude/audits/review-<agent>-{timestamp}.json`
   - Do NOT update state.json or timeline.json (reviews are informal)

## Example Usage

```
/bc:review boris                    # Boris reviews the whole project
/bc:review lydia src/components/    # Lydia reviews the components directory
/bc:review "The Nitpicker"         # Nitpicker from code-review panel
/bc:review                          # Default Architect review of recent changes
/bc:review jason package.json       # Jason reviews integration/config
```

## Agent Quick Reference

From hackathon-judges panel:
- `boris` -- Architecture, verification, compound learning, simplicity
- `cat` -- User value, adoption path, narrative, market fit
- `thariq` -- AI innovation, Opus 4.6 usage, emergent behavior, efficiency
- `lydia` -- Code quality, DX, performance, modern React patterns
- `ado` -- Documentation, accessibility, examples, community readiness
- `jason` -- Community impact, narrative, integration, internationalization

From code-review template:
- `The Architect` -- Design, maintainability, scalability, dependencies
- `The Nitpicker` -- Correctness, consistency, error handling, naming
- `The User Advocate` -- API design, documentation, onboarding, error experience

## Notes

- Reviews use a single subagent, NOT Agent Teams (much cheaper)
- No debate or synthesis -- just one perspective
- Results are displayed but not saved to audit history by default
- Use `/bc:audit` for the full multi-agent experience with synthesis
- Reviews cost approximately 1/6th of a full panel audit

$ARGUMENTS
