import type Anthropic from "@anthropic-ai/sdk";
import type {
  TryAgentResult,
  TryPanelResult,
  RadarData,
  Highlights,
  DivergentOpinion,
  SynthesisActionItem,
  EffortLevel,
  ScoreRevision,
} from "@/lib/types";
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
import { isRecord } from "@/lib/type-guards";

// ─── Synthesis Data Validators ──────────────────────────────────────

/** Validate and extract a number from a record field, returning fallback on failure. */
export function extractNumber(
  obj: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const val = obj[key];
  return typeof val === "number" && isFinite(val) ? val : fallback;
}

/** Validate radar data from LLM output, falling back to score for missing axes. */
export function extractRadar(
  synthesisData: Record<string, unknown>,
  fallbackScore: number,
): RadarData {
  const comp = isRecord(synthesisData.composite)
    ? synthesisData.composite
    : null;
  const radar = comp !== null && isRecord(comp.radar) ? comp.radar : null;

  if (radar === null) {
    return {
      architecture: fallbackScore,
      product: fallbackScore,
      innovation: fallbackScore,
      code_quality: fallbackScore,
      documentation: fallbackScore,
      integration: fallbackScore,
    };
  }

  return {
    architecture: extractNumber(radar, "architecture", fallbackScore),
    product: extractNumber(radar, "product", fallbackScore),
    innovation: extractNumber(radar, "innovation", fallbackScore),
    code_quality: extractNumber(radar, "code_quality", fallbackScore),
    documentation: extractNumber(radar, "documentation", fallbackScore),
    integration: extractNumber(radar, "integration", fallbackScore),
  };
}

/** Validate a string array from unknown data, returning empty on failure. */
export function extractStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

const VALID_EFFORT_LEVELS = new Set<string>(["low", "medium", "high", "max"]);

/** Validate a single DivergentOpinion from unknown data. */
export function extractDivergentOpinion(
  value: unknown,
): DivergentOpinion | null {
  if (!isRecord(value)) return null;
  if (typeof value.topic !== "string") return null;
  if (typeof value.analysis !== "string") return null;

  const agentA = isRecord(value.agent_a) ? value.agent_a : null;
  const agentB = isRecord(value.agent_b) ? value.agent_b : null;
  if (
    agentA === null ||
    typeof agentA.agent !== "string" ||
    typeof agentA.position !== "string"
  )
    return null;
  if (
    agentB === null ||
    typeof agentB.agent !== "string" ||
    typeof agentB.position !== "string"
  )
    return null;

  return {
    topic: value.topic,
    analysis: value.analysis,
    agent_a: { agent: agentA.agent, position: agentA.position },
    agent_b: { agent: agentB.agent, position: agentB.position },
  };
}

/** Validate highlights from LLM output, returning safe defaults on failure. */
export function extractHighlights(
  synthesisData: Record<string, unknown>,
): Highlights {
  const raw = isRecord(synthesisData.highlights)
    ? synthesisData.highlights
    : null;

  if (raw === null) {
    return {
      top_strengths: [],
      top_weaknesses: [],
      divergent_opinions: [],
    };
  }

  const divergentRaw = Array.isArray(raw.divergent_opinions)
    ? raw.divergent_opinions
    : [];
  const divergentOpinions: DivergentOpinion[] = [];
  for (const item of divergentRaw) {
    const validated = extractDivergentOpinion(item);
    if (validated !== null) {
      divergentOpinions.push(validated);
    }
  }

  return {
    top_strengths: extractStringArray(raw.top_strengths),
    top_weaknesses: extractStringArray(raw.top_weaknesses),
    divergent_opinions: divergentOpinions,
  };
}

/** Validate a single SynthesisActionItem from unknown data. */
export function extractSynthesisActionItem(
  value: unknown,
): SynthesisActionItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.priority !== "number") return null;
  if (typeof value.action !== "string") return null;
  if (typeof value.impact !== "string") return null;

  const sourceAgents = Array.isArray(value.source_agents)
    ? value.source_agents.filter((s): s is string => typeof s === "string")
    : [];

  const effort: EffortLevel =
    typeof value.effort === "string" && VALID_EFFORT_LEVELS.has(value.effort)
      ? (value.effort as EffortLevel)
      : "medium";

  return {
    priority: value.priority,
    action: value.action,
    source_agents: sourceAgents,
    impact: value.impact,
    effort,
  };
}

/** Validate action items array from LLM output, dropping invalid entries. */
export function extractActionItems(
  synthesisData: Record<string, unknown>,
): SynthesisActionItem[] {
  if (!Array.isArray(synthesisData.action_items)) return [];

  const result: SynthesisActionItem[] = [];
  for (const item of synthesisData.action_items) {
    const validated = extractSynthesisActionItem(item);
    if (validated !== null) {
      result.push(validated);
    }
  }
  return result;
}

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
  revisions: ScoreRevision[] = [],
): Promise<TryPanelResult> {
  await send("status", { phase: "synthesizing" });

  const weights: Record<string, number> = {};
  for (const a of WEB_AGENTS) {
    weights[a.name] = a.panelWeight;
  }

  // Build structured revision summary for synthesis context
  let revisionContext = "";
  if (revisions.length > 0) {
    const lines = ["\n## Debate Score Revisions\n"];
    lines.push(
      "The following scores were revised by agents after debate. These revised scores are already reflected in the agent evaluations above. Factor these revisions into your synthesis — they represent considered adjustments after peer challenge.\n",
    );
    for (const rev of revisions) {
      const direction = rev.delta > 0 ? "+" : "";
      lines.push(
        `- **${rev.agent}** revised **${rev.criterion}**: ${rev.original} → ${rev.revised} (${direction}${rev.delta})`,
      );
    }
    lines.push("");
    revisionContext = lines.join("\n");
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
    ) +
    revisionContext +
    debateTranscript;

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
  // Compute weighted fallback score from agent results
  const weightedSum = agentResults.reduce((sum, r) => {
    const w = weights[r.agent] ?? 1 / agentResults.length;
    return sum + r.composite * w;
  }, 0);
  const totalWeight = agentResults.reduce(
    (sum, r) => sum + (weights[r.agent] ?? 1 / agentResults.length),
    0,
  );
  const fallbackScore = Math.round(weightedSum / totalWeight);

  // Extract composite score with validated field access
  const comp = isRecord(synthesisData.composite)
    ? synthesisData.composite
    : null;
  const score =
    comp !== null && typeof comp.score === "number" && isFinite(comp.score)
      ? comp.score
      : fallbackScore;

  // Extract radar, highlights, and action items with full validation
  const radar = extractRadar(synthesisData, score);
  const highlights = extractHighlights(synthesisData);
  const actionItems = extractActionItems(synthesisData);

  return {
    audit_id: auditId,
    repo: repoData.meta,
    panel: "web-judges",
    timestamp: ts,
    agents: agentResults,
    composite: {
      score,
      radar,
      grade: getGrade(score),
      verdict: getVerdict(score),
    },
    highlights,
    action_items: actionItems,
    files_analyzed: repoData.totalFiles,
    files_detail: repoData.filesDetail,
    tier,
  };
}
