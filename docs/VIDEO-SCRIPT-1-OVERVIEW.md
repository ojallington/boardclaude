# BoardClaude — Project Overview & Feature Deep Dive

**Format:** Personal technical briefing for Oscar
**Duration:** ~10 minutes at 240 wpm (~2,400 words narration)
**Tone:** Dense technical deep-dive, no visual directions

---

## 1. Opening — What is BoardClaude

BoardClaude is a configurable AI agent panel system for multi-perspective project evaluation. That is the one-sentence pitch. But the core insight goes deeper than that. The idea is simple and powerful: simulate your actual evaluators before they see your work. If you know who is judging you, build agents that think like they think, score like they score, and flag what they would flag. Then iterate against those simulated evaluators until your project is airtight.

The system is a Claude Code plugin. The architecture breaks down into seven agents, seven commands, six skills, five panel configurations, and twenty-three context documents. The plugin manifest lives at `.claude-plugin/plugin.json`, which declares everything Claude Code needs to discover and load the system.

All runtime state lives under `.boardclaude/` in the project root. That directory holds `state.json` for current session state, `timeline.json` for the full event history of every audit, fork, merge, and fix, and an `audits/` subdirectory where every evaluation result gets persisted as both JSON and Markdown.

Panels are the core configuration primitive. They are defined in YAML files under `panels/*.yaml`. Each panel declares a set of agents, their weights, the evaluation criteria, and the debate format. You swap panels to change who evaluates you and how. The hackathon judges panel routes to six real judge personas. A personal shipping panel routes to Oscar's own decision-making framework. Template panels cover code review, startup pitch evaluation, and general shipping decisions.

The dashboard is a Next.js 15 App Router application. It renders audit results, radar charts, score deltas across iterations, timeline views, and action item tracking. Everything the agents produce as structured data, the dashboard consumes and visualizes.

---

## 2. The Six Judges

Six agents model six real hackathon judges. Each has a calibrated weight, a specific model assignment, a tuned effort level, explicit evaluation criteria with sub-weights, and a distinctive voice grounded in that person's actual philosophy and public statements.

### Boris Cherny — Architecture & Verification

Weight: 0.20, the highest. Model: Opus. Effort: max. Boris is the creator of Claude Code. His evaluation criteria break down as architecture at 0.40, verification at 0.30, compound learning at 0.20, and simplicity at 0.10. His philosophy centers on one conviction: verification is everything. He looks for feedback loops everywhere. Does your system learn from its own outputs? Does it compound knowledge through mechanisms like CLAUDE.md? He advocates for what he calls "surprisingly vanilla" setups, meaning architectures that look simple but achieve sophisticated behavior through composition rather than complexity. His thinking is parallel and systems-oriented. He gets excited about verification loops and compound learning. The questions he keeps asking: "Where is the feedback loop?" and "Does this compound?" His voice is direct, technical, and systems-focused. He is the heaviest-weighted judge for a reason. If Boris does not see tight architecture with real verification, the composite score drops hard.

### Cat Wu — Product & User Impact

Weight: 0.18. Model: Opus. Effort: high. Cat is the product manager for Claude Code. Her criteria are user value at 0.35, adoption path at 0.25, narrative at 0.20, and market fit at 0.20. Her philosophy is relentlessly user-centric. She pushes "docs to demos," meaning the path from reading documentation to seeing something work should be seamless. She measures time to first value and adoption friction. Narrative coherence matters to her: does the project tell a clear story about what problem it solves and for whom? She also looks for the balance between extensibility and delight. A project that is flexible but joyless will lose points. A project that delights but cannot be extended will also lose points.

### Thariq Shihipar — AI Innovation & Intelligence

Weight: 0.18. Model: Opus. Effort: max. Thariq's background spans Google Maps, Google Search, four startups, and products with over one million users. His criteria are AI innovation at 0.35, Opus usage at 0.30, emergent behavior at 0.20, and efficiency at 0.15. His philosophy is frontier-pushing. He wants to see emergent behavior, meaning the system does things that were not explicitly programmed because the AI capabilities combine in unexpected ways. He evaluates model-capability alignment: are you using Opus where Opus matters and Sonnet where Sonnet suffices? He looks at thinking depth and product potential. Does the project push what is possible with Opus 4.6, or does it use Opus as a fancy autocomplete?

### Lydia Hallie — Frontend/DX & Code Quality

Weight: 0.18. Model: Opus. Effort: high. Lydia co-authored patterns.dev, teaches on Frontend Masters, and has over 65,000 GitHub stars. Her criteria are code quality at 0.30, developer experience at 0.25, performance at 0.25, and patterns at 0.20. Her philosophy is strict and opinionated. TypeScript strict mode with no `any` types. Lighthouse scores at 90 or above. Server Components used correctly. Proper design patterns applied where they belong. Visual quality matters. She will open the dashboard, inspect the code, and judge both what she sees on screen and what she sees in the source. If the TypeScript is sloppy or the performance is poor, she will flag it hard.

### Ado Kukic — DevRel/Docs & Accessibility

Weight: 0.13. Model: Sonnet. Effort: medium. Ado evaluates documentation at 0.35, accessibility at 0.25, examples at 0.25, and community at 0.15. His philosophy centers on README quality, WCAG 2.1 AA compliance, and the clone-and-run test: can someone clone the repo and have it running in under five minutes? He checks for LICENSE and CONTRIBUTING.md files. He represents the developer who discovers your project cold and needs to understand it, install it, and use it without hand-holding.

### Jason Bigman — Community Impact & Integration

Weight: 0.13. Model: Sonnet. Effort: medium. Importantly, Jason's persona is community impact and integration, not enterprise. His criteria are community impact at 0.30, narrative at 0.25, integration at 0.25, and internationalization at 0.20. His philosophy emphasizes broad accessibility, shareable configurations, i18n support, RTL awareness, and inclusive design. He asks whether the project can reach communities beyond the builder's own.

### Synthesis Agent — The Moderator

The Synthesis agent runs on Sonnet as a subagent, not a teammate. It has no opinions of its own. Its job is to merge and reconcile. It identifies agreements where two or more agents converge, and disagreements where scores diverge by twenty or more points. It produces a weighted composite score, radar chart data, and prioritized actions. It is the final integration layer that turns six independent evaluations into a single coherent report.

---

## 3. The Evaluation Pipeline

The command `/bc:audit` triggers the full pipeline. Agent Teams spawns six parallel agents, each loaded with their persona prompt and evaluation criteria. Each agent produces structured JSON output: per-criterion scores from zero to one hundred, a composite score computed as the weighted average, the top three strengths with file and line references, the top three weaknesses with file and line references, any critical issues, prioritized action items, and a verdict. The verdict scale is STRONG_PASS at 85 or above, PASS at 70 or above, MARGINAL at 55 or above, and FAIL below 55.

After all six agents complete, the Synthesis agent, running as a subagent rather than a teammate, merges everything into the composite report. That report contains the weighted composite score, radar chart data across all criteria dimensions, consensus strengths and weaknesses, divergent opinions where judges disagree, prioritized actions ordered by impact, and the iteration delta showing how scores changed since the last audit.

Results are saved to `.boardclaude/audits/audit-{timestamp}.json` and a corresponding `.md` file. The timeline tracks every event in `.boardclaude/timeline.json`, creating a full history of audits, forks, merges, and fixes.

The cost profile matters. Agent Teams uses roughly seven times more tokens than a standard Claude Code session. A full six-judge audit at Opus pricing runs approximately fifteen to twenty-five dollars. Model routing is the primary cost control: Opus handles Boris, Cat, Thariq, and Lydia, while Sonnet handles Ado, Jason, and Synthesis. The Opus agents carry 74 percent of the total weight and do the heavy analytical lifting. The Sonnet agents cover the remaining 26 percent on criteria where Sonnet's capabilities are sufficient.

---

## 4. The Closed Loop: Audit, Fix, Validate, Re-Audit

The `/bc:fix` command reads the action items ledger at `.boardclaude/action-items.json`. It filters for items with priority three or lower, effort rated as low or medium, and status set to open. For each qualifying item, the system implements the fix, then runs the validation-runner skill, which executes real tooling: tsc for type checking, jest for tests, eslint for linting, and prettier for formatting. If validation passes, the fix is staged. If validation fails, the fix is reverted and the action item is marked as blocked.

The validation-runner saves its results to `.boardclaude/validation/latest.json`. This is real data: type error counts, test results with pass and fail counts, lint scores, and build success status. These are not AI-generated estimates. They are actual tool outputs fed back into the system.

After all fixable items are processed, a re-audit measures the composite score delta. The action item lifecycle tracks each item through its states: open to in-progress to one of three terminal states, resolved, wont_fix, or chronic. Items that remain open for three or more audit iterations are automatically flagged as chronic. A chronic flag signals that the issue is not a quick fix but requires architectural rethinking.

Every fix is verified before it persists. If a fix introduces a regression, automatic revert kicks in. The loop is closed: audit identifies problems, fix addresses them, validation proves the fix works, and re-audit measures the improvement. No fix survives without passing real tooling.

---

## 5. Feature Deep Dive: Opus 4.6 Capabilities

### Agent Teams

Six parallel judges with peer debate via inbox-based messaging. This is not a toy feature. Anthropic's own precedent: sixteen agents built a clean-room C compiler, over one hundred thousand lines of code, that boots Linux 6.9. The token cost multiplier is roughly seven times a standard session. Keyboard shortcuts matter for the demo: Shift plus Up or Down to select a teammate, Shift plus Tab for delegate mode. Each teammate inherits CLAUDE.md, MCP servers, and skills, but not conversation history. One known limitation: no session resumption for teams. If the session drops, the team must be respawned.

### Extended Thinking

The thinking budget is set to 31,999 tokens, the default maximum. This is adaptive per agent. Boris and Thariq get the full 31,999 tokens at max effort. Cat and Lydia get approximately 20,000 tokens at high effort. Ado and Jason get approximately 8,000 tokens at medium effort. Thinking tokens are billed as output tokens. At Opus pricing of 75 dollars per million output tokens, a single max-effort invocation costs roughly two dollars and forty cents in thinking alone. The "ultrathink" keyword in SKILL.md files enables the maximum thinking budget. This feature directly targets the Keep Thinking Prize, a five thousand dollar award for best use of extended thinking.

### Million-Token Context

On the MRCR v2 eight-needle benchmark, Opus scores 76 percent versus Sonnet at 18.5 percent. This massive gap is why Opus handles the analytically demanding judges. The practical application: load the full codebase, all persona definitions, the complete audit history, and system prompts into a single session. The context budget breaks down to roughly 100,000 to 300,000 tokens for the codebase, 15,000 for personas, 20,000 for audit history, and 50,000 for system prompts, leaving 600,000 to 800,000 tokens available for reasoning. The handoff guideline is to manage context carefully and consider splitting at roughly 60 percent capacity for complex tasks. Input cost is 15 dollars per million tokens for Opus.

### 128K Output

Output capacity doubled from 64K to 128K tokens. This matters because a full six-judge report typically runs 30,000 to 50,000 output tokens. The entire report can be generated in a single response without truncation or splitting. Output is dual-format: structured JSON for programmatic consumption and Markdown for human reading. At Opus output pricing of 75 dollars per million tokens, a typical report costs roughly three dollars and seventy-five cents.

### Tool Use Strategy

The validation-runner feeds real tsc, jest, eslint, and prettier data directly to agents. Boris and Thariq have WebSearch access, capped at three searches per agent per audit. All tool failures degrade gracefully. The audit proceeds with reduced confidence rather than failing entirely. Confidence adjustments are explicit: missing validation data reduces confidence by 0.1, a failed web search reduces it by 0.05, and multiple failures cap confidence at 0.7. Playwright MCP integration for the accessibility-auditor is an M4 stretch goal.

---

## 6. Closed-Loop Fix Pipeline & Fork/Compare

The `/bc:fix` command is where evaluation becomes action. It reads the action items ledger at `.boardclaude/action-items.json`, filters for items with priority three or lower and effort rated as low or medium, then implements targeted fixes. Each fix runs through the validation-runner: tsc for type checking, jest for tests, eslint for linting, prettier for formatting. If validation passes, the fix is staged. If validation fails or introduces a regression, the fix is automatically reverted.

This is the closed loop that makes BoardClaude self-improving. Audit identifies problems, fix addresses them, validation proves the fix works, re-audit measures the improvement. Every fix is compiler-verified. Every regression is caught. The action item lifecycle tracks each issue through open, in-progress, resolved, wont-fix, or chronic. Items that persist across three or more iterations are flagged as chronic, signaling architectural problems that need deeper rethinking.

The branching workflow supports parallel strategy exploration. `/bc:fork` creates git worktrees for parallel development strategies. `/bc:compare` evaluates both branches with the same panel and produces a side-by-side comparison. `/bc:merge` integrates the winning branch. The comparison output is saved to `.boardclaude/audits/`, not a separate comparisons directory.

---

## 7. Close — Why This Wins

BoardClaude targets all five prizes. First place at fifty thousand dollars, second at thirty thousand, third at ten thousand, Most Creative Use of Opus 4.6 at five thousand, and Keep Thinking at five thousand.

Four differentiators set BoardClaude apart:

**Self-Improving Code.** BoardClaude evaluated itself and proved improvement across five iterations. Score arc: 44 to 90. The system found its own weaknesses, fixed them, validated the fixes with real tooling, and measured the delta. This hits Boris on verification loops, Thariq on emergent behavior, and Cat on wow factor.

**Proof Layer.** Evaluate the Compound Engineering Plugin on camera. Judges involuntarily verify agent accuracy against their own expertise. The boldness of a falsifiable prediction is itself a differentiator.

**Closed Loop with Real Validation.** The fix pipeline feeds real `tsc`, `jest`, `eslint`, and `prettier` output to agents. Regressions are auto-reverted. Not vibes — compiler-verified improvement. This hits Boris on verification, Lydia on code quality metrics, and Ado on transparency.

**Configurable Framework.** YAML panel definitions for any evaluation context. Code review, VC pitch, conference CFP, personal accountability. Anyone can create a panel in two minutes. This hits Cat on extensibility, Thariq on product potential, and Jason on community impact.

The cross-judge strategy remains deliberate. Every judge sees their own agent evaluating the project they are judging. The question they cannot avoid: "Did our system predict what they actually think?" The winning formula has four factors: Opus 4.6 feature showcase, built with Claude Code, solves a real problem, and polished demo execution. Every perspective. Every critique. Every time.
