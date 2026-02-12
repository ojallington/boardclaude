import type Anthropic from "@anthropic-ai/sdk";
import type {
  TryAgentResult,
  DebateExchange,
  DebateResult,
  ScoreRevision,
  SSESender,
} from "@/lib/types";
import {
  WEB_AGENTS,
  DEBATE_REVISION_SCHEMA,
  getModelId,
} from "@/lib/try-agents";

const MAX_PAIRS = 3;
const DIVERGENCE_THRESHOLD = 10;
const SCORE_REVISION_BOUND = 5;

/** Extract text content from an Anthropic message response. */
function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** Parse REVISED: lines from agent response text. */
function parseRevisions(
  text: string,
  agent: string,
  originalScores: Record<string, number>,
): ScoreRevision[] {
  const revisions: ScoreRevision[] = [];
  const regex = /REVISED:\s*(\w+):\s*(\d+)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const criterion = match[1] ?? "";
    const scoreStr = match[2] ?? "";
    const newScore = parseInt(scoreStr, 10);
    if (!criterion) continue;
    const original = originalScores[criterion];
    if (original === undefined || isNaN(newScore)) continue;
    const delta = newScore - original;
    if (Math.abs(delta) > SCORE_REVISION_BOUND) continue;
    revisions.push({ agent, criterion, original, revised: newScore, delta });
  }
  return revisions;
}

/** Identify the top debate pairs by composite score delta. */
function identifyDebatePairs(
  results: TryAgentResult[],
): Array<{ a: TryAgentResult; b: TryAgentResult; delta: number }> {
  const pairs: Array<{ a: TryAgentResult; b: TryAgentResult; delta: number }> =
    [];

  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const ri = results[i];
      const rj = results[j];
      if (!ri || !rj) continue;
      const delta = Math.abs(ri.composite - rj.composite);
      if (delta >= DIVERGENCE_THRESHOLD) {
        const [a, b] = ri.composite >= rj.composite ? [ri, rj] : [rj, ri];
        pairs.push({ a, b, delta });
      }
    }
  }

  pairs.sort((x, y) => y.delta - x.delta);
  return pairs.slice(0, MAX_PAIRS);
}

/**
 * Run a multi-pair sequential debate between divergent agents.
 * For BYOK tier only. Returns a DebateResult with exchanges, revisions,
 * and a formatted transcript for synthesis.
 */
export async function runDebate(
  client: Anthropic,
  agentResults: TryAgentResult[],
  userPrompt: string,
  tier: "free" | "byok",
  send: SSESender,
): Promise<DebateResult> {
  const emptyResult: DebateResult = {
    exchanges: [],
    revisions: [],
    transcript: "",
    pairs_debated: 0,
    scores_revised: 0,
  };

  if (agentResults.length < 4 || tier !== "byok") return emptyResult;

  const pairs = identifyDebatePairs(agentResults);
  if (pairs.length === 0) return emptyResult;

  await send("status", { phase: "debating" });

  const debateModel = getModelId("opus", tier);
  const allExchanges: DebateExchange[] = [];
  const allRevisions: ScoreRevision[] = [];
  const transcriptParts: string[] = ["\n## Debate Round\n"];

  for (const { a, b } of pairs) {
    const agentA = WEB_AGENTS.find((w) => w.name === a.agent);
    const agentB = WEB_AGENTS.find((w) => w.name === b.agent);
    if (!agentA || !agentB) continue;

    // Find the most divergent criterion pair between these two agents
    const criterionA = Object.entries(a.scores).sort(
      ([, v1], [, v2]) => v2 - v1,
    )[0];
    const criterionB = Object.entries(b.scores).sort(
      ([, v1], [, v2]) => v1 - v2,
    )[0];

    // Step 1: Agent A responds to Agent B's evaluation
    const promptForA = `Another evaluator (${b.agent}, ${b.role}) scored this project ${b.composite}/100 with verdict ${b.verdict}.\nTheir strengths: ${b.strengths.join("; ")}.\nTheir weaknesses: ${b.weaknesses.join("; ")}.\n\nYou scored it ${a.composite}/100. In 2-3 sentences, respond to their assessment — where do you agree, where do you disagree, and why?\n\n${DEBATE_REVISION_SCHEMA}`;

    let responseA = "";
    try {
      const replyA = await client.messages.create({
        model: debateModel,
        max_tokens: 512,
        system: agentA.systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
          {
            role: "assistant",
            content: JSON.stringify({
              scores: a.scores,
              composite: a.composite,
              one_line: a.one_line,
            }),
          },
          { role: "user", content: promptForA },
        ],
      });
      responseA = extractText(replyA);
    } catch {
      // Agent A failed, skip this pair
      continue;
    }

    await send("debate_exchange", {
      agent: a.agent,
      responding_to: b.agent,
      response: responseA,
    });

    // Step 2: Agent B responds to Agent A's specific response
    const promptForB = `${a.agent} (${a.role}, scored ${a.composite}/100) responded to your evaluation:\n\n"${responseA}"\n\nYour counter-response in 2-3 sentences — where do you agree, where do you push back?\n\n${DEBATE_REVISION_SCHEMA}`;

    let responseB = "";
    try {
      const replyB = await client.messages.create({
        model: debateModel,
        max_tokens: 512,
        system: agentB.systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
          {
            role: "assistant",
            content: JSON.stringify({
              scores: b.scores,
              composite: b.composite,
              one_line: b.one_line,
            }),
          },
          { role: "user", content: promptForB },
        ],
      });
      responseB = extractText(replyB);
    } catch {
      // Agent B failed, record partial exchange
    }

    if (responseB) {
      await send("debate_exchange", {
        agent: b.agent,
        responding_to: a.agent,
        response: responseB,
      });
    }

    // Parse revisions from both responses
    const revisionsA = parseRevisions(responseA, a.agent, a.scores);
    const revisionsB = responseB
      ? parseRevisions(responseB, b.agent, b.scores)
      : [];
    const pairRevisions = [...revisionsA, ...revisionsB];

    for (const rev of pairRevisions) {
      await send("debate_score_revision", {
        agent: rev.agent,
        criterion: rev.criterion,
        original: rev.original,
        revised: rev.revised,
        delta: rev.delta,
      });
    }

    const exchange: DebateExchange = {
      agent_a: a.agent,
      agent_b: b.agent,
      criterion_a: criterionA?.[0] ?? "composite",
      criterion_b: criterionB?.[0] ?? "composite",
      score_a: a.composite,
      score_b: b.composite,
      response_a: responseA,
      response_b: responseB,
      revisions: pairRevisions,
    };

    allExchanges.push(exchange);
    allRevisions.push(...pairRevisions);

    // Build transcript segment
    transcriptParts.push(
      `### ${a.agent} (scored ${a.composite}) responds to ${b.agent} (scored ${b.composite}):\n${responseA}\n`,
    );
    if (responseB) {
      transcriptParts.push(
        `### ${b.agent} (scored ${b.composite}) counter-response:\n${responseB}\n`,
      );
    }
    if (pairRevisions.length > 0) {
      transcriptParts.push(
        `**Score revisions**: ${pairRevisions.map((r) => `${r.agent} revised ${r.criterion}: ${r.original} → ${r.revised}`).join("; ")}\n`,
      );
    }
  }

  await send("debate_complete", {
    pairs_debated: allExchanges.length,
    scores_revised: allRevisions.length,
  });

  return {
    exchanges: allExchanges,
    revisions: allRevisions,
    transcript: transcriptParts.join("\n"),
    pairs_debated: allExchanges.length,
    scores_revised: allRevisions.length,
  };
}
