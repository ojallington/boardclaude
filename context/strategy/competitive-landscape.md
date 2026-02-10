# Competitive Landscape — BoardClaude Positioning

## Direct Comparators

### 1. Compound Engineering Plugin (Every Inc)

**What it is:** A Claude Code plugin by Dan Shipper's Every Inc that implements a structured development workflow: Plan, Work, Review, Compound. It uses 12 subagents to review code in parallel from different perspectives (security, performance, simplicity, etc.), then compounds learnings back into the system.

**Key stats:** 24 agents, 13 commands, 11 skills, 2 MCP servers, 4,700+ GitHub stars.

**Strengths:**
- Mature ecosystem with extensive agent library
- "80% planning and review, 20% execution" philosophy aligns with best practices
- Boris Cherny explicitly cited it as inspiration: "It's our version of Dan Shipper's Compounding Engineering"
- Includes a DHH Rails Reviewer agent, proving persona-based review is viable at the concept level

**Where BoardClaude differs:**

| Dimension | Compound Engineering | BoardClaude |
|-----------|---------------------|-------------|
| Agent identity | Role-based (security-sentinel, performance-oracle) | Persona-based (specific individuals with sourced values) |
| Feedback source | Generic best practices | Calibrated to your actual evaluators |
| Iteration model | Single review cycle | Convergence loop with delta tracking across iterations |
| Visualization | CLI-only output | Real-time Next.js dashboard with radar charts |
| Transparency | Internal process | Public audit reports as release notes |
| Generalizability | Coding-specific | Any evaluation context (hackathons, YC, journals, personal) |
| Self-improvement | Manual tuning | Proof layer validates and refines persona accuracy |

**Key insight:** Compound Engineering proves the multi-agent review pattern works. BoardClaude's innovation is making the agents represent *specific people*, not generic roles, and validating their accuracy against reality.

---

### 2. CodeRabbit / AI Code Review Tools

**What they are:** Automated code review bots that analyze PRs for bugs, style violations, security issues, and best practices. CodeRabbit, Codacy, SonarQube, and similar tools scan code against rule-based and AI-powered criteria.

**Strengths:**
- Well-established CI/CD integration
- Fast, deterministic feedback on common issues
- Good at catching objective bugs (null refs, SQL injection, unused imports)
- Large install base and proven reliability
- Integrates directly into PR workflow (GitHub, GitLab, Bitbucket)

**Limitations for our use case:**
- Only analyzes code diffs, not the full project holistically
- Feedback is rule-based or model-generic — no perspective on architecture, narrative, or product thinking
- Cannot adapt evaluation criteria to your specific evaluators
- No iteration tracking or improvement measurement

**Where BoardClaude differs:**
- Code review bots answer "Is this code correct?" BoardClaude answers "How would *this specific person* evaluate this project?"
- No code review bot offers "this is how Lydia Hallie would evaluate your React patterns"
- The persona layer is the innovation — turning generic review into calibrated evaluation
- BoardClaude evaluates the whole project (architecture, narrative, docs, DX), not just diffs
- Code review bots are reactive (check PRs). BoardClaude is proactive (audit holistically, iterate)
- BoardClaude produces weighted composite scores, consensus maps, and divergence analysis — not just inline comments

---

### 3. Generic LLM Evaluation

**What it is:** Prompting any LLM with "rate this project 1-10" or "review this code." The lowest-effort approach to AI evaluation.

**Why it fails for serious use:**
- No persona calibration — the model uses its own generic taste
- No structured criteria — produces vague feedback
- No iteration tracking — no way to measure improvement
- No disagreement or debate — single perspective
- No proof of accuracy — unfalsifiable claims

**Where BoardClaude differs:**
- Calibrated personas with criteria sourced from public statements and professional backgrounds
- Weighted scores that reflect which perspectives matter most for your context
- Iteration tracking showing score deltas across audit cycles
- Multi-agent debate where agents challenge each other's findings
- Proof layer that validates predictions against known projects
- Structured output (JSON + radar charts + timelines) vs free-text responses
- Convergence loop where repeated audits drive measurable improvement

---

### 4. Other Agent Orchestration Tools (CrewAI, AutoGen, LangGraph)

**What they are:** Frameworks for building multi-agent systems. CrewAI, AutoGen, and LangGraph provide primitives for agent coordination, but are general-purpose infrastructure, not evaluation tools.

**Where BoardClaude differs:**
- These are frameworks; BoardClaude is a product built on top of Claude Code's native Agent Teams
- BoardClaude provides the evaluation domain logic: persona calibration, weighted scoring, consensus analysis, iteration tracking
- No need to build agent infrastructure — it ships ready to use with pre-built panels
- The tight integration with Claude Code (plugin, slash commands, CLAUDE.md) means zero-friction for the target audience

---

## BoardClaude's Moat

Seven differentiators no competitor combines:

1. **Self-improvement loop** — Run audit, implement fixes, re-audit, measure delta. The convergence loop with iteration tracking is unique. Score arc 44→90 across five iterations.

2. **Persona-calibrated evaluation** — Agents embody specific individuals, not generic roles. Each persona sourced from public statements, professional background, and known values.

3. **Proof layer** — External calibration against known projects creates testable predictions. Falsifiable claims about real projects.

4. **Closed-loop fix pipeline** — `/bc:fix` implements fixes, validates with real tooling (`tsc`, `jest`, `eslint`, `prettier`), auto-reverts regressions. Compiler-verified, not vibes.

5. **Configurable panel YAML** — Open framework where anyone defines panels for any evaluation context: hackathon judges, code reviewers, VC pitches, academic peer review. Personal panels available as templates.

6. **Dashboard visualization** — Real-time radar charts, branching timelines, consensus maps. Visual feedback that makes multi-perspective evaluation intuitive.

7. **Agent Teams debate** — Agents challenge each other's findings. Boris wants simplicity, Lydia wants stricter types — the tension produces better recommendations.

---

## Positioning Table

| Feature | BoardClaude | Compound Eng. | CodeRabbit | Generic LLM |
|---------|-------------|---------------|------------|-------------|
| Persona-specific agents | Yes (sourced) | No (roles only) | No | No |
| Multi-perspective evaluation | 6+ agents debating | 12 subagents reviewing | Single bot | Single prompt |
| Iteration tracking + delta | Yes (convergence loop) | No | No | No |
| External calibration proof | Yes (known project validation) | No | No | No |
| Visualization dashboard | Yes (Next.js, radar, timeline) | No (CLI) | PR comments | No |
| Personal panels (template) | Yes (template) | No | No | No |
| Configurable YAML panels | Yes (open framework) | Partial (agent configs) | No | No |
| Agent Teams (Opus 4.6) | Yes (parallel debate) | No (subagents) | No | No |
| Works beyond code | Yes (any evaluation context) | No (code only) | No (code only) | Partially |
| Self-improving accuracy | Yes (proof layer + v2 calibration) | No | No | No |

---

## Market Category

BoardClaude creates a new category: **configurable multi-perspective AI evaluation**. It is not a code review tool (though it can review code). It is not a development workflow tool (though it integrates with development). It is an evaluation framework that lets you simulate any panel of evaluators and validate their accuracy.

**Closest analogies outside software:**
- Mock trial services (simulate the jury before the real trial)
- Focus groups (simulate the customer before the product launch)
- Practice interviews (simulate the interviewer before the real interview)

BoardClaude is "mock evaluation as a service" — powered by calibrated AI personas.

---

## Strategic Implication for Hackathon

The judges will compare BoardClaude to what they already know:
- **Boris** knows Compound Engineering intimately — show how BoardClaude builds on that foundation with persona-calibration and proof. The compound loop is a known quantity; the persona layer is the innovation.
- **Cat** values extensibility and "docs to demos" — show the YAML framework that lets anyone build panels, and the live dashboard that makes evaluation visual and interactive.
- **Lydia** knows CodeRabbit-style tools — show how persona evaluation is qualitatively different from rule-based review. The TypeScript strictness and visual polish of the dashboard speaks her language.
- **Thariq** evaluates product potential — show how the YAML framework makes this a platform, not a one-off. The proof layer creates a roadmap from hackathon project to real product.
- **Ado** values clear documentation and process — the transparent evaluation methodology and public audit reports demonstrate "show, don't tell."
- **Jason** looks for accessibility and impact — the YAML templates make expert-level evaluation accessible to solo developers who have never had a review board.

**The differentiation must be *demonstrated*, not just claimed:** the external calibration audit is the proof. Running BoardClaude on the Compound Engineering Plugin in the demo video forces judges to verify the system's accuracy against their own opinions in real time.
