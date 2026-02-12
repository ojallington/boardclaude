import type Anthropic from "@anthropic-ai/sdk";
import type { TryAgentResult } from "@/lib/types";
import { WEB_AGENTS, getModelId } from "@/lib/try-agents";
import type { SSESender } from "@/app/api/try/route";

/**
 * Run a lightweight debate round between the highest and lowest scoring
 * agents. For BYOK tier with 4+ agents and a sufficient score delta.
 * Returns debate transcript string to append to synthesis prompt.
 */
export async function runDebate(
  client: Anthropic,
  agentResults: TryAgentResult[],
  userPrompt: string,
  tier: "free" | "byok",
  send: SSESender,
): Promise<string> {
  if (agentResults.length < 4 || tier !== "byok") return "";

  await send("status", { phase: "debating" });

  const sorted = [...agentResults].sort((a, b) => b.composite - a.composite);
  const high = sorted[0];
  const low = sorted[sorted.length - 1];

  if (
    !high ||
    !low ||
    high.agent === low.agent ||
    high.composite - low.composite < 5
  ) {
    return "";
  }

  const debatePrompt = (self: TryAgentResult, other: TryAgentResult) =>
    `Another evaluator (${other.agent}, ${other.role}) scored this project ${other.composite}/100 with verdict ${other.verdict}. Their strengths: ${other.strengths.join("; ")}. Their weaknesses: ${other.weaknesses.join("; ")}.\n\nYou scored it ${self.composite}/100. In 2-3 sentences, respond to their assessment — where do you agree, where do you disagree, and why?`;

  const highAgent = WEB_AGENTS.find((a) => a.name === high.agent);
  const lowAgent = WEB_AGENTS.find((a) => a.name === low.agent);

  if (!highAgent || !lowAgent) return "";

  const debateModel = getModelId("opus", tier);
  const [highReply, lowReply] = await Promise.allSettled([
    client.messages.create({
      model: debateModel,
      max_tokens: 512,
      system: highAgent.systemPrompt,
      messages: [
        { role: "user", content: userPrompt },
        {
          role: "assistant",
          content: JSON.stringify({
            scores: high.scores,
            composite: high.composite,
            one_line: high.one_line,
          }),
        },
        { role: "user", content: debatePrompt(high, low) },
      ],
    }),
    client.messages.create({
      model: debateModel,
      max_tokens: 512,
      system: lowAgent.systemPrompt,
      messages: [
        { role: "user", content: userPrompt },
        {
          role: "assistant",
          content: JSON.stringify({
            scores: low.scores,
            composite: low.composite,
            one_line: low.one_line,
          }),
        },
        { role: "user", content: debatePrompt(low, high) },
      ],
    }),
  ]);

  const highText =
    highReply.status === "fulfilled"
      ? highReply.value.content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("")
      : "";
  const lowText =
    lowReply.status === "fulfilled"
      ? lowReply.value.content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("")
      : "";

  if (!highText && !lowText) return "";

  const transcript = `\n## Debate Round\n\n### ${high.agent} (scored ${high.composite}) responds to ${low.agent} (scored ${low.composite}):\n${highText}\n\n### ${low.agent} (scored ${low.composite}) responds to ${high.agent} (scored ${high.composite}):\n${lowText}\n`;

  await send("debate", {
    high_agent: high.agent,
    low_agent: low.agent,
    delta: high.composite - low.composite,
  });

  return transcript;
}
