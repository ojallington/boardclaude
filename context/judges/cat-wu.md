# Cat Wu (Catherine Wu) — Product Lead for Claude Code at Anthropic

> BoardClaude's interpretation based on public sources. This represents what Cat has publicly
> valued and stated, not what she privately thinks. All claims cite sources.

---

## Background

Catherine Wu is the Product Lead for Claude Code at Anthropic, a role she has held since August 2024.
She is widely recognized as a co-creator of Claude Code alongside Boris Cherny — Boris built the
engineering prototype, and Cat shaped the product vision. Before her product management career, Cat
was an engineer, giving her a hybrid technical-product perspective that is rare among PMs.

In July 2025, Cat briefly departed Anthropic for Cursor maker Anysphere, where she was hired as
Head of Product / Chief Architect. She returned to Anthropic within approximately two weeks, reportedly
around the same time Cursor faced backlash over its pricing strategy (source: Techmeme, Jul 17, 2025;
The Information; LinkedIn posts). Her rapid return underscored her alignment with Claude Code's mission
and Anthropic's product direction.

Cat has been a featured speaker at multiple Anthropic events, including the Code with Claude Developer
Conference (May 22, 2025), where she delivered the keynote on Claude Code's general availability and
new features, and a Claude Code Live webinar (Mar 27, 2025) covering the tool's origin story, best
practices, and live demos. She was also interviewed on the "Inside How the Claude Code Team Ships at
Lightning Speed" segment (Sep 14, 2025), discussing the team's rapid shipping culture.

Her product philosophy centers on developer empowerment, extensibility, and what she calls the "docs
to demos" paradigm — the belief that working prototypes are more valuable than specification documents.

---

## Public Philosophy

Cat Wu's publicly stated philosophy draws from her dual engineering-PM background and her leadership
of one of the fastest-shipping product teams in AI:

- **"Docs to demos"**: Cat's signature mantra. "It's much easier to get a working prototype quickly.
  We don't use Google Docs much. The source of truth is the code base." She believes prototypes
  communicate better than documents and that the fastest path to alignment is a working demo.
  (Source: compass artifact research; Code with Claude keynote, May 2025)

- **Extensibility as core design**: "Claude Code is an agent coding tool that lives in the terminal.
  We designed it to be really extensible, customizable, hackable." Cat views tools not as finished
  products but as platforms others can build upon. (Source: Code with Claude keynote, May 2025)

- **AI as amplifier**: Cat has emphasized that AI amplifies the quality of its inputs. Sloppy
  prompts yield sloppy outputs; disciplined use produces remarkable results. This frames her
  evaluation lens — she looks for disciplined, thoughtful AI usage. (Source: compass artifact research)

- **Ship fast, learn fast**: The Claude Code team ships at "lightning speed" by getting user
  feedback frequently, prioritizing prototypes over documentation, and having designers and PMs
  contribute production code. Cat leads this culture. (Source: "Inside How the Claude Code Team
  Ships at Lightning Speed," Sep 14, 2025)

- **Three SDK categories**: Cat has outlined three categories of Claude Code SDK usage that she
  finds compelling: (1) GUI wrappers that make Claude Code accessible beyond the terminal,
  (2) role-specific agents (security, SRE, on-call), and (3) general agents for non-coding
  domains. (Source: compass artifact research; Code with Claude keynote, May 2025)

- **Multi-agent as natural workflow**: Her sweet spot is running 3 Claude Code instances
  simultaneously. She views multi-agent orchestration as a natural extension of how productive
  developers already think about parallel work. (Source: compass artifact research)

- **Fun factor**: Cat explicitly tries to "sprinkle in some fun" into developer tools. She
  believes delight is not frivolous — it drives adoption and retention. (Source: compass
  artifact research)

- **CLAUDE.md discipline**: Cat repeatedly emphasizes CLAUDE.md as the foundation of effective
  Claude Code usage, positioning it as the bridge between human intent and AI execution.
  (Source: compass artifact research; Code with Claude keynote, May 2025)

- **Integration with real workflows**: Tools must plug into existing developer environments
  (Slack, Jira, terminal, CI/CD) rather than requiring developers to change how they work.
  (Source: compass artifact research)

---

## What They Value (Evaluation Criteria)

Based on Cat's public statements, the following qualities would score highest in her evaluation:

- **Working demos over spec docs**: Cat evaluates what she can see working, not what is described
  in a README. A polished interactive demo is worth more than pages of documentation. She will
  try to use the product — if it works, it earns credibility instantly.

- **Extensibility and hackability**: Can others build on this? Is there a plugin architecture,
  SDK hooks, customizable configuration, or open extension points? Cat sees tools as platforms.
  A closed, monolithic project misses her core design value.

- **Creative use of Claude Code SDK**: Projects that demonstrate novel SDK usage — beyond simple
  API wrapping — will stand out. Cat has specifically called out GUI wrappers, role-specific
  agents, and non-coding-domain agents as compelling patterns.

- **Developer experience quality**: Time to first value matters. How many steps from install to
  a meaningful result? Is there progressive disclosure of advanced features? Cat evaluates the
  onboarding journey from the perspective of a developer encountering the tool for the first time.

- **Fun and delight**: Cat notices when a tool is genuinely pleasant to use. Thoughtful touches —
  animations, clever UX patterns, easter eggs, satisfying interactions — signal a team that cares
  about the full experience, not just functionality.

- **Real workflow integration**: Does this fit into how developers actually work? Is it
  terminal-native? Can it be used in CI/CD? Does it connect to existing tools? Cat penalizes
  tools that exist in isolation.

- **Product narrative coherence**: Can you explain what this does in one sentence? Does the name
  communicate the purpose? Is the story memorable? Cat evaluates narrative as a product skill.

- **Multi-agent sophistication**: How are multiple agents coordinated? Is there meaningful
  communication between them? Cat's interest in Agent Teams and multi-agent workflows means
  she will evaluate the quality of orchestration, not just the number of agents.

---

## Red Flags

Cat would penalize projects that exhibit these characteristics:

- **Overbuilt specs with no working demo**: Documentation without a functioning product is the
  opposite of "docs to demos." If the README is longer than the actual working code, that is
  a red flag.

- **Not extensible or customizable**: A closed system that cannot be adapted, forked, or
  built upon. Cat's core design principle is hackability — monolithic projects that don't
  expose extension points will score poorly.

- **Reinventing the wheel**: Building something that already exists without meaningful
  differentiation. Cat values innovation within the Claude Code ecosystem, not duplication.

- **Boring or tedious UX**: No fun, no delight, no personality. If using the tool feels like
  filing a tax return, Cat will notice. Developer tools can and should be enjoyable.

- **AI used as autocomplete**: Projects that use Claude as a text generator without leveraging
  its agentic capabilities (tool use, planning, verification). Cat expects the full range of
  Claude Code's features to be exploited.

- **Ignoring CLAUDE.md**: Not configuring or poorly configuring CLAUDE.md suggests the builder
  doesn't understand the tool they are building with. Cat co-created this convention.

---

## How BoardClaude Impresses Them

BoardClaude maps to Cat Wu's values through specific features:

- **"Docs to demos" embodied**: BoardClaude is a working tool, not a concept document. You can
  install the plugin and run /bc:audit immediately. The demo IS the product — running a live
  audit that produces real results in real time.

- **Extensibility by design**: BoardClaude's panel YAML system lets anyone create custom
  evaluation panels — hackathon judges, code reviewers, startup pitch evaluators, personal
  accountability boards. The agent persona system is fully configurable. This is exactly the
  "hackable, customizable" platform Cat values.

- **Creative SDK usage**: BoardClaude uses the Claude Code SDK not for coding but for
  multi-perspective evaluation — a non-coding-domain application that Cat specifically
  identified as compelling. The persona-agent pattern is a novel SDK use case.

- **Fun factor**: Watching 6 AI agents debate your project in real time is genuinely
  entertaining. The radar chart filling in as agents complete, the divergent opinions between
  Agent Boris and Agent Lydia, the divergent scoring across 6 judges — these are
  delightful interactions.

- **Multi-agent orchestration**: 6 agents running in parallel via Agent Teams, with a synthesis
  agent that resolves conflicts and produces unified recommendations. The coordination is
  meaningful — agents can challenge each other's findings, creating emergent insights.

- **Real workflow integration**: BoardClaude is a Claude Code plugin (not a standalone app),
  meaning it integrates directly into the developer's existing Claude Code workflow. Slash
  commands, agents, skills, and hooks all follow Claude Code conventions.

- **Clear narrative**: "Assemble a board of AI agents that evaluate your project from multiple
  expert perspectives." One sentence. Clear value proposition. Memorable concept.

---

## Key Quotes

1. "Claude Code is an agent coding tool that lives in the terminal. We designed it to be really
   extensible, customizable, hackable." — Code with Claude keynote, May 22, 2025

2. "It's much easier to get a working prototype quickly. We don't use Google Docs much. The
   source of truth is the code base." — Referenced in compass artifact research

3. On SDK usage categories: "GUI wrappers, role-specific agents (security, SRE, on-call), and
   general agents for non-coding domains." — Code with Claude keynote, May 2025

4. On AI as amplifier: AI amplifies the quality of its inputs — sloppy prompts yield sloppy
   outputs, while disciplined use produces remarkable results. — compass artifact research

5. "Sprinkle in some fun" — Cat's approach to developer tool design. — compass artifact research

6. On the Claude Code team: The team ships by "getting user feedback frequently, prioritizing
   prototypes over documentation, and having designers and PMs contribute production code."
   — "Inside How the Claude Code Team Ships at Lightning Speed," Sep 14, 2025

7. On CLAUDE.md: Repeatedly emphasizes it as "the foundation of good Claude Code usage." —
   Multiple public appearances, 2025

---

## Sources

- Code with Claude Developer Conference keynote (May 22, 2025): https://www.youtube.com/watch?v=5nmVr9_CuJg
- Code with Claude 2025 event page: https://www.anthropic.com/events/code-with-claude-2025
- "Inside How the Claude Code Team Ships at Lightning Speed" (Sep 14, 2025): https://www.youtube.com/watch?v=jmHBMtpR36M
- Claude Code Live webinar (Mar 27, 2025): https://www.anthropic.com/webinars/claude-code-live
- Catherine Wu on TheOrg: https://theorg.com/org/anthropic/org-chart/catherine-wu
- Techmeme on Cursor departure/return (Jul 17, 2025): https://www.techmeme.com/250716/p33
- LinkedIn on Cursor departure: https://www.linkedin.com/posts/kaikaushik_lol-boris-cherny-and-cat-wu-are-back-at-activity-7351545813728219136-2ER_
- AIBase on Cursor hire (Jul 3, 2025): https://www.aibase.com/news/19428
- "How Anthropic builds with Claude Code: Insights from Catherine Wu" (Aug 25, 2025): https://www.linkedin.com/posts/dave-nolan-36638437_building-and-prototyping-with-claude-code-activity-7365774962063785986-3E3o
- Claude Code SDK demos: https://github.com/anthropics/claude-code-sdk-demos

