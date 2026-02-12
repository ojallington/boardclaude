import type Anthropic from "@anthropic-ai/sdk";
import type { TryAgentResult, TryPanelResult } from "@/lib/types";
import { getGrade, getVerdict } from "@/lib/types";
import {
  WEB_AGENTS,
  SYNTHESIS_PROMPT,
  buildSynthesisUserPrompt,
  getModelId,
} from "@/lib/try-agents";
import { saveWebReview } from "@/lib/try-storage";
import type { FetchedRepo } from "@/lib/github";
import type { SSESender } from "@/app/api/try/route";

function parseJSON(text: string): Record<string, unknown> | null {
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

function buildAuditId(): { auditId: string; ts: string } {
  const now = new Date();
  const ts = now.toISOString();
  const auditId = `web-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return { auditId, ts };
}

/**
 * Run synthesis on completed agent results, save the review, and send
 * the final complete SSE event. Returns the TryPanelResult.
 */
export async function synthesizeResults(
  client: Anthropic,
  agentResults: TryAgentResult[],
  debateTranscript: string,
  repoData: FetchedRepo,
  tier: "free" | "byok",
  send: SSESender,
): Promise<TryPanelResult> {
  await send("status", { phase: "synthesizing" });

  const weights: Record<string, number> = {};
  for (const a of WEB_AGENTS) {
    weights[a.name] = a.panelWeight;
  }

  const synthesisUserPrompt =
    buildSynthesisUserPrompt(
      agentResults.map((r) => ({
        agent: r.agent,
        role: r.role,
        result: {
          scores: r.scores,
          composite: r.composite,
          grade: r.grade,
          verdict: r.verdict,
          strengths: r.strengths,
          weaknesses: r.weaknesses,
          critical_issues: r.critical_issues,
          action_items: r.action_items,
          one_line: r.one_line,
        },
      })),
      weights,
    ) + debateTranscript;

  const synthesisModelId = getModelId("sonnet", tier);
  const synthesisResponse = await client.messages.create({
    model: synthesisModelId,
    max_tokens: 2048,
    system: SYNTHESIS_PROMPT,
    messages: [{ role: "user", content: synthesisUserPrompt }],
  });

  const synthesisText = synthesisResponse.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const synthesisData = parseJSON(synthesisText);
  const { auditId, ts } = buildAuditId();

  let panelResult: TryPanelResult;

  if (!synthesisData) {
    panelResult = buildFallbackResult(
      auditId,
      ts,
      agentResults,
      weights,
      repoData,
      tier,
    );
  } else {
    panelResult = buildSynthesizedResult(
      auditId,
      ts,
      synthesisData,
      agentResults,
      weights,
      repoData,
      tier,
    );
  }

  saveWebReview(panelResult).catch(() => {});
  await send("complete", panelResult);
  return panelResult;
}

function buildFallbackResult(
  auditId: string,
  ts: string,
  agentResults: TryAgentResult[],
  weights: Record<string, number>,
  repoData: FetchedRepo,
  tier: "free" | "byok",
): TryPanelResult {
  const weightedScore = agentResults.reduce((sum, r) => {
    const w = weights[r.agent] ?? 1 / agentResults.length;
    return sum + r.composite * w;
  }, 0);
  const totalWeight = agentResults.reduce(
    (sum, r) => sum + (weights[r.agent] ?? 1 / agentResults.length),
    0,
  );
  const fallbackScore = Math.round(weightedScore / totalWeight);

  return {
    audit_id: auditId,
    repo: repoData.meta,
    panel: "web-judges",
    timestamp: ts,
    agents: agentResults,
    composite: {
      score: fallbackScore,
      radar: {
        architecture:
          agentResults.find((a) => a.agent === "boris")?.composite ??
          fallbackScore,
        product:
          agentResults.find((a) => a.agent === "cat")?.composite ??
          fallbackScore,
        innovation:
          agentResults.find((a) => a.agent === "thariq")?.composite ??
          fallbackScore,
        code_quality:
          agentResults.find((a) => a.agent === "lydia")?.composite ??
          fallbackScore,
        documentation:
          agentResults.find((a) => a.agent === "ado")?.composite ??
          fallbackScore,
        integration:
          agentResults.find((a) => a.agent === "jason")?.composite ??
          fallbackScore,
      },
      grade: getGrade(fallbackScore),
      verdict: getVerdict(fallbackScore),
    },
    highlights: {
      top_strengths: agentResults.slice(0, 3).map((a) => a.strengths[0]),
      top_weaknesses: agentResults.slice(0, 3).map((a) => a.weaknesses[0]),
      divergent_opinions: [],
    },
    action_items: [],
    files_analyzed: repoData.totalFiles,
    files_detail: repoData.filesDetail,
    tier,
  };
}

function buildSynthesizedResult(
  auditId: string,
  ts: string,
  synthesisData: Record<string, unknown>,
  agentResults: TryAgentResult[],
  weights: Record<string, number>,
  repoData: FetchedRepo,
  tier: "free" | "byok",
): TryPanelResult {
  const comp = synthesisData.composite as Record<string, unknown>;
  const radar = (comp?.radar ?? {}) as Record<string, number>;
  const score =
    typeof comp?.score === "number"
      ? comp.score
      : Math.round(
          agentResults.reduce((sum, r) => {
            const w = weights[r.agent] ?? 1 / agentResults.length;
            return sum + r.composite * w;
          }, 0) /
            agentResults.reduce(
              (sum, r) => sum + (weights[r.agent] ?? 1 / agentResults.length),
              0,
            ),
        );

  const highlights = (synthesisData.highlights ?? {}) as Record<
    string,
    unknown
  >;

  return {
    audit_id: auditId,
    repo: repoData.meta,
    panel: "web-judges",
    timestamp: ts,
    agents: agentResults,
    composite: {
      score,
      radar: {
        architecture: radar.architecture ?? score,
        product: radar.product ?? score,
        innovation: radar.innovation ?? score,
        code_quality: radar.code_quality ?? score,
        documentation: radar.documentation ?? score,
        integration: radar.integration ?? score,
      },
      grade: getGrade(score),
      verdict: getVerdict(score),
    },
    highlights: {
      top_strengths: (highlights.top_strengths as string[]) ?? [],
      top_weaknesses: (highlights.top_weaknesses as string[]) ?? [],
      divergent_opinions:
        (highlights.divergent_opinions as TryPanelResult["highlights"]["divergent_opinions"]) ??
        [],
    },
    action_items:
      (synthesisData.action_items as TryPanelResult["action_items"]) ?? [],
    files_analyzed: repoData.totalFiles,
    files_detail: repoData.filesDetail,
    tier,
  };
}
