# Prize Targeting — Feature-Prize Mapping

## Prize Structure

| Prize | Amount | What Judges Want |
|-------|--------|------------------|
| **1st Place** | $50,000 | Best overall: technical depth + wow factor + polish |
| **2nd Place** | $30,000 | Strong runner-up |
| **3rd Place** | $10,000 | Solid entry |
| **"Most Creative Opus 4.6 Exploration"** | $5,000 | Push boundaries of *new* Opus 4.6 capabilities |
| **"The Keep Thinking Prize"** | $5,000 | Best use of extended/adaptive thinking |

**Total prize pool:** $100,000 in API credits.

**Key signal from prize categories:** The two special prizes explicitly reward projects that showcase Opus 4.6-specific features. Judges want projects that *could not have been built before Opus 4.6*.

---

## Feature-to-Prize Mapping

| BoardClaude Feature | 1st-3rd | Creative | Keep Thinking |
|---------------------|---------|----------|---------------|
| Agent Teams as persona-embodiment engines | High | **Primary** | Medium |
| Self-improvement loop (5 audit cycles, 44->90) | High | High | Medium |
| Proof layer (external calibration validation) | **Primary** | High | Medium |
| Adaptive thinking calibrated per agent persona | Medium | High | **Primary** |
| Multi-round agent debate with synthesis | High | Medium | **Primary** |
| Configurable personal panels (template feature) | Low | Medium | Low |
| Closed-loop fix pipeline with real validation gates | High | High | **Primary** |
| Configurable YAML panel framework | High | Medium | Low |
| Next.js dashboard with radar + timeline | High | Low | Low |
| Branching timeline + fork/compare workflow | Medium | Medium | High |
| 1M context: full codebase + personas + history | Medium | High | High |
| 128K output: comprehensive audit reports | Low | Medium | Medium |

---

## Target Prizes (Primary)

### "Most Creative Opus 4.6 Exploration" ($5K)

**Why BoardClaude targets this:**
- Agent Teams used in a way nobody has tried: persona-embodiment engines, not just task parallelism
- The self-improvement loop where agents evaluate their own output and the system converges is novel
- Proof layer creates testable predictions — a scientific claim inside a hackathon project
- Closed-loop self-improvement: audit → fix → validate → re-audit with real compiler/test/lint output creates a verification pipeline that compounds across iterations
- No other submission will use Agent Teams to simulate *specific human evaluators*

**The pitch:** "We didn't just use Agent Teams to split work. We used them to simulate a board of directors — each agent embodying a real person's evaluation philosophy. Then the system used their feedback to improve itself, automatically. Five audit cycles. Score: 44 to 90. The code judged itself and got better."

### "The Keep Thinking Prize" ($5K)

**Why BoardClaude targets this:**
- Extended thinking calibrated per agent: Boris/Lydia get max effort (complex architectural and code analysis), Ado/Jason get medium effort (more formulaic evaluation)
- Deep architectural analysis requires sustained reasoning across the full codebase
- Multi-round debate between agents forces deeper reconsideration and synthesis
- Branching timeline with fork/compare requires evaluating strategy alternatives at depth
- The convergence loop across 5 audit iterations demonstrates thinking that compounds over time

**The pitch:** "Each agent thinks as deeply as its persona demands. Agent Boris at max effort dissects architecture with the rigor of an IC8 engineer. Agent Lydia at max effort traces every TypeScript pattern and re-render path. The synthesis agent reconciles six conflicting expert views. This isn't a single deep thought — it's sustained deep reasoning across multiple perspectives and iterations."

### Top 3 ($50K/$30K/$10K)

**Overall positioning:** BoardClaude targets the top 3 through:
1. **Novel concept** — Persona-calibrated evaluation has no direct competitor
2. **Working demo** — Live audit of a known project with measurable scores
3. **Polish** — Next.js dashboard, clean TypeScript, deployed at boardclaude.com
4. **Claude Code mastery** — Built entirely with Claude Code, using Agent Teams, adaptive thinking, 1M context, and CLAUDE.md discipline
5. **Real utility** — Not a toy; the framework is installable and configurable for any evaluation context

**The winning formula for this hackathon (from source analysis):**
```
WINNING PROJECT =
  (Opus 4.6 specific feature showcase)
  x (Built WITH Claude Code, not just using the API)
  x (Solves a real problem impressively)
  x (Polished demo)
```

**Critical nuance:** The hackathon is called "Built with Opus 4.6: a Claude Code hackathon" — it is specifically about Claude Code, not just the API. BoardClaude demonstrates Claude Code mastery through its plugin architecture, slash commands, CLAUDE.md discipline, and Agent Teams orchestration.

---

## Demo Video Beat Sheet (3:10)

| Time | Beat | Visual | Narration |
|------|------|--------|-----------|
| 0:00-0:15 | **Hook** | Terminal, dark theme, text typed | "What if your code could judge itself and get better — automatically?" |
| 0:15-1:00 | **Self-improvement** | Timeline tree: 44, 61, 72, 83, 90. 2x3 grid of 6 agent cards scoring in parallel | "Five audit cycles. Six agents. Score: 44 to 90. Every cycle, the agents found problems. Every cycle, we fixed them." |
| 1:00-1:50 | **External proof** | Dashboard, paste Compound Eng Plugin URL. Six agents activate. Boris: 88. Lydia: 65. Thariq: 72. Composite: 79 | "Self-evaluation is easy. Here's the real test. Does this match what the real judges think?" |
| 1:50-2:25 | **Closed loop** | Split screen: terminal running /bc:fix with tsc/jest output, dashboard showing score delta | "/bc:fix reads the action items, implements fixes, validates with real tooling. Regressions auto-reverted. Three fixes in, six-point score jump." |
| 2:25-2:50 | **Framework** | Terminal install, YAML editor, /bc:audit running, dashboard results | "Install BoardClaude. Choose a template. Run /bc:audit. Six agents. One minute." |
| 2:50-3:10 | **Vision + Close** | Montage: 500 repos scrolling, correlation chart, then boardclaude.com + tagline | "We'll evaluate all 500 submissions. Predicted vs actual. Every miss makes v2 better. BoardClaude. Every perspective. Every critique. Every time." |

**Narrative escalation:** Meta (self-improvement) -> Credible (known project) -> Validated (closed loop) -> Useful (framework) -> Visionary (scale) -> Memorable (tagline)

**Key demo rules:**
- The demo IS the product. Judges will spend minutes, not hours, evaluating. Make it visually compelling.
- Show the dashboard, not the terminal (for visual impact)
- Agent cards streaming in parallel is the "wow" moment — let it breathe
- The proof layer (evaluating Compound Engineering Plugin) is the credibility moment — land it clearly
- End with the scale vision to signal "this is a product, not a project"

---

## Submission Narrative

**One-line pitch:** BoardClaude: Assemble a board of AI agents that evaluate your project from multiple expert perspectives — and get better every time they do it.

**Short description:** BoardClaude is a Claude Code plugin that creates panels of AI agents, each embodying a specific evaluator persona. It uses Opus 4.6's Agent Teams to run evaluators in parallel, where agents debate and challenge each other's findings. The synthesis agent merges everything into a radar chart, prioritized action items, and an iteration delta. BoardClaude's first job was evaluating itself — watching the composite score climb from 44 to 90 across five audit cycles. Then it evaluated the Compound Engineering Plugin and our Agent Boris's evaluation aligned with what real Boris values. Ships as an installable plugin with pre-built panels, or create your own.

**Tagline options:**
1. "Your project, judged by everyone who matters — before they ever see it."
2. "Every perspective. Every critique. Every time."
3. "The board meeting your code needs."

---

## Winning Pattern Analysis

Analyzing past Anthropic hackathon winners reveals a consistent formula:

| Winner | What They Did | Why They Won |
|--------|---------------|-------------|
| Robot Use (Builder Day, Dario judging) | Claude processed a robotic arm's manual via computer use, then physically operated it | Surprising novel application of a platform-specific feature nobody anticipated |
| zenith.chat (Forum Ventures) | Built entirely with Claude Code in 8 hours, 15+ agents, 30+ commands, hooks | Demonstrated mastery of Claude Code's own tooling ecosystem |
| SideQuest (Pear VC "Most Innovative") | Reversed human-AI relationship: AI posts jobs, matches humans, tracks results | Conceptual novelty — rethought fundamental interaction paradigm |

**The pattern:** Surprising concept + deep platform-specific feature usage + working demo. Every winner solved a real problem, showed something functional (not slides), and demonstrated creative use of capabilities specific to Claude/Anthropic.

**Other consistent winning traits:**
- Multi-agent architectures
- Human-in-the-loop design
- Production-quality polish
- Compelling storytelling about *why* it matters

**BoardClaude's alignment with the pattern:**
- Surprising concept: persona-embodiment + self-evaluation + proof layer
- Deep feature usage: Agent Teams, adaptive thinking, 1M context, 128K output
- Working demo: live evaluation of known project with measurable scores
- Real problem: every builder wants feedback before their evaluator sees their work

---

## Judge-by-Judge Strategy

| Judge | What to Nail | How BoardClaude Delivers |
|-------|-------------|-------------------------|
| **Boris** (Architecture) | Verification loops, simplicity, CLAUDE.md discipline, latent demand | The entire system IS a verification loop. The closed-loop fix pipeline (audit→fix→validate→re-audit) demonstrates compound learning. CLAUDE.md is first-class. "Latent demand" = every developer wants to know what reviewers think before submitting |
| **Cat** (Product) | Working demo, extensibility, fun factor, creative SDK usage | Live dashboard demo, YAML panels anyone can create, agents debating is entertaining to watch, Agent Teams as persona engines, closed-loop self-improvement |
| **Thariq** (AI/Research) | Agent SDK usage, novel application, product potential, MCP integration | Agent Teams pushed to limit, Claude Code used beyond coding (evaluation), framework extensible to any domain |
| **Lydia** (DX/Code) | Clean TypeScript, visual polish, performance, patterns used correctly | TypeScript strict, Next.js with RSC/Suspense, dashboard with Framer Motion animations, Tailwind design system |
| **Ado** (DevRel/Docs) | README quality, time to first value, process transparency, security | Comprehensive README with quickstart, <5 min install, every audit published, persona prompts visible |
| **Jason** (Community) | Clear narrative, community impact, accessibility, internationalization | "Every perspective, every critique" story, democratizes expert review for solo devs, clean UX for non-technical users |

**Cross-judge strategy:** Every judge sees their own agent evaluating the project they're judging. Boris sees Agent Boris. Lydia sees Agent Lydia. They *cannot* avoid engaging with the accuracy question: "Did our system predict what they actually think?" This transforms passive evaluation into active verification.

**What to optimize for each specific judge (execution checklist):**
- **Boris:** Build self-testing agents that verify their own output. Keep architecture elegant, not over-engineered. CLAUDE.md must be exemplary.
- **Cat:** Make it hackable via YAML panels. Ship a polished interactive demo. Sprinkle in delightful UI touches.
- **Thariq:** Use Claude Agent SDK primitives. Integrate MCP tools creatively. Push beyond coding into evaluation as a domain.
- **Lydia:** Beautiful Next.js frontend. Smooth UX. Performant. Clean TypeScript strict mode.
- **Ado:** Stellar README with quickstart. Show the prompts and process. Demonstrate autonomous plan-act-verify loops.
- **Jason:** Tell a compelling story about who this helps. Make it accessible to non-engineers. Clean narrative in submission text.

---

## Opus 4.6 Feature-to-Prize Alignment

| Opus 4.6 Feature | BoardClaude Usage | Prize Target |
|-------------------|-------------------|-------------|
| Agent Teams | 6+ judge-persona agents evaluating in parallel with debate | Creative ($5K) |
| 1M Token Context | Ingest full codebase + all personas + audit history | Top 3 |
| Adaptive Thinking | Effort calibrated per persona (max for Boris/Lydia, medium for Ado/Jason) | Keep Thinking ($5K) |
| 128K Output | Full audit reports with cross-referenced findings per agent | Top 3 |
| Context Compaction | Multi-iteration sessions persist learnings across audit cycles | Keep Thinking ($5K) |
| Effort Controls | Different levels for different audit phases (low linting, max architecture) | Creative ($5K) |

---

## Budget Allocation by Prize Priority

| Spend | Amount | Prize Impact |
|-------|--------|-------------|
| Agent Teams + 6-agent parallel audits (Opus) | ~$200 | Creative + Keep Thinking + Top 3 |
| Dashboard development sessions | ~$80 | Top 3 (Lydia, Cat impressions) |
| Calibration audits (Compound Eng + 2 others) | ~$90 | Creative (proof layer) |
| Closed-loop pipeline development | ~$30 | Creative + Keep Thinking |
| Documentation + README polishing | ~$20 | Top 3 (Ado impression) |
| Demo video recording sessions | ~$30 | Top 3 + all prizes (presentation) |
| Buffer (49% of budget) | ~$50 | Safety margin |
| **Total** | **~$500** | |
