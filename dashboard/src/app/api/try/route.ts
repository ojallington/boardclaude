import Anthropic from "@anthropic-ai/sdk";
import { parseGitHubUrl, fetchRepoContents } from "@/lib/github";
import { buildUserPrompt, buildCrossIterationContext } from "@/lib/try-prompt";
import { checkRateLimit } from "@/lib/rate-limit";
import { WEB_AGENTS } from "@/lib/try-agents";
import { getPreviousReviewForRepo } from "@/lib/try-storage";
import { invokeAgents } from "@/lib/try-invoke";
import { runDebate } from "@/lib/try-debate";
import { synthesizeResults } from "@/lib/try-synthesize";
import type { TryAgentResult, ScoreRevision } from "@/lib/types";
import { getGrade, getVerdict } from "@/lib/types";
import { MetricsCollector } from "@/lib/try-metrics";
import type { DebateMetric } from "@/lib/try-metrics";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Shared SSE sender type used by try-invoke, try-debate, try-synthesize. */
export type SSESender = (event: string, data: unknown) => Promise<void>;

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array>();
  const writer = writable.getWriter();

  const send: SSESender = (event, data) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    return writer.write(encoder.encode(payload));
  };

  (async () => {
    try {
      const body = (await request.json()) as {
        url?: string;
        apiKey?: string;
      };

      const url = body.url?.trim();
      if (!url) {
        await send("error", {
          code: "INVALID_URL",
          message: "URL is required.",
        });
        return;
      }

      const parsed = parseGitHubUrl(url);
      if (!parsed) {
        await send("error", {
          code: "INVALID_URL",
          message: "Please enter a valid GitHub repository URL.",
        });
        return;
      }

      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown";
      const tier = body.apiKey ? ("byok" as const) : ("free" as const);
      const rateCheck = await checkRateLimit(ip, tier);
      if (!rateCheck.allowed) {
        await send("error", {
          code: "RATE_LIMITED",
          message:
            "Rate limit reached. Try again later or use your own API key.",
          retryable: false,
        });
        return;
      }

      if (body.apiKey && !body.apiKey.startsWith("sk-ant-")) {
        await send("error", {
          code: "INVALID_API_KEY",
          message: "Invalid API key. Keys should start with sk-ant-.",
        });
        return;
      }

      // Phase: fetching
      await send("status", {
        phase: "fetching",
        repo: { owner: parsed.owner, name: parsed.repo },
      });

      let repoData;
      try {
        repoData = await fetchRepoContents(parsed.owner, parsed.repo, tier);
      } catch (err) {
        const message =
          err instanceof Error && err.message === "REPO_NOT_FOUND"
            ? "Repository not found. Make sure it exists and is public."
            : "Failed to fetch repository contents.";
        await send("error", { code: "FETCH_FAILED", message });
        return;
      }

      // Cross-iteration context
      let crossIterationContext = "";
      try {
        const priorReview = await getPreviousReviewForRepo(
          parsed.owner,
          parsed.repo,
        );
        if (priorReview) {
          crossIterationContext = buildCrossIterationContext(priorReview);
        }
      } catch {
        // Non-critical
      }

      // Phase: reviewing
      await send("status", {
        phase: "reviewing",
        total: WEB_AGENTS.length,
        tier,
        hasPriorReview: crossIterationContext.length > 0,
      });

      const apiKey = body.apiKey ?? process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        await send("error", {
          code: "NO_API_KEY",
          message: "No API key configured. Please use your own API key.",
        });
        return;
      }

      const client = new Anthropic({ apiKey });
      const userPrompt =
        buildUserPrompt(repoData.meta, repoData.files, repoData.treeSize) +
        crossIterationContext;

      // Metrics collection: intercept SSE events to record tool use / agent outcomes
      const collector = new MetricsCollector(tier);
      const instrumentedSend: SSESender = async (event, data) => {
        if (
          event === "agent_tool_use" &&
          typeof data === "object" &&
          data !== null
        ) {
          const d = data as Record<string, unknown>;
          if (typeof d.agent === "string" && typeof d.tool === "string") {
            collector.recordToolCall(d.agent, d.tool);
          }
        } else if (event === "agent_complete") {
          collector.recordAgentComplete();
        } else if (event === "agent_error") {
          collector.recordAgentFailed();
        } else if (
          event === "complete" &&
          typeof data === "object" &&
          data !== null
        ) {
          const result = data as Record<string, unknown>;
          result.metrics = collector.finalize(WEB_AGENTS.length);
        }
        return send(event, data);
      };

      // Phase: agent invocation (tool-enabled agents get file access)
      const agentResults = await invokeAgents(
        client,
        userPrompt,
        tier,
        instrumentedSend,
        repoData.files,
      );

      // Phase: debate (BYOK only, multi-pair sequential)
      const debateResult = await runDebate(
        client,
        agentResults,
        userPrompt,
        tier,
        instrumentedSend,
      );

      // Record debate metrics if a debate occurred
      if (debateResult.pairs_debated > 0) {
        const debateMetric: DebateMetric = {
          pairs_examined: debateResult.pairs_debated,
          revisions_applied: debateResult.scores_revised,
          revisions: debateResult.revisions.map((r) => ({
            agent: r.agent,
            criterion: r.criterion,
            old_score: r.original,
            new_score: r.revised,
          })),
        };
        collector.recordDebate(debateMetric);
      }

      // Apply score revisions from debate before synthesis
      const effectiveResults = applyRevisions(
        agentResults,
        debateResult.revisions,
      );

      // Phase: synthesis + save + complete event
      await synthesizeResults(
        client,
        effectiveResults,
        debateResult.transcript,
        repoData,
        tier,
        instrumentedSend,
        debateResult.revisions,
      );
    } catch (err) {
      if (err instanceof Error && err.message === "INSUFFICIENT_AGENTS") return;
      const message =
        err instanceof Anthropic.AuthenticationError
          ? "Invalid API key. Please check your key and try again."
          : "Review failed. Please try again.";
      try {
        await send("error", { code: "UNKNOWN", message });
      } catch {
        // Writer may be closed
      }
    } finally {
      try {
        await writer.close();
      } catch {
        // Already closed
      }
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Apply debate score revisions to agent results, producing a new array
 * with revised scores, composites, grades, and verdicts.
 */
function applyRevisions(
  agentResults: TryAgentResult[],
  revisions: ScoreRevision[],
): TryAgentResult[] {
  if (revisions.length === 0) return agentResults;

  // Group revisions by agent
  const revisionsByAgent = new Map<string, ScoreRevision[]>();
  for (const rev of revisions) {
    const existing = revisionsByAgent.get(rev.agent) ?? [];
    existing.push(rev);
    revisionsByAgent.set(rev.agent, existing);
  }

  return agentResults.map((result) => {
    const agentRevisions = revisionsByAgent.get(result.agent);
    if (!agentRevisions || agentRevisions.length === 0) return result;

    // Apply score revisions
    const newScores = { ...result.scores };
    for (const rev of agentRevisions) {
      if (rev.criterion in newScores) {
        newScores[rev.criterion] = rev.revised;
      }
    }

    // Recalculate composite from agent config weights
    const agentConfig = WEB_AGENTS.find((a) => a.name === result.agent);
    let newComposite = result.composite;
    if (agentConfig) {
      const scoreValues = Object.values(newScores);
      if (scoreValues.length > 0) {
        newComposite = Math.round(
          scoreValues.reduce((sum, v) => sum + v, 0) / scoreValues.length,
        );
      }
    }

    return {
      ...result,
      scores: newScores,
      composite: newComposite,
      grade: getGrade(newComposite),
      verdict: getVerdict(newComposite),
    };
  });
}
