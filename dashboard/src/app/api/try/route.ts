import Anthropic from "@anthropic-ai/sdk";
import { parseGitHubUrl, fetchRepoContents } from "@/lib/github";
import { REVIEWER_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/try-prompt";
import { checkRateLimit } from "@/lib/rate-limit";
import { getGrade, getVerdict } from "@/lib/types";
import type { TryResult, RadarData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MODEL_MAP: Record<string, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-5-20250929",
  opus: "claude-opus-4-6",
};

function sendSSE(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  event: string,
  data: unknown,
) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return writer.write(encoder.encode(payload));
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array>();
  const writer = writable.getWriter();

  // Start the async processing in background
  (async () => {
    try {
      // Parse request body
      const body = (await request.json()) as {
        url?: string;
        apiKey?: string;
        model?: string;
      };

      const url = body.url?.trim();
      if (!url) {
        await sendSSE(writer, encoder, "error", {
          code: "INVALID_URL",
          message: "URL is required.",
        });
        return;
      }

      // Parse GitHub URL
      const parsed = parseGitHubUrl(url);
      if (!parsed) {
        await sendSSE(writer, encoder, "error", {
          code: "INVALID_URL",
          message: "Please enter a valid GitHub repository URL.",
        });
        return;
      }

      // Rate limiting
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown";
      const tier = body.apiKey ? "byok" : "free";
      const rateCheck = checkRateLimit(ip, tier);
      if (!rateCheck.allowed) {
        await sendSSE(writer, encoder, "error", {
          code: "RATE_LIMITED",
          message:
            "Rate limit reached. Try again later or use your own API key.",
          retryable: false,
        });
        return;
      }

      // Validate BYOK key format
      if (body.apiKey && !body.apiKey.startsWith("sk-ant-")) {
        await sendSSE(writer, encoder, "error", {
          code: "INVALID_API_KEY",
          message: "Invalid API key. Keys should start with sk-ant-.",
        });
        return;
      }

      // Determine model
      const modelKey = body.apiKey ? (body.model ?? "haiku") : "haiku";
      const modelId = MODEL_MAP[modelKey] ?? "claude-haiku-4-5-20251001";

      // Phase: fetching
      await sendSSE(writer, encoder, "status", {
        phase: "fetching",
        repo: { owner: parsed.owner, name: parsed.repo },
      });

      // Fetch repo contents
      let repoData;
      try {
        repoData = await fetchRepoContents(parsed.owner, parsed.repo);
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

      // Phase: reviewing
      await sendSSE(writer, encoder, "status", {
        phase: "reviewing",
        agent: "reviewer",
        model: modelKey,
      });

      // Call Anthropic API
      const apiKey = body.apiKey ?? process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        await sendSSE(writer, encoder, "error", {
          code: "NO_API_KEY",
          message: "No API key configured. Please use your own API key.",
        });
        return;
      }

      const client = new Anthropic({ apiKey });
      const userPrompt = buildUserPrompt(
        repoData.meta,
        repoData.files,
        repoData.treeSize,
      );

      let responseText = "";
      const stream = await client.messages.stream({
        model: modelId,
        max_tokens: 4096,
        system: REVIEWER_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          responseText += event.delta.text;
        }
      }

      // Parse the response
      let reviewData;
      try {
        // Try to extract JSON from response (handle markdown code blocks)
        let jsonStr = responseText.trim();
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr
            .replace(/^```(?:json)?\n?/, "")
            .replace(/\n?```$/, "");
        }
        reviewData = JSON.parse(jsonStr);
      } catch {
        await sendSSE(writer, encoder, "error", {
          code: "PARSE_FAILED",
          message: "Failed to parse review response.",
        });
        return;
      }

      // Build radar data
      const scores = reviewData.scores as Record<string, number>;
      const radar: RadarData = {
        architecture: scores.architecture ?? 0,
        product: scores.product ?? 0,
        innovation: scores.innovation ?? 0,
        code_quality: scores.code_quality ?? 0,
        documentation: scores.documentation ?? 0,
        integration: scores.integration ?? 0,
      };

      const composite =
        reviewData.composite ??
        Math.round(Object.values(radar).reduce((a, b) => a + b, 0) / 6);

      const result: TryResult = {
        repo: repoData.meta,
        agent: "reviewer",
        scores,
        composite,
        grade: getGrade(composite),
        verdict: getVerdict(composite),
        strengths: reviewData.strengths ?? ["", "", ""],
        weaknesses: reviewData.weaknesses ?? ["", "", ""],
        critical_issues: reviewData.critical_issues ?? [],
        action_items: reviewData.action_items ?? [],
        one_line: reviewData.one_line ?? "",
        radar,
        files_analyzed: repoData.totalFiles,
        timestamp: new Date().toISOString(),
        model_used: modelKey,
      };

      // Send partial events for progressive UI
      await sendSSE(writer, encoder, "partial", {
        field: "one_line",
        value: result.one_line,
      });
      await sendSSE(writer, encoder, "partial", {
        field: "scores",
        value: result.scores,
      });
      await sendSSE(writer, encoder, "partial", {
        field: "verdict",
        value: result.verdict,
      });

      // Send complete result
      await sendSSE(writer, encoder, "complete", result);
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
