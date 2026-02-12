import type Anthropic from "@anthropic-ai/sdk";
import type { TryAgentResult } from "@/lib/types";
import { getGrade, getVerdict } from "@/lib/types";
import { validateAgentEvaluation } from "@/lib/validate";
import { WEB_AGENTS, getModelId, EFFORT_BUDGET_MAP } from "@/lib/try-agents";
import type { SSESender } from "@/app/api/try/route";

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

/**
 * Run all 6 web agents in parallel. Returns completed agent results.
 * Throws if fewer than 3 agents succeed.
 */
export async function invokeAgents(
  client: Anthropic,
  userPrompt: string,
  tier: "free" | "byok",
  send: SSESender,
): Promise<TryAgentResult[]> {
  const agentPromises = WEB_AGENTS.map(async (agent, index) => {
    await send("agent_start", { agent: agent.name, index });

    try {
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

      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

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
        const scores = (data.scores ?? {}) as Record<string, number>;
        const composite =
          typeof data.composite === "number"
            ? data.composite
            : Math.round(
                Object.values(scores).reduce((a, b) => a + b, 0) /
                  Math.max(Object.keys(scores).length, 1),
              );

        result = {
          agent: agent.name,
          role: agent.role,
          scores,
          composite,
          grade: getGrade(composite),
          verdict: getVerdict(composite),
          strengths: (data.strengths as [string, string, string]) ?? [
            "",
            "",
            "",
          ],
          weaknesses: (data.weaknesses as [string, string, string]) ?? [
            "",
            "",
            "",
          ],
          critical_issues: (data.critical_issues as string[]) ?? [],
          action_items:
            (data.action_items as TryAgentResult["action_items"]) ?? [],
          one_line: (data.one_line as string) ?? "",
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
