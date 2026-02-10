# BoardClaude Web: No-Code Board Builder Powered by Agent SDK

## Context

BoardClaude currently lives as a Claude Code CLI plugin using **Agent Teams** for multi-agent orchestration — powerful but limited to developers in a terminal. The question: can non-technical users build their own evaluation boards through a web frontend?

**Yes — and the Claude Agent SDK is the natural runtime for it.**

This creates a compelling dual-runtime architecture:
- **Developers** use the CLI plugin (Agent Teams — shared task list, inbox messaging, file-based state)
- **Everyone else** uses the web app (Agent SDK — API-dispatched agents, streaming results, browser-based state)
- **Same YAML panel configs power both.** The panel definition is the portable abstraction.

No mainstream no-code tool positions itself as "build a panel of AI critics for your work." This is an open competitive gap.

---

## The Dual-Runtime Architecture

```
                    Panel YAML Config (portable)
                    ┌─────────────────────┐
                    │  agents, weights,    │
                    │  criteria, scoring   │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                              ▼
    ┌───────────────────┐          ┌───────────────────┐
    │   CLI Runtime      │          │   Web Runtime      │
    │   (Agent Teams)    │          │   (Agent SDK)      │
    │                    │          │                    │
    │ • Claude Code env  │          │ • Next.js API route│
    │ • Task list + inbox│          │ • SDK query()      │
    │ • File-based state │          │ • SSE streaming    │
    │ • Full toolset     │          │ • localStorage     │
    │ • Debate rounds    │          │ • Shareable URLs   │
    └───────────────────┘          └───────────────────┘
                │                              │
                ▼                              ▼
         Same JSON output schema (audit reports, scores, action items)
```

**Why this matters for judges:**
- **Boris (Architecture, w=0.20):** Clean separation — one config format, two execution engines, shared output schema. No logic duplication.
- **Thariq (AI/SDK, w=0.18):** Uses Agent SDK at its limits. Parallel subagent execution. Thariq literally wrote the SDK blog post and led the workshop — this directly showcases his work.
- **Cat (Product, w=0.18):** Platform thinking. The config format IS the platform — it's runtime-agnostic.
- **Jason (Community, w=0.13):** Non-technical users get the same evaluation quality without a terminal.
- **Ado (DevRel, w=0.13):** Two on-ramps: 30-second web experience, 2-minute CLI install.

---

## How Agent SDK Powers the Web Backend

### Panel YAML → Agent SDK Mapping

```typescript
// Panel config (from YAML or web builder form state)
const panel = {
  agents: [
    { name: "boris", role: "Architecture", weight: 0.20, model: "opus-4.6",
      prompt: "You are Boris Cherny...", tools: ["Read", "WebSearch"],
      criteria: [{ name: "scalability", weight: 0.40 }, ...] },
    { name: "cat", role: "Product", weight: 0.18, model: "opus-4.6", ... },
    // ... more agents
  ],
  scoring: { scale: 100, passing_threshold: 70 }
};

// Map to Agent SDK subagent definitions
const evaluators = panel.agents.map(agent => ({
  description: `${agent.name}: ${agent.role} evaluator`,
  prompt: agent.prompt,  // The persona system prompt
  tools: agent.tools,
  model: agent.model
}));

// SDK orchestrates parallel evaluation
for await (const message of query({
  prompt: `Evaluate this submission: ${targetContent}`,
  options: { agents: evaluators, model: "sonnet-4.5" }
})) {
  // Stream results to frontend via SSE
  stream.write(`data: ${JSON.stringify(message)}\n\n`);
}
```

**Key SDK features used:**
- **Parallel subagents**: All evaluator agents run concurrently (up to 90% speedup per Anthropic's benchmarks)
- **Streaming output**: `query()` returns async iterator — maps directly to Server-Sent Events
- **Custom tools via MCP**: `createSdkMcpServer()` for any tools agents need
- **Model routing**: Opus for deep evaluators, Sonnet for synthesis (matching CLI architecture)

### API Route Design

```
POST /api/evaluate
Body: {
  panel: PanelConfig,           // From builder form or saved board
  target: {
    type: "text" | "url",       // What to evaluate
    content: string
  },
  effort: "low" | "medium" | "high"  // Controls thinking budget
}

Response: SSE stream
  event: agent_start    data: { agent: "boris", status: "evaluating" }
  event: agent_complete data: { agent: "boris", scores: {...}, verdict: "PASS" }
  event: agent_start    data: { agent: "cat", status: "evaluating" }
  event: agent_complete data: { agent: "cat", scores: {...}, verdict: "PASS" }
  ...
  event: synthesis      data: { composite: 78, radar: {...}, action_items: [...] }
  event: done           data: { audit_id: "audit-..." }
```

---

## UX Flow: 5 Screens

### Screen 1: Template Gallery (`/build`)
- Hero: "Your project, judged by every perspective that matters."
- 3-4 template cards showing: name, agent count, colored avatars, description
- "Custom Board" card for blank-slate builds
- Templates from existing panel YAMLs (`code-review`, `startup-pitch`, `personal-oscar`)

### Screen 2: Panel Builder (`/build/[templateId]`)
Two-column: visual form (left) + live agent card preview (right).

**Form sections:**
- **Board Name + Type** — text input + Professional/Personal toggle
- **Personal Context** (if personal) — goals, constraints, patterns, definition of done
- **Agent Cards** — core interaction:
  - Name, Role (text inputs)
  - Prompt (expandable textarea — the proven "single text field" pattern from CustomGPT)
  - Weight (slider 0.05–0.50) with **visual weight bar** that auto-balances across agents
  - Criteria (expandable: name + weight + description)
  - Veto Power toggle (personal panels only)
  - Add/remove/reorder
- **Scoring** — behind "Advanced" toggle, templates set sane defaults

**Key UX:** Auto-balance ON by default. "Advanced" hides criteria weights + scoring. Weight bar color-coded per agent.

### Screen 3: Audit Runner (`/run/[boardId]`)
Full-width streaming view. Agent cards animate through states:
1. **Waiting** — gray, pulsing dot
2. **Evaluating** — colored border, shimmer (SSE `agent_start` event)
3. **Complete** — score badge, verdict, top strength/weakness (SSE `agent_complete` event)

Synthesis card appears last: composite score (animated count-up), radar chart, divergent opinions, action items. Powered by real SSE stream from Agent SDK backend.

### Screen 4: Results Dashboard (`/results/[auditId]`)
Detailed audit view. Reuses dashboard components (AgentCard, RadarChart, ActionItemList). **Share button** for unique URL — non-technical users share with teammates/mentors.

### Screen 5: Board Library (`/boards`)
Saved boards grid. Each: name, agent count, last score, sparkline. localStorage for hackathon; DB for post-hackathon.

---

## Template Library

### Hackathon Scope (3 templates)

| Template | Agents | Target User | Input Type |
|----------|--------|-------------|------------|
| **Code Review Board** | Architect (0.40), Nitpicker (0.35), User Advocate (0.25) | Developer | GitHub URL or pasted code |
| **Startup Pitch Panel** | Technical VC (0.35), Market VC (0.35), Operator VC (0.30) | Founder | Pitch text, README, product desc |
| **Personal Shipping Board** | Shipper (0.35, veto), Strategist (0.25), Realist (0.25), Visionary (0.15) | Solo dev, student | Goals + constraints + DoD |

### Post-Hackathon
- Academic Peer Review, Conference CFP, Job Application, Design Review, Content Panel
- **Template marketplace** — community forks and shares

---

## Technical Architecture

### File Structure (extends existing dashboard)

```
dashboard/
  app/
    api/
      evaluate/route.ts        -- Agent SDK orchestration endpoint (SSE)
    build/
      page.tsx                  -- Template gallery (RSC)
      [templateId]/page.tsx     -- Panel builder ('use client')
    run/[boardId]/page.tsx      -- Streaming audit view ('use client')
    results/[auditId]/page.tsx  -- Shareable results (RSC)
    boards/page.tsx             -- Board library ('use client')
  components/
    board-builder/
      AgentFormCard.tsx          -- Agent config card
      WeightBar.tsx              -- Weight distribution visualizer
      ContextForm.tsx            -- Personal panel context form
      TemplateCard.tsx           -- Gallery card
    audit-stream/
      StreamingAgentCard.tsx     -- 3-state card with Framer Motion
  lib/
    panel-serializer.ts          -- Form state <-> Panel YAML/JSON
    sdk-orchestrator.ts          -- Agent SDK dispatch logic
    board-storage.ts             -- localStorage CRUD
```

### Three Implementation Tiers

**Tier 1: Builder + Export (6-8 hrs, M5 scope)**
- Web builder produces valid panel config
- "Export to CLI" downloads `.yaml` for `/bc:audit`
- "Run Audit" shows demo results with streaming animation (cached data)
- No backend API calls — pure client-side

**Tier 2: Live Evaluation via Agent SDK (stretch, +4-6 hrs)**
- `POST /api/evaluate` route uses Agent SDK TypeScript
- Panel config → subagent definitions → parallel execution → SSE stream
- Real evaluations running in the browser with live streaming results
- This is the "wow" demo moment

**Tier 3: Full Parity (post-hackathon)**
- Debate rounds between agents
- Action item tracking with persistent ledger
- Iteration history with score progression
- User accounts, DB persistence, template marketplace

### Agent SDK Integration Detail (Tier 2)

```typescript
// dashboard/lib/sdk-orchestrator.ts
import { query, ClaudeAgentOptions } from "@anthropic-ai/claude-agent-sdk";

export async function* runPanelEvaluation(
  panel: PanelConfig,
  target: string,
  effort: EffortLevel
) {
  // Convert panel agents to SDK subagent definitions
  const subagents = panel.agents.map(agent => ({
    description: `${agent.name}: ${agent.role}`,
    prompt: buildAgentPrompt(agent, panel.scoring),
    tools: agent.tools,
  }));

  const orchestratorPrompt = `
    You are running a panel evaluation with ${panel.agents.length} agents.

    Target to evaluate:
    ${target}

    For each agent, invoke them via Task tool with their specific evaluation criteria.
    Collect all JSON results, then synthesize a final report with:
    - Weighted composite score
    - Radar chart data
    - Consensus strengths/weaknesses
    - Divergent opinions (20+ point disagreements)
    - Prioritized action items
  `;

  const options: ClaudeAgentOptions = {
    agents: subagents,
    model: panel.synthesisModel || "sonnet-4.5",
    systemPrompt: "You orchestrate multi-perspective evaluations."
  };

  for await (const message of query({
    prompt: orchestratorPrompt,
    options
  })) {
    yield message;  // Caller streams via SSE
  }
}
```

```typescript
// dashboard/app/api/evaluate/route.ts
import { runPanelEvaluation } from "@/lib/sdk-orchestrator";

export async function POST(req: Request) {
  const { panel, target, effort } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const msg of runPanelEvaluation(panel, target.content, effort)) {
        controller.enqueue(`data: ${JSON.stringify(msg)}\n\n`);
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" }
  });
}
```

---

## Demo Integration

### Beat 5: Framework (2:25–2:50)

**Enhanced script:** "BoardClaude runs two ways. Developers: install the plugin, `/bc:audit`, six agents in your terminal. Everyone else: open the web app, pick a template, click Run. Same config, same agents, same scores. The Agent SDK powers the web. Agent Teams power the CLI. One panel format. Two runtimes."

**Visual:** Split screen — terminal on left (CLI audit running), browser on right (web audit streaming). Same panel, same results.

### Beat 6: Vision (2:50–3:10)

"Imagine: a founder builds a pitch review board. A student gets thesis feedback from three expert perspectives. A PM evaluates specs from engineering, design, and business angles. No terminal. No code. Just perspectives."

---

## Build Sequence

| Step | What | Effort | Gate |
|------|------|--------|------|
| 1 | Template gallery page | 1-2 hrs | Dashboard MVP done (M3) |
| 2 | Panel builder form + weight bar | 3-4 hrs | Step 1 |
| 3 | Export to YAML serializer | 0.5 hr | Step 2 |
| 4 | Demo results page (cached data) | 1-2 hrs | Dashboard components exist |
| 5 | Streaming animation (demo mode) | 1 hr | Step 4 |
| 6 | Board library + localStorage | 1 hr | Step 2 |
| **Tier 1 total** | **Builder + Export** | **~8 hrs** | |
| 7 | `/api/evaluate` with Agent SDK | 2-3 hrs | SDK installed, API key |
| 8 | SSE streaming to audit runner | 2 hrs | Steps 5 + 7 |
| 9 | Live synthesis + radar chart | 1-2 hrs | Step 8 |
| **Tier 2 total** | **Live evaluation** | **+5-7 hrs** | |

**Schedule:** Tier 1 fits in M5 (hours 52-72). Tier 2 is stretch if ahead of schedule.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Steals time from core plugin | Hard gate at M3. Web is M5 stretch only. |
| Agent SDK not yet stable for TS | Fallback: raw Anthropic API with manual orchestration (same pattern, more boilerplate) |
| Parallel agent costs expensive | Use Sonnet for non-critical agents. Effort=low for demo. |
| Non-technical users confused | Templates with sane defaults. "Advanced" toggle hides complexity. |
| SDK subagent streaming format differs from expected | Parse SDK messages into normalized SSE events in the API route. |

---

## Why Agent SDK (Not Just Raw API)

| Feature | Raw Anthropic API | Agent SDK |
|---------|-------------------|-----------|
| Agent loop (think → act → observe) | Manual | Built-in |
| Parallel subagents | Manual thread/async pool | Framework-level |
| Tool execution | Parse + dispatch manually | Automatic |
| Streaming | Supported but manual | Async iterator |
| Context management | Manual | Compaction built-in |
| MCP tool registration | Not applicable | `createSdkMcpServer()` |

The SDK saves ~40% of orchestration boilerplate and gives us the same agent loop quality that powers Claude Code itself.

---

## Non-Technical Use Cases Unlocked

- **Founder** stress-testing a pitch before investor meetings
- **Student** getting multi-perspective thesis feedback
- **PM** evaluating product specs from engineering, design, and business angles
- **Content creator** getting editorial review from multiple personas
- **Job seeker** getting resume feedback from recruiter, HM, and peer perspectives
- **Teacher** building a rubric-based grading panel for student work
- **Nonprofit** evaluating grant proposals from multiple stakeholder perspectives

---

## Implementation Decision

**Hackathon scope:** Build Tier 1 (builder + export + demo results, ~8 hrs in M5). Stretch to Tier 2 (live Agent SDK evaluation, +5-7 hrs) if ahead of schedule.

---

## Summary

The CLI is the engine (Agent Teams). The web is the steering wheel everyone can reach (Agent SDK). The panel YAML is the universal config that connects them. One format, two runtimes, every user.
