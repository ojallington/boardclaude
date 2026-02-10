# BoardClaude — The Build: What to Expect

Personal technical briefing. ~10 minutes at 240 wpm.

---

## 1. Opening — The Starting Line

February tenth, twelve noon Eastern, six PM Central European Time. The clock starts. "Built with Opus 4.6: a Claude Code Hackathon." Six days and three hours to build. Deadline: February sixteenth, three PM EST.

We walk in with fifty-seven prep-kit files. Configuration, agent personas, panel definitions, commands, skills, context documents, operational docs. All designed, reviewed, and audited. Not a single line of application code -- the constraint is absolute: no code before go-live. The code starts when the clock starts.

Five hundred dollars in API credits. Domain: boardclaude.com, with boredclaude.com redirecting. Submission at cv.inc/e/claude-code-hackathon.

The first fifteen minutes are a rehearsed sprint. Minute by minute. Eighteen hundred, git init. Eighteen-oh-one, copy CLAUDE.md. Eighteen-oh-two, plugin.json and settings.json. Eighteen-oh-three, seven agent personas and seven command files. Eighteen-oh-four, five panel YAMLs and hooks. Eighteen-oh-five, six skills and twenty-three context documents. Eighteen-oh-six, first commit, push to GitHub. Eighteen-oh-seven, npx create-next-app. Eighteen-ten, npm install recharts and framer-motion. Eighteen-eleven, second commit. Eighteen-twelve, open Claude Code. Eighteen-thirteen, begin building the audit command.

Fifteen minutes from zero to a working skeleton with every prep file in place.

---

## 2. Milestone M1: Foundation and First Audit

Eight hours available, six PM to two AM CET. Estimated cost sixty dollars. This is the most important day of the entire build.

The first half hour is the go-live sequence. Hours zero-point-five to two: build the plugin manifest and the audit command implementation. This is the core interaction. A user runs /bc:audit, the system ingests their project, dispatches it to a panel of six AI agents, collects their evaluations, and synthesizes a composite score. Everything else in BoardClaude is built on top of this loop.

Hours two through four are the riskiest moment of the entire hackathon. This is where we attempt Agent Team orchestration -- spawning six judge agents in parallel using the experimental agent teams feature. Boris, Cat, Thariq, Lydia, Ado, and Jason, each with their own persona, evaluation criteria, and scoring rubric, all running concurrently and reporting back to a coordinator.

This is experimental infrastructure. It may not work. The decision tree is clear. If agents crash and we recover in one or two attempts, retry with a possibly reduced count. If we get two or more crashes with garbled output, switch immediately to sequential subagent calls. If we spend more than thirty minutes debugging agent team mechanics, switch. The fallback loses the parallel debate dynamic but preserves multi-perspective evaluation, which is the core value proposition. "The narrative pivot is worth more than a fragile demo." If we switch, the story becomes about testing cutting-edge features, finding their limits, and building something more robust. That is a better story than a demo that crashes on stage.

Hours four through five: the synthesis agent and JSON output validation. Six individual evaluations become a unified report with composite scoring, weighted by each agent's assigned importance.

Hours five to five-thirty: the validation-runner skill. This is what makes BoardClaude's evaluations data-backed rather than purely subjective. The runner executes real tools -- tsc for type checking, jest for tests, eslint for linting, prettier for formatting -- and feeds their actual output to the agents. Evidence, not vibes.

Hours five-thirty to six: Self-Audit number zero, the baseline. BoardClaude evaluates itself for the first time. Expecting a composite around forty-four. We want a low starting score because the entire narrative depends on showing improvement over time.

Hours six through seven: first calibration audit on the Compound Engineering Plugin. Over forty-seven hundred stars, twenty-four agents, thirteen commands, eleven skills. Boris cited it as inspiration. Predicted ranges: Boris eighty-five to ninety-two, Cat seventy-five to eighty-two, Thariq seventy to seventy-eight, Lydia sixty to seventy, Ado seventy-eight to eighty-five, Jason seventy-two to eighty. Composite predicted between seventy-four and eighty-one. This tells us whether our personas score in sensible ranges and whether the agent spread reflects their different evaluation priorities.

Hours seven through eight: fix the top three issues from Audit zero. Tag v0.1.0.

M1 priorities in strict order: audit command works, Agent Team spawns six agents, synthesis produces valid JSON, self-audit number zero complete, calibration audit on the Compound Engineering Plugin done. The focus rule applies from minute one: "If it is not on this list, it does not get built today."

---

## 3. Milestone M2: Pipeline and Persona Refinement

Eight hours, estimated cost thirty dollars. Complete the full pipeline and close the loop.

Hours zero through two: finish the end-to-end pipeline. Ingest a project, run the audit across all agents, synthesize results, produce structured output. Every step connected, every handoff validated.

Hours two through three: refine agent personas based on M1 calibration feedback. If Boris scored the Compound Plugin at ninety-three when we predicted eighty-five to ninety-two, we adjust his rubric sensitivity. If Lydia scored higher than expected, we examine whether her criteria are too lenient. The personas are living documents and the calibration data is the first real signal.

Hours three through four: build /bc:fix, the closed-loop pipeline. The flow is audit, then fix, then validate, then re-audit. The system identifies weaknesses, implements targeted fixes, validates with real tooling, and measures the score delta. Action items tracked in a persistent JSON ledger at .boardclaude/action-items.json. Each item has a lifecycle: open, in progress, then resolved, wont-fix, or chronic if the same issue persists across three or more iterations.

Hours four through five: build the /bc:init wizard so new users can bootstrap a BoardClaude configuration for their project.

Hours five through seven: Iteration 1, the second full audit cycle. Run the audit, run /bc:fix on the top findings, validate the fixes, measure improvement. Expecting the composite to climb from forty-four to approximately sixty-one.

Hours seven through eight: verify the fix pipeline end-to-end. Confirm audit-to-fix-to-re-audit score delta is tracked correctly. Tag v0.2.0.

---

## 4. Milestone M3: Dashboard MVP

Eight hours, estimated cost thirty dollars. The dashboard amplifies the demo, but it is not the product.

Hours zero through three: build the visual components. AgentCard components with colored left borders, rounded-xl corners. A RadarChart using recharts for multi-dimensional scoring. Layout in Tailwind v4, dark mode default, Inter font, Framer Motion for animations. The design system assigns specific agent colors: Boris blue at 3b82f6, Cat violet at 8b5cf6, Thariq cyan at 06b6d4, Lydia amber at f59e0b, Ado emerald at 10b981, Jason red at ef4444, Synthesis indigo at 6366f1. Cards carry a subtle colored left border matching each agent.

Hours three through five: connect the dashboard to audit JSON output. Real data from real audit runs.

Hours five through six: "Evaluate External Project" feature. URL or path input that lets you point BoardClaude at any project for a full multi-perspective evaluation.

Hours six through seven: Iteration 2, third audit cycle. Expecting the composite to reach approximately seventy-two.

Hours seven through eight: polish the dashboard based on Lydia agent feedback on developer experience and interface quality.

There is a hard deadline. If the dashboard does not render real audit data by end of M3, we fall back to Markdown-only output. "The plugin is the product; the dashboard is a bonus." Tag v0.3.0.

---

## 5. Milestone M3-M4: Dashboard + Self-Improvement Proof

Hours eighteen through fifty-two. Estimated cost sixty-eight dollars across both milestones. The dashboard amplifies the demo while self-improvement cycles produce the narrative.

Track B runs the dashboard build. Hours eighteen through twenty-one: visual components — AgentCard with colored left borders, RadarChart via recharts, layout in Tailwind v4, dark mode, Inter font, Framer Motion. Hours twenty-one through twenty-six: connect to audit JSON, render real data. Hours twenty-six through thirty: score progression timeline visualization showing the arc across iterations. Hours thirty through thirty-six: "Evaluate External Project" feature, polish based on Lydia agent feedback.

Track C runs in parallel: Iteration 2 at hour twenty-four (target composite seventy-two), Iteration 3 at hour forty (target eighty-three). Each cycle follows the closed loop: audit, fix, validate, re-audit. By hour fifty-two, we need three-plus audit cycles with measured deltas and composite above eighty-five.

Track A continues: `/bc:fork` and `/bc:compare` (hours thirty-six through forty), TimelineTree visualization (hours forty through forty-eight), edge case hardening (hours forty-eight through fifty-two).

The hard deadline from old M3 still applies: if AgentCards plus RadarChart are not rendering real data by hour thirty-six, fall back to Markdown-only output. The plugin is the product; the dashboard is a bonus.

---

## 6. Milestone M5: Framework + Polish

Hours fifty-two through seventy-two. Estimated cost thirty dollars. Prototype becomes product.

Hours fifty-two through fifty-eight: package as an installable Claude Code plugin. Clean entry points, documented configuration, reliable install.

Hours fifty-eight through sixty-two: demo panel templates. Three ready-to-use configs: code-review for engineering teams, startup-pitch for founders, personal-shipper for individual developers. Personal panels like Oscar's Shipping Board are template examples demonstrating the framework's flexibility, not core deliverables. BoardClaude is a framework, not a single-purpose tool.

Hours sixty-two through sixty-eight: comprehensive README with examples, screenshots, quickstart. First thing judges see — must communicate concept, value, and polish in under two minutes of reading.

Hours sixty-eight through seventy: batch-evaluate script for headless mode. Uses claude -p with --output-format json for UI-less evaluation.

Hours seventy through seventy-two: Lighthouse pass targeting ninety-plus, accessibility check, final Iteration 4 (target composite ninety). Tag milestone M5.

---

## 7. Milestones M6-M7: Demo Ready + Record + Submit

Hours seventy-two through one hundred twenty. Estimated cost twenty-three dollars. This is where everything converges.

Hours seventy-two through seventy-six: final UI polish and accessibility pass. Lighthouse above ninety. WCAG 2.1 AA compliance, keyboard navigation, contrast ratio checks.

Hours seventy-six through seventy-eight: the final audit. Target composite eighty-five or above. If we do not hit eighty-five, we ship anyway. The iteration story matters more than the number.

Hours seventy-eight through eighty-four: demo prep. Cache all audit data. Prepare /bc:fix demo with three action items showing before/after validation. Rehearse video script. Dry run under three minutes fifteen seconds.

Hours eighty-four through ninety-six: record the three-minute-ten-second demo video. Six beats, tightly scripted. Beat one, zero to fifteen seconds: the hook. Beat two, fifteen seconds to one minute: the self-improvement arc. Beat three, one to one-fifty: the proof — evaluate the Compound Engineering Plugin. Beat four, one-fifty to two-twenty-five: the closed loop — /bc:fix with real validation gates. Beat five, two-twenty-five to two-fifty: the framework. Beat six, two-fifty to three-ten: vision and close.

Hours ninety-six through one hundred eight: write submission text, final README review, deploy verify.

Hours one hundred eight through one hundred twenty: buffer for last-minute fixes. Submit before three PM EST on February sixteenth. Tag v1.0.0.

Key shift from the old plan: demo-ready at hour seventy-two gives three full days of buffer for recording, polish, and iteration. No more recording on the last day with zero margin.

---

## 9. The Proof Layer Arc

The proof layer separates BoardClaude from a toy demo. Systematic escalation of credibility across the week.

M1: calibrate on the Compound Engineering Plugin. Forty-seven hundred plus stars, twenty-four agents, thirteen commands, eleven skills. Boris cited it as inspiration. Predicted ranges: Boris eighty-five to ninety-two, Cat seventy-five to eighty-two, Thariq seventy to seventy-eight, Lydia sixty to seventy, Ado seventy-eight to eighty-five, Jason seventy-two to eighty. Composite seventy-four to eighty-one. Stakes in the ground.

M2: second calibration on Everything Claude Code, winner of the Forum Ventures hackathon September 2025. Different project, different expected profile. Two data points beat one.

M3: integrate proof layer into dashboard comparison view.

M5: document batch evaluation plan in README as concrete roadmap.

M6: live demo. Evaluate Compound Plugin on camera. Boris eighty-eight, Lydia sixty-five, Thariq seventy-two, composite seventy-nine. Differentiated, credible evaluations of real projects.

Post-hackathon: batch-evaluate all five hundred submissions in headless Sonnet mode. Three hundred to five hundred dollars, four to six hours. When winners are announced around February twenty-first, compare predicted rankings against actual results. Publish a "BoardClaude Accuracy Report." Use deltas to refine personas. The calibration loop feeds back into the product.

The narrative escalation: self-evaluation, then a known project, then all five hundred, then predicted versus actual, then a refined product. "A system that identifies its own calibration errors is more valuable than a system that gets lucky on M1."

---

## 10. Risk Register Highlights

Four risks that could derail the build, and the mitigation for each.

Agent Teams instability. The experimental agent teams feature is the single biggest technical risk. Decision tree: one to two crashes with recovery, retry with reduced count. Two or more crashes with garbled output, switch to sequential subagents immediately. More than thirty minutes debugging, switch. The fallback preserves multi-perspective evaluation even without parallel debate. The narrative pivot: "We tested the cutting-edge feature, found its limitations, and built something more robust."

API costs exceeding the five hundred dollar budget. Track spend per session with explicit checkpoints. End of M2: max one hundred twenty. End of M4: max two hundred. End of M5: max two hundred eighty. M6 onward: max three hundred fifty. That leaves roughly one hundred fifty as buffer, forty-nine percent of total budget at two hundred forty-four spent. If we approach a checkpoint early, reduce agent count or switch Opus calls to Sonnet.

Dashboard stealing time from core functionality. The M3 hard deadline exists for this reason. If the dashboard does not render real data by end of day, fall back to Markdown-only and never look back. "The plugin is the product; the dashboard is a bonus."

Calibration misses. Predicted scores for the Compound Plugin may be wrong. That is fine. "Transparency beats accuracy. Show the delta." Predictions do not need to be perfect. Every miss makes the next version better. Frame imprecision as an honest signal, not a failure.

And the overarching risk: scope creep. Milestone gates enforce scope discipline. If it does not advance the current milestone, it goes in BACKLOG.md. No exceptions. Any idea that surfaces during the build goes into BACKLOG.md for after February sixteenth.

---

## 11. Close — The Score Arc

The numbers tell the story. Forty-four. Sixty-one. Seventy-two. Eighty-three. Ninety. Five iterations across one hundred twenty hours of agent-autonomous execution.

Each cycle follows the same loop: identify weaknesses through multi-perspective evaluation, implement targeted fixes, validate those fixes with real tools — tsc, jest, eslint, prettier — and measure the score delta. Every fix validated. Every regression reverted. Every chronic item flagged and tracked.

The system improves itself. That is the story we are telling. Not "we built a thing," but "the thing made itself better." The convergence loop is the product.

This is not a single deep thought. It is sustained deep reasoning across multiple perspectives and iterations. Six agents with different priorities, different evaluation criteria, different blind spots. Each one sees something the others miss. The synthesis captures all of it.

Every perspective. Every critique. Every time.
