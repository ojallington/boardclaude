import Anthropic from "@anthropic-ai/sdk";
import { parseGitHubUrl, fetchRepoContents } from "@/lib/github";
import { buildUserPrompt, buildCrossIterationContext } from "@/lib/try-prompt";
import { checkRateLimit } from "@/lib/rate-limit";
import { getGrade, getVerdict } from "@/lib/types";
import type { TryAgentResult, TryPanelResult } from "@/lib/types";
import { validateAgentEvaluation } from "@/lib/validate";
import {
  WEB_AGENTS,
  SYNTHESIS_PROMPT,
  buildSynthesisUserPrompt,
  getModelId,
  EFFORT_BUDGET_MAP,
} from "@/lib/try-agents";
import { saveWebReview, getPreviousReviewForRepo } from "@/lib/try-storage";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

function sendSSE(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  event: string,
  data: unknown,
) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return writer.write(encoder.encode(payload));
}

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

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array>();
  const writer = writable.getWriter();

  (async () => {
    try {
      const body = (await request.json()) as {
        url?: string;
        apiKey?: string;
      };

      const url = body.url?.trim();
      if (!url) {
        await sendSSE(writer, encoder, "error", {
          code: "INVALID_URL",
          message: "URL is required.",
        });
        return;
      }

      const parsed = parseGitHubUrl(url);
      if (!parsed) {
        await sendSSE(writer, encoder, "error", {
          code: "INVALID_URL",
          message: "Please enter a valid GitHub repository URL.",
        });
        return;
      }

      // Rate limiting (1 hit per panel, not per agent)
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown";
      const tier = body.apiKey ? "byok" : "free";
      const rateCheck = await checkRateLimit(ip, tier);
      if (!rateCheck.allowed) {
        await sendSSE(writer, encoder, "error", {
          code: "RATE_LIMITED",
          message:
            "Rate limit reached. Try again later or use your own API key.",
          retryable: false,
        });
        return;
      }

      if (body.apiKey && !body.apiKey.startsWith("sk-ant-")) {
        await sendSSE(writer, encoder, "error", {
          code: "INVALID_API_KEY",
          message: "Invalid API key. Keys should start with sk-ant-.",
        });
        return;
      }

      // Phase: fetching
      await sendSSE(writer, encoder, "status", {
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
        await sendSSE(writer, encoder, "error", {
          code: "FETCH_FAILED",
          message,
        });
        return;
      }

      // Cross-iteration context: check for previous reviews of the same repo
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
        // Non-critical — proceed without cross-iteration context
      }

      // Phase: reviewing
      await sendSSE(writer, encoder, "status", {
        phase: "reviewing",
        total: WEB_AGENTS.length,
        tier,
        hasPriorReview: crossIterationContext.length > 0,
      });

      const apiKey = body.apiKey ?? process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        await sendSSE(writer, encoder, "error", {
          code: "NO_API_KEY",
          message: "No API key configured. Please use your own API key.",
        });
        return;
      }

      const client = new Anthropic({ apiKey });
      const userPrompt =
        buildUserPrompt(repoData.meta, repoData.files, repoData.treeSize) +
        crossIterationContext;

      // Run 6 agents in parallel
      const agentPromises = WEB_AGENTS.map(async (agent, index) => {
        await sendSSE(writer, encoder, "agent_start", {
          agent: agent.name,
          index,
        });

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
            await sendSSE(writer, encoder, "agent_error", {
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
            // Fallback: best-effort construction from non-conforming JSON
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

          await sendSSE(writer, encoder, "agent_complete", {
            agent: agent.name,
            index,
            result,
          });

          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          await sendSSE(writer, encoder, "agent_error", {
            agent: agent.name,
            index,
            error: message,
          });
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
        await sendSSE(writer, encoder, "error", {
          code: "INSUFFICIENT_AGENTS",
          message: `Only ${agentResults.length} of 6 agents completed. Need at least 3 for synthesis.`,
        });
        return;
      }

      // Phase: debate (lightweight — top 2 divergent agents exchange views)
      let debateTranscript = "";
      if (agentResults.length >= 4 && tier === "byok") {
        await sendSSE(writer, encoder, "status", { phase: "debating" });

        const sorted = [...agentResults].sort(
          (a, b) => b.composite - a.composite,
        );
        const high = sorted[0];
        const low = sorted[sorted.length - 1];

        if (
          high &&
          low &&
          high.agent !== low.agent &&
          high.composite - low.composite >= 5
        ) {
          const debatePrompt = (self: TryAgentResult, other: TryAgentResult) =>
            `Another evaluator (${other.agent}, ${other.role}) scored this project ${other.composite}/100 with verdict ${other.verdict}. Their strengths: ${other.strengths.join("; ")}. Their weaknesses: ${other.weaknesses.join("; ")}.\n\nYou scored it ${self.composite}/100. In 2-3 sentences, respond to their assessment — where do you agree, where do you disagree, and why?`;

          const highAgent = WEB_AGENTS.find((a) => a.name === high.agent);
          const lowAgent = WEB_AGENTS.find((a) => a.name === low.agent);

          if (highAgent && lowAgent) {
            const debateModel = getModelId("sonnet", tier);
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

            if (highText || lowText) {
              debateTranscript = `\n## Debate Round\n\n### ${high.agent} (scored ${high.composite}) responds to ${low.agent} (scored ${low.composite}):\n${highText}\n\n### ${low.agent} (scored ${low.composite}) responds to ${high.agent} (scored ${high.composite}):\n${lowText}\n`;

              await sendSSE(writer, encoder, "debate", {
                high_agent: high.agent,
                low_agent: low.agent,
                delta: high.composite - low.composite,
              });
            }
          }
        }
      }

      // Phase: synthesizing
      await sendSSE(writer, encoder, "status", { phase: "synthesizing" });

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

      const synthesisData = parseAgentJSON(synthesisText);
      if (!synthesisData) {
        // Fallback: compute synthesis from agent results directly
        const weightedScore = agentResults.reduce((sum, r) => {
          const w = weights[r.agent] ?? 1 / agentResults.length;
          return sum + r.composite * w;
        }, 0);
        const fallbackScore = Math.round(
          weightedScore /
            agentResults.reduce(
              (sum, r) => sum + (weights[r.agent] ?? 1 / agentResults.length),
              0,
            ),
        );

        const now = new Date();
        const ts = now.toISOString();
        const auditId = `web-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

        const fallbackResult: TryPanelResult = {
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
            top_weaknesses: agentResults
              .slice(0, 3)
              .map((a) => a.weaknesses[0]),
            divergent_opinions: [],
          },
          action_items: [],
          files_analyzed: repoData.totalFiles,
          files_detail: repoData.filesDetail,
          tier,
        };

        saveWebReview(fallbackResult).catch(() => {});
        await sendSSE(writer, encoder, "complete", fallbackResult);
        return;
      }

      // Build full result from synthesis
      const now = new Date();
      const ts = now.toISOString();
      const auditId = `web-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

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
                  (sum, r) =>
                    sum + (weights[r.agent] ?? 1 / agentResults.length),
                  0,
                ),
            );

      const highlights = (synthesisData.highlights ?? {}) as Record<
        string,
        unknown
      >;

      const panelResult: TryPanelResult = {
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

      // Save result (fire-and-forget)
      saveWebReview(panelResult).catch(() => {});

      await sendSSE(writer, encoder, "complete", panelResult);
    } catch (err) {
      const message =
        err instanceof Anthropic.AuthenticationError
          ? "Invalid API key. Please check your key and try again."
          : "Review failed. Please try again.";
      try {
        await sendSSE(writer, encoder, "error", {
          code: "UNKNOWN",
          message,
        });
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
