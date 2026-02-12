import type Anthropic from "@anthropic-ai/sdk";
import type { TryAgentResult } from "@/lib/types";
import { getGrade, getVerdict } from "@/lib/types";
import { validateAgentEvaluation } from "@/lib/validate";
import {
  WEB_AGENTS,
  getModelId,
  EFFORT_BUDGET_MAP,
  type WebAgentConfig,
} from "@/lib/try-agents";
import type { SSESender } from "@/app/api/try/route";

/** Repo file used for tool execution. */
export type RepoFile = { path: string; content: string };

function parseAgentJSON(text: string): Record<string, unknown> | null {
  let jsonStr = text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── Tool definitions ──────────────────────────────────────────────────────

const CODEBASE_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "search_codebase",
    description:
      "Search repository files for a regex pattern (case-insensitive). Returns matching lines with file paths and line numbers.",
    input_schema: {
      type: "object" as const,
      properties: {
        pattern: {
          type: "string",
          description: "Regex pattern to search for",
        },
        file_glob: {
          type: "string",
          description:
            "Optional filter for file paths (e.g. '*.ts', 'src/*.tsx')",
        },
      },
      required: ["pattern"],
    },
  },
  {
    name: "read_file",
    description:
      "Read the full contents of a specific file from the repository.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "File path relative to repository root",
        },
      },
      required: ["path"],
    },
  },
];

// ─── Tool execution ────────────────────────────────────────────────────────

function executeSearchCodebase(
  files: RepoFile[],
  input: Record<string, unknown>,
): string {
  const pattern = String(input.pattern ?? "");
  const fileGlob = input.file_glob ? String(input.file_glob) : undefined;
  const maxResults = 25;

  try {
    const regex = new RegExp(pattern, "gi");
    const results: string[] = [];

    for (const file of files) {
      if (fileGlob) {
        const escaped = fileGlob
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/\*/g, ".*");
        if (!new RegExp(escaped, "i").test(file.path)) continue;
      }

      const lines = file.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? "";
        regex.lastIndex = 0;
        if (regex.test(line)) {
          results.push(`${file.path}:${i + 1}: ${line.trimEnd()}`);
          if (results.length >= maxResults) break;
        }
      }
      if (results.length >= maxResults) break;
    }

    return results.length > 0
      ? `Found ${results.length} match(es):\n${results.join("\n")}`
      : `No matches found for: ${pattern}`;
  } catch {
    return `Invalid regex pattern: ${pattern}`;
  }
}

function executeReadFile(
  files: RepoFile[],
  input: Record<string, unknown>,
): string {
  const path = String(input.path ?? "");
  const exact = files.find((f) => f.path === path);
  if (exact) return `--- ${exact.path} ---\n${exact.content}`;

  const partial = files.find(
    (f) => f.path.endsWith(path) || f.path.endsWith("/" + path),
  );
  if (partial) return `--- ${partial.path} ---\n${partial.content}`;

  return `File not found: ${path}\n\nAvailable files:\n${files.map((f) => f.path).join("\n")}`;
}

function executeTool(
  name: string,
  input: Record<string, unknown>,
  files: RepoFile[],
): string {
  switch (name) {
    case "search_codebase":
      return executeSearchCodebase(files, input);
    case "read_file":
      return executeReadFile(files, input);
    default:
      return `Unknown tool: ${name}`;
  }
}

// ─── Agentic (multi-turn) invocation ───────────────────────────────────────

const MAX_TOOL_ROUNDS = 5;

/**
 * Invoke an agent with tool_use enabled, handling the multi-turn loop.
 * Returns the final text response from the agent.
 */
async function invokeAgentWithTools(
  client: Anthropic,
  agent: WebAgentConfig,
  userPrompt: string,
  tier: "free" | "byok",
  files: RepoFile[],
  send: SSESender,
  index: number,
): Promise<string> {
  const modelId = getModelId(agent.model, tier);
  const useThinking = tier === "byok" && agent.model === "opus";
  const budgetTokens = EFFORT_BUDGET_MAP[agent.effort];

  const msgs: Anthropic.Messages.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: modelId,
      max_tokens: useThinking ? budgetTokens + 8000 : 4096,
      system: agent.systemPrompt,
      messages: msgs,
      tools: CODEBASE_TOOLS,
      ...(useThinking && {
        thinking: { type: "enabled" as const, budget_tokens: budgetTokens },
      }),
    });

    // Extract tool_use blocks
    const toolBlocks = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use",
    );

    // No tool calls or model signalled end — return final text
    if (toolBlocks.length === 0 || response.stop_reason === "end_turn") {
      return response.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
    }

    // Execute each tool call
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const block of toolBlocks) {
      await send("agent_tool_use", {
        agent: agent.name,
        index,
        tool: block.name,
        round,
      });

      const result = executeTool(
        block.name,
        block.input as Record<string, unknown>,
        files,
      );
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }

    // Continue conversation: replay assistant response + tool results
    msgs.push(
      {
        role: "assistant",
        content: response.content as Anthropic.Messages.ContentBlockParam[],
      },
      { role: "user", content: toolResults },
    );
  }

  // Max rounds exhausted — force final answer without tools
  const finalResponse = await client.messages.create({
    model: modelId,
    max_tokens: useThinking ? budgetTokens + 8000 : 4096,
    system:
      agent.systemPrompt +
      "\n\nProvide your final evaluation JSON now. No more tool calls.",
    messages: msgs,
    ...(useThinking && {
      thinking: { type: "enabled" as const, budget_tokens: budgetTokens },
    }),
  });

  return finalResponse.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// ─── Main entry point ──────────────────────────────────────────────────────

/**
 * Run all 6 web agents in parallel. Returns completed agent results.
 * Throws if fewer than 3 agents succeed.
 *
 * Agents with `toolEnabled` use a multi-turn loop with search_codebase
 * and read_file tools for deeper investigation.
 */
export async function invokeAgents(
  client: Anthropic,
  userPrompt: string,
  tier: "free" | "byok",
  send: SSESender,
  files: RepoFile[] = [],
): Promise<TryAgentResult[]> {
  const agentPromises = WEB_AGENTS.map(async (agent, index) => {
    await send("agent_start", { agent: agent.name, index });

    try {
      let text: string;

      if (agent.toolEnabled && files.length > 0) {
        // Agentic: multi-turn with tool_use
        text = await invokeAgentWithTools(
          client,
          agent,
          userPrompt,
          tier,
          files,
          send,
          index,
        );
      } else {
        // Single-turn: standard invocation
        const modelId = getModelId(agent.model, tier);
        const useThinking = tier === "byok" && agent.model === "opus";
        const budgetTokens = EFFORT_BUDGET_MAP[agent.effort];
        const response = await client.messages.create({
          model: modelId,
          max_tokens: useThinking ? budgetTokens + 6000 : 2048,
          system: agent.systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          ...(useThinking && {
            thinking: {
              type: "enabled" as const,
              budget_tokens: budgetTokens,
            },
          }),
        });

        text = response.content
          .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");
      }

      const data = parseAgentJSON(text);
      if (!data) {
        await send("agent_error", {
          agent: agent.name,
          index,
          error: "Failed to parse agent response",
        });
        return null;
      }

      let result: TryAgentResult;
      const modelId = getModelId(agent.model, tier);
      const validation = validateAgentEvaluation(data);

      if (validation.valid && validation.data) {
        const v = validation.data;
        result = {
          agent: agent.name,
          role: agent.role,
          scores: v.scores,
          composite: v.composite,
          grade: getGrade(v.composite),
          verdict: getVerdict(v.composite),
          strengths: v.strengths,
          weaknesses: v.weaknesses,
          critical_issues: v.critical_issues,
          action_items: v.action_items,
          one_line: v.one_line,
          model_used: modelId,
        };
      } else {
        const rawScores =
          typeof data.scores === "object" &&
          data.scores !== null &&
          !Array.isArray(data.scores)
            ? (data.scores as Record<string, unknown>)
            : {};
        const scores: Record<string, number> = {};
        for (const [k, v] of Object.entries(rawScores)) {
          if (typeof v === "number" && isFinite(v)) scores[k] = v;
        }
        const scoreValues = Object.values(scores);
        const composite =
          typeof data.composite === "number" && isFinite(data.composite)
            ? data.composite
            : scoreValues.length > 0
              ? Math.round(
                  scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length,
                )
              : 50;

        const extractStringArray = (val: unknown, len: number): string[] => {
          if (!Array.isArray(val)) return Array.from({ length: len }, () => "");
          return val.map((v) => (typeof v === "string" ? v : "")).slice(0, len);
        };

        const extractActionItems = (
          val: unknown,
        ): TryAgentResult["action_items"] => {
          if (!Array.isArray(val)) return [];
          return val
            .filter(
              (item): item is Record<string, unknown> =>
                typeof item === "object" && item !== null,
            )
            .map((item) => ({
              priority: typeof item.priority === "number" ? item.priority : 99,
              action: typeof item.action === "string" ? item.action : "",
              impact: typeof item.impact === "string" ? item.impact : "",
            }));
        };

        result = {
          agent: agent.name,
          role: agent.role,
          scores,
          composite,
          grade: getGrade(composite),
          verdict: getVerdict(composite),
          strengths: extractStringArray(data.strengths, 3) as [
            string,
            string,
            string,
          ],
          weaknesses: extractStringArray(data.weaknesses, 3) as [
            string,
            string,
            string,
          ],
          critical_issues: extractStringArray(
            data.critical_issues,
            Array.isArray(data.critical_issues)
              ? data.critical_issues.length
              : 0,
          ),
          action_items: extractActionItems(data.action_items),
          one_line: typeof data.one_line === "string" ? data.one_line : "",
          model_used: modelId,
        };
      }

      await send("agent_complete", { agent: agent.name, index, result });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await send("agent_error", { agent: agent.name, index, error: message });
      return null;
    }
  });

  const settled = await Promise.allSettled(agentPromises);
  const agentResults: TryAgentResult[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled" && s.value) {
      agentResults.push(s.value);
    }
  }

  if (agentResults.length < 3) {
    await send("error", {
      code: "INSUFFICIENT_AGENTS",
      message: `Only ${agentResults.length} of 6 agents completed. Need at least 3 for synthesis.`,
    });
    throw new Error("INSUFFICIENT_AGENTS");
  }

  return agentResults;
}
