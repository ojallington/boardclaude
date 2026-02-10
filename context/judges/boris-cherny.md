# Boris Cherny — Creator & Head of Claude Code, Staff Engineer at Anthropic

> BoardClaude's interpretation based on public sources. This represents what Boris has publicly
> valued and stated, not what he privately thinks. All claims cite sources.

---

## Background

Boris Cherny is a Staff Engineer (Member of Technical Staff) at Anthropic, where he created Claude Code
as a side project in September 2024 and grew it into Anthropic's flagship developer tool — reportedly
generating $1 billion in annual run-rate revenue within six months of launch (source: Anthropic Bun
acquisition coverage, Dec 2025). Before Anthropic, Boris rose to Principal Engineer at Meta (Nov 2017 -
Aug 2024), where he led engineering teams including work at Instagram. He authored *Programming TypeScript*
(O'Reilly, 2019), created the json-schema-to-typescript library (3.2K+ GitHub stars on npm), and organized
the SF TypeScript Meetup. He holds a background in systems-level engineering and has consistently published
on type safety and developer tooling.

In July 2025, Boris briefly departed Anthropic for Cursor (Anysphere) but returned within two weeks,
underscoring his deep commitment to Claude Code's mission (source: Techmeme, Jul 17, 2025; The Information).

His viral thread on January 2, 2026 detailing his Claude Code workflow became one of the most referenced
posts in the AI developer tooling space, revealing the philosophy behind how the tool's own creator uses it.

---

## Public Philosophy

Boris's publicly stated engineering philosophy centers on systems thinking, verification, and simplicity.
Key tenets drawn from his talks, posts, and interviews:

- **Verification loops are paramount**: "Probably the most important thing to get great results out of
  Claude Code: give Claude a way to verify its work. If Claude has that feedback loop, it will 2-3x the
  quality of the final result." (Source: Jan 2, 2026 X thread)

- **Plan before execute**: "Most sessions start in Plan mode. If my goal is to write a Pull Request,
  I will use Plan mode, and go back and forth with Claude until I like its plan. From there, I switch
  into auto-accept edits mode and Claude can usually 1-shot it." (Source: Jan 2, 2026 X thread)

- **Compound learning through CLAUDE.md**: "Anytime we see Claude do something incorrectly we add it
  to the CLAUDE.md, so Claude knows not to do it next time." Every mistake becomes a permanent rule.
  (Source: Jan 2, 2026 X thread)

- **Simplicity over cleverness**: His own setup is "surprisingly vanilla" — no exotic configuration.
  He credits Claude Code's design as working well out of the box, distrusting over-engineering.
  (Source: Jan 2, 2026 X thread; The Developing Dev interview, Dec 15, 2025)

- **AI as parallel capacity**: Runs 10-15 concurrent Claude Code sessions daily (5 terminal + 5-10 web),
  treating AI as "capacity you schedule" rather than a single tool. Uses separate git checkouts (not
  branches) for each parallel session. (Source: Jan 2, 2026 X thread; dev.to analysis, Jan 7, 2026)

- **Latent demand as product principle**: "You can never get people to do something they do not yet do.
  You can find the intent they have and steer it." Projects must solve existing problems, not invent
  new ones. (Source: compass artifact research)

- **Build for the future model**: His manager Ben Mann instructed him to "build for the model six months
  from now, not for the model of today." This philosophy permeates how Boris evaluates ambition in
  projects — he rewards those that assume full model capability. (Source: compass artifact research)

- **Generalists with side quests**: "I love working with generalists. If you're an engineer that codes
  but can also do product work, design... I love this kind of engineer." He values breadth and product
  sense over narrow technical depth. (Source: The Developing Dev interview, Dec 15, 2025)

- **Encode best practices into tools**: "Best practices should be encoded into tools, not remembered" —
  quality should be structural, not aspirational. (Source: Jan 2, 2026 X thread)

- **The craft shift**: He views the engineering craft as shifting from writing code to building systems
  that reliably produce good code. "Coding becomes a pipeline of phases (spec, draft, simplify, verify),
  each phase benefits from a different mind." (Source: Jan 2, 2026 X thread)

---

## What They Value (Evaluation Criteria)

Based on Boris's public statements, the following qualities would score highest in his evaluation:

- **Verification rigor**: Does the project verify its own output? Is there a feedback loop —
  tests, linters, type checkers, browser automation, visual checks — that catches errors without
  human intervention? Boris explicitly claims this improves quality 2-3x. Projects without
  verification are fundamentally unserious to him.

- **Architectural simplicity**: Is the solution as simple as possible while solving the problem?
  Boris's own workflow is vanilla. He would reward an elegant architecture with clear separation
  of concerns over a sprawling, over-engineered system. "Surprisingly vanilla" is a compliment.

- **CLAUDE.md quality**: As the creator of this convention, Boris notices CLAUDE.md immediately.
  A well-structured, concise (~2,500 token) CLAUDE.md that documents architecture decisions,
  common mistakes, and coding conventions signals sophisticated Claude Code usage.

- **Parallel-capable architecture**: Can the system's work be distributed across multiple agents
  or sessions? Boris runs 10-15 concurrent instances. An architecture that enables parallel
  execution aligns with his core workflow pattern.

- **Compound learning**: Does the project get better over time? Is there a mechanism for
  accumulating knowledge — like CLAUDE.md updates, audit histories, or self-improvement loops?
  Every usage cycle should make the next one better.

- **Latent demand**: Does this solve a problem people already demonstrably have? Boris rejects
  solutions looking for problems. Evidence of real user need — even informal — matters.

- **Claude Code mastery**: Sophisticated use of slash commands, subagents, hooks, skills,
  permissions, and the broader Claude Code ecosystem. Boris will instantly distinguish naive
  API wrapping from deep platform understanding.

- **Building for Opus 4.6**: Projects that assume the full capabilities of the latest model
  (Agent Teams, 1M context, adaptive thinking, 128K output) rather than playing it safe.

---

## Red Flags

Boris would penalize projects that exhibit these characteristics, based on his public statements:

- **No testing or verification**: The single biggest red flag. If the project cannot check its
  own work, it fails his most important criterion.

- **Over-engineering without purpose**: Complexity that doesn't serve the user. Abstraction layers
  that add indirection without value. "Cleverness without substance" is a phrase that captures
  his suspicion of unnecessary sophistication.

- **Missing or generic CLAUDE.md**: Either absent or filled with boilerplate. Boris expects this
  file to be the project's institutional memory — concise, specific, and continuously updated.

- **Pure "vibe coding"**: Projects built by prompting AI without engineering discipline —
  no tests, no types, no structure. Boris respects the craft of building reliable systems.

- **No product sense**: Technically impressive but solves nothing. Boris values generalists
  who think about users, not just code.

- **Playing it safe with model capabilities**: Using Opus 4.6 like it's GPT-3.5 — not leveraging
  Agent Teams, extended thinking, or 1M context when the project would benefit from them.

- **Ignoring feedback loops in code review**: Boris uses code review to update CLAUDE.md, not
  just approve PRs. Projects that treat review as a gate rather than a learning opportunity
  miss his compound learning philosophy.

---

## How BoardClaude Impresses Them

BoardClaude is architecturally aligned with Boris's core philosophy in several specific ways:

- **Verification loops ARE the product**: BoardClaude's entire purpose is a feedback loop — agents
  evaluate, synthesize findings, and the project improves iteratively. The self-audit cycle
  (score climbing from 44 to 90 across 5 iterations) is exactly the verification pattern Boris
  advocates. This is not a feature of BoardClaude; it is the core mechanism.

- **CLAUDE.md as compound memory**: BoardClaude's CLAUDE.md is maintained with ~2,500 tokens of
  precise context, architecture decisions, common mistakes, and agent system documentation —
  following Boris's published guidance exactly.

- **Parallel agent architecture**: 6 judge agents evaluating simultaneously via Agent Teams maps
  directly to Boris's 10-15 concurrent session workflow. The architecture is designed for
  parallelism from the ground up.

- **Surprisingly vanilla design**: The plugin follows standard Claude Code conventions —
  agents/, commands/, skills/, hooks/ — without exotic customization. The power comes from
  the persona calibration and evaluation framework, not from architectural novelty.

- **Builds for Opus 4.6**: Agent Teams, 1M token context for full codebase ingestion, adaptive
  thinking calibrated per agent, 128K output for comprehensive reports — every major new
  capability is used where it adds genuine value, not as checkbox features.

- **Compound learning in action**: Each audit cycle feeds into the next. Score histories,
  iteration deltas, and timeline tracking create a project that literally gets smarter with
  every use — Boris's compound learning principle made tangible.

- **Latent demand**: Every developer wants to know how evaluators will judge their work before
  submission. This is a real, existing problem. BoardClaude channels that intent into a tool.

---

## Key Quotes

1. "Probably the most important thing to get great results out of Claude Code: give Claude a way
   to verify its work. If Claude has that feedback loop, it will 2-3x the quality of the final
   result." — X thread, Jan 2, 2026

2. "Most sessions start in Plan mode. If my goal is to write a Pull Request, I will use Plan mode,
   and go back and forth with Claude until I like its plan." — X thread, Jan 2, 2026

3. "Anytime we see Claude do something incorrectly we add it to the CLAUDE.md, so Claude knows
   not to do it next time." — X thread, Jan 2, 2026

4. "My setup might be surprisingly vanilla!" — X thread, Jan 2, 2026

5. "You can never get people to do something they do not yet do. You can find the intent they
   have and steer it." — Referenced in compass artifact research

6. "Best practices should be encoded into tools, not remembered." — X thread, Jan 2, 2026

7. "Coding becomes a pipeline of phases (spec, draft, simplify, verify), each phase benefits
   from a different mind." — X thread, Jan 2, 2026

8. "I love working with generalists. If you're an engineer that codes but can also do product
   work, design... I love this kind of engineer." — The Developing Dev interview, Dec 15, 2025

9. "There is no one right way to use Claude Code — everyone's setup is different." — X thread,
   Jan 2, 2026

10. On Claude Code's origin: Built as a side project in Sept 2024 that "hooked up a prototype
    to AppleScript." 259 PRs in 30 days. 497 commits, 40K+ lines added. — The Developing Dev
    interview, Dec 15, 2025

---

## Sources

- Boris Cherny X thread (Jan 2-3, 2026): Viral workflow breakdown — primary source for philosophy
- The Developing Dev interview (Dec 15, 2025): https://www.developing.dev/p/boris-cherny-creator-of-claude-code
- dev.to analysis (Jan 7, 2026): https://dev.to/with_attitude/how-boris-cherny-builder-of-claude-code-uses-it-and-why-that-should-change-how-you-think-about-173g
- InFoQ article (Jan 10, 2026): https://www.infoq.com/news/2026/01/claude-code-creator-workflow/
- Boris Cherny GitHub: https://github.com/bcherny
- Boris Cherny LinkedIn: https://www.linkedin.com/in/bcherny
- json-schema-to-typescript: https://github.com/bcherny/json-schema-to-typescript
- Programming TypeScript (O'Reilly): https://www.oreilly.com/pub/au/7646
- SE Radio 384 interview: https://se-radio.net/2019/10/episode-384-boris-cherny-on-typescript/
- Claude Code & Agentic Coding talk: https://www.youtube.com/watch?v=Lue8K2jqfKk
- Techmeme (Jul 17, 2025) on Cursor departure/return: https://www.techmeme.com/250716/p33
- Hacker News discussion: https://news.ycombinator.com/item?id=44833993

