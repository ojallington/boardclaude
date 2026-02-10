# Tool Use Strategy -- BoardClaude Agent Capabilities

## What It Covers

BoardClaude agents do more than read code. Some agents run shell commands, search the web, or delegate subtasks. This doc defines the tool capability matrix, MCP integration strategy, validation data flow, web research protocol, graceful degradation, and judge alignment for each tool choice.

---

## 1. Tool Capability Matrix

Not all agents need all tools. Restricting tools per-agent reduces cost, prevents side effects, and keeps each agent focused on its evaluation domain.

| Agent     | Read/Grep/Glob | Bash | WebSearch/Fetch | Task (subagents) | Playwright |
|-----------|:--------------:|:----:|:---------------:|:-----------------:|:----------:|
| Boris     | Yes            | Yes  | Yes             | Yes               | No         |
| Cat       | Yes            | Yes  | No              | No                | No         |
| Thariq    | Yes            | Yes  | Yes             | No                | No         |
| Lydia     | Yes            | Yes  | No              | No                | No         |
| Ado       | Yes            | Yes  | No              | No                | No         |
| Jason     | Yes            | Yes  | No              | No                | No         |
| Synthesis | Yes            | Yes  | No              | No                | No         |

**Why this split:**
- **All agents** have Bash access for inspecting project structure, running read-only commands (`git log`, `npm ls`, `wc -l`), and verifying build configuration. This is lightweight and non-destructive.
- **Boris** additionally gets Task (subagent delegation for large codebases) and WebSearch (validate claims against external sources, check project community reception).
- **Thariq** additionally gets WebSearch (look up whether AI patterns are genuinely novel, research MCP ecosystem).
- **Cat, Lydia, Ado, Jason** have Read/Grep/Glob/Bash only. They evaluate code, docs, and config -- no web research or subagent delegation needed.
- **Synthesis** only merges agent results. Bash available for reading validation output files but rarely used.

**Configuring tools in agent frontmatter:**
```yaml
# agents/boris.md frontmatter
tools: Read, Grep, Glob, Bash, Task, WebSearch, WebFetch

# agents/cat.md frontmatter
tools: Read, Grep, Glob
```

---

## 2. MCP Server Strategy

BoardClaude does not require custom MCP servers for MVP. Available integrations:

| Capability         | Source                    | Use Case                                      |
|-------------------|---------------------------|-----------------------------------------------|
| Playwright MCP    | `@anthropic/playwright`   | Visual testing, Lighthouse audits, screenshots |
| GitHub stats      | `gh` CLI via Bash         | Stars, issues, PR activity for evaluated repos |
| Web Search/Fetch  | Native Claude tools       | Community reception, best practice lookup      |
| File system       | Native Read/Grep/Glob     | Code analysis (all agents)                     |

**Playwright MCP (post-MVP):**
- Enable for visual regression testing and Lighthouse performance audits.
- Lydia's evaluation would gain actual Core Web Vitals scores instead of static analysis estimates.
- Not required for hackathon MVP -- static analysis is sufficient for code quality evaluation.

**No custom MCP servers for MVP.** The native Claude tools plus `gh` CLI cover all evaluation needs. Adding MCP servers increases setup friction, which directly hurts Ado's "installable in 5 minutes" criterion.

---

## 3. Validation Integration

The validation-runner skill produces structured results that feed into agent context during audits.

```
validation-runner saves to:
  .boardclaude/validation/latest.json

Structure:
{
  "timestamp": "2026-02-12T14:30:00Z",
  "type_errors": 12,
  "test_results": { "passed": 45, "failed": 3, "skipped": 2 },
  "lint_score": 94,
  "build_success": true,
  "lighthouse": null          // null if not configured
}
```

**Data flow into agents:**
1. Pre-audit: validation-runner executes `npm run typecheck`, `npm test`, `npm run lint`.
2. Results saved to `.boardclaude/validation/latest.json`.
3. Audit-runner reads validation results and injects them into each agent's context.
4. Agents receive structured summary: "12 type errors, 3 failing tests, lint score 94%."
5. Post-fix: validation-runner re-runs. Agents in the next audit see the delta.

**Agent-specific validation use:**
- **Boris**: Uses type error count and test pass rate as concrete verification data.
- **Lydia**: Uses lint score and type error details for code quality scoring.
- **Ado**: Uses build success as a gate for "installable" criterion.
- **Others**: Receive summary but do not deeply analyze validation output.

---

## 4. Web Research Protocol

Boris and Thariq have WebSearch/WebFetch access. This protocol keeps research focused and cost-controlled.

**When to research:**
- Look up the evaluated project's GitHub stats (stars, open issues, recent activity) via `gh` CLI.
- Fetch recent GitHub issues/PRs for the evaluated project to assess community health.
- Look up best practices for architectural patterns found in the codebase.
- Check if AI/ML patterns used in the project are genuinely novel (Thariq's domain).

**When NOT to research:**
- Do not search for general programming knowledge (agents already know this).
- Do not search for the agent's own evaluation criteria (already in persona prompt).
- Do not search for other agents' findings (available in synthesis, not via web).

**Rate limit: max 3 web searches per agent per audit.** This is a cost control measure. Each WebSearch call adds latency and token cost. Three searches is enough to validate key claims without turning an audit into a research project.

**Citation format:** When an agent uses web research in its evaluation, include the source:
```json
{
  "action": "Consider adopting error boundaries (React docs recommend this for production)",
  "source": "https://react.dev/reference/react/Component#catching-rendering-errors"
}
```

---

## 5. Tool Failure Graceful Degradation

Every tool can fail. Each failure has a defined fallback so audits complete even with reduced capabilities.

| Failure                        | Detection                  | Fallback                                              | Report Impact                        |
|-------------------------------|----------------------------|-------------------------------------------------------|--------------------------------------|
| MCP server unavailable         | Connection error on init   | Fall back to Bash-based analysis                      | Note: "MCP unavailable, using Bash"  |
| WebSearch fails                | HTTP error or timeout      | Proceed with code-only evaluation                     | Flag reduced confidence in findings  |
| Playwright cannot start        | Browser launch error       | Skip visual testing entirely                          | Note: "Visual testing skipped"       |
| Dev server won't start         | `npm run dev` fails        | Skip Lighthouse, use static analysis only             | Note: "No live server, static only"  |
| validation-runner finds no tests | Empty test results        | Report "no tests configured" (informational, not failure) | Agent notes absence in evaluation |
| `gh` CLI not authenticated     | Auth error on `gh api`     | Skip GitHub stats                                     | Note: "GitHub stats unavailable"     |
| Bash command times out         | Wall-clock timeout (60s)   | Capture partial output, continue without result       | Note: "Command timed out"            |

**Principle:** A tool failure never blocks an audit. The audit proceeds with whatever tools work, and each failure is transparently noted in the output. Synthesis adjusts confidence based on which tools were available.

**Confidence adjustment:**
- All tools available: confidence unchanged (agent-determined).
- Validation data missing: reduce confidence by 0.1 (max).
- Web research failed: reduce confidence by 0.05 (Boris/Thariq only).
- Multiple tool failures: cap maximum confidence at 0.7.

---

## 6. Judge Alignment -- Why Each Tool Choice Matters

Each tool capability maps to what specific judges value. This is not arbitrary -- it is designed to score well on the evaluation criteria.

| Judge   | Tool Alignment                                                                                          |
|---------|--------------------------------------------------------------------------------------------------------|
| Boris   | Validation-runner proves verification loops use real data, not fabricated metrics. Bash access lets agents actually run the build and tests -- the kind of concrete verification Boris demands. |
| Cat     | Extensible tool configuration via panel YAML and agent frontmatter. Users can add or remove tools per-agent without changing code. Plugin architecture means MCP servers slot in naturally. |
| Thariq  | MCP usage demonstrates tool composition mastery -- exactly the kind of Agent SDK + MCP integration pattern he evaluates. WebSearch shows agents using real external data, not hallucinating. |
| Lydia   | Playwright + Lighthouse (post-MVP) would give actual Core Web Vitals. For MVP, validation-runner provides real lint scores and type error counts -- concrete metrics, not opinions. |
| Ado     | WebFetch + transparent citation shows agents use real data and attribute sources. No black-box evaluations -- every finding is traceable. Documentation of tool capabilities helps onboarding. |
| Jason   | Standard tool interfaces (`gh` CLI, native WebSearch) mean no proprietary dependencies. Community-standard tools integrate with existing developer workflows. |
