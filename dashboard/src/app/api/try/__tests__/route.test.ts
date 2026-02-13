import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Shared mock so all Anthropic instances use the same function
const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = {
      create: mockCreate,
    };
  }
  class AuthenticationError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
      this.name = "AuthenticationError";
    }
  }
  (MockAnthropic as unknown as Record<string, unknown>).AuthenticationError =
    AuthenticationError;
  return { default: MockAnthropic, AuthenticationError };
});

vi.mock("@/lib/github", () => ({
  parseGitHubUrl: vi.fn(),
  fetchRepoContents: vi.fn(),
}));

vi.mock("@/lib/try-prompt", () => ({
  buildUserPrompt: vi.fn().mockReturnValue("mocked user prompt"),
  buildCrossIterationContext: vi.fn().mockReturnValue(""),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/try-agents", () => ({
  WEB_AGENTS: [
    {
      name: "boris",
      role: "Architecture",
      model: "opus" as const,
      effort: "high" as const,
      panelWeight: 0.2,
      systemPrompt: "You are Boris.",
    },
    {
      name: "cat",
      role: "Product",
      model: "opus" as const,
      effort: "medium" as const,
      panelWeight: 0.2,
      systemPrompt: "You are Cat.",
    },
    {
      name: "thariq",
      role: "Innovation",
      model: "opus" as const,
      effort: "max" as const,
      panelWeight: 0.2,
      systemPrompt: "You are Thariq.",
    },
    {
      name: "lydia",
      role: "Frontend",
      model: "opus" as const,
      effort: "high" as const,
      panelWeight: 0.2,
      systemPrompt: "You are Lydia.",
    },
    {
      name: "ado",
      role: "Docs",
      model: "sonnet" as const,
      effort: "medium" as const,
      panelWeight: 0.1,
      systemPrompt: "You are Ado.",
    },
    {
      name: "jason",
      role: "Integration",
      model: "sonnet" as const,
      effort: "medium" as const,
      panelWeight: 0.1,
      systemPrompt: "You are Jason.",
    },
  ],
  EFFORT_BUDGET_MAP: { max: 20000, high: 10000, medium: 5000, low: 2000 },
  analyzeRepoComplexity: () => 1.0,
  getAdaptiveBudget: (effort: string) => {
    const map: Record<string, number> = {
      max: 20000,
      high: 10000,
      medium: 5000,
      low: 2000,
    };
    return map[effort] ?? 5000;
  },
  SYNTHESIS_PROMPT: "You are the synthesis agent.",
  DEBATE_REVISION_SCHEMA:
    "If you want to revise scores, use REVISED: <criterion>: <score>",
  buildSynthesisUserPrompt: vi.fn().mockReturnValue("synthesis prompt"),
  getModelId: vi.fn().mockReturnValue("claude-haiku-4-5-20251001"),
}));

vi.mock("@/lib/try-storage", () => ({
  saveWebReview: vi.fn().mockResolvedValue(undefined),
  getPreviousReviewForRepo: vi.fn().mockResolvedValue(null),
}));

import { POST } from "../route";
import { parseGitHubUrl, fetchRepoContents } from "@/lib/github";
import { checkRateLimit } from "@/lib/rate-limit";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/try", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

async function readSSEEvents(response: Response): Promise<SSEEvent[]> {
  const text = await response.text();
  const events: SSEEvent[] = [];
  let currentEvent = "";

  for (const line of text.split("\n")) {
    if (line.startsWith("event: ")) {
      currentEvent = line.slice(7);
    } else if (line.startsWith("data: ")) {
      try {
        events.push({
          event: currentEvent,
          data: JSON.parse(line.slice(6)) as Record<string, unknown>,
        });
      } catch {
        // skip malformed
      }
    }
  }

  return events;
}

const MOCK_AGENT_JSON = JSON.stringify({
  scores: { architecture: 80, verification: 75 },
  composite: 77.5,
  grade: "B",
  verdict: "PASS",
  strengths: ["Good structure", "Clean code", "Nice docs"],
  weaknesses: ["Missing tests", "No CI", "Sparse README"],
  critical_issues: [],
  action_items: [{ priority: 1, action: "Add tests", impact: "+10 coverage" }],
  one_line: "Solid project with room to grow.",
});

const MOCK_SYNTHESIS_JSON = JSON.stringify({
  composite: {
    score: 78,
    radar: {
      architecture: 80,
      product: 76,
      innovation: 74,
      code_quality: 79,
      documentation: 77,
      integration: 75,
    },
    grade: "B",
    verdict: "PASS",
  },
  highlights: {
    top_strengths: ["Good structure", "Clean code", "Nice docs"],
    top_weaknesses: ["Missing tests", "No CI", "Sparse README"],
    divergent_opinions: [],
  },
  action_items: [
    {
      priority: 1,
      action: "Add tests",
      source_agents: ["boris"],
      impact: "+10",
      effort: "medium",
    },
  ],
});

function mockAnthropicSuccess() {
  let callCount = 0;
  mockCreate.mockImplementation(() => {
    callCount++;
    const text = callCount <= 6 ? MOCK_AGENT_JSON : MOCK_SYNTHESIS_JSON;
    return Promise.resolve({
      content: [{ type: "text", text }],
    });
  });
}

const MOCK_REPO_DATA = {
  meta: {
    owner: "test",
    name: "repo",
    description: "A test repo",
    language: "TypeScript",
    stars: 42,
  },
  files: [{ path: "README.md", content: "# Test" }],
  totalFiles: 1,
  treeSize: 10,
};

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

  (parseGitHubUrl as ReturnType<typeof vi.fn>).mockReturnValue({
    owner: "test",
    repo: "repo",
  });
  (fetchRepoContents as ReturnType<typeof vi.fn>).mockResolvedValue(
    MOCK_REPO_DATA,
  );
  (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
    allowed: true,
    remaining: 2,
    resetAt: Date.now() + 3600000,
  });
});

describe("POST /api/try", () => {
  it("returns error SSE when URL is missing", async () => {
    const res = await POST(makeRequest({}));
    const events = await readSSEEvents(res);

    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("error");
    expect(events[0]?.data.code).toBe("INVALID_URL");
  });

  it("returns error SSE when URL is empty string", async () => {
    const res = await POST(makeRequest({ url: "  " }));
    const events = await readSSEEvents(res);

    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("error");
    expect(events[0]?.data.code).toBe("INVALID_URL");
  });

  it("returns error SSE for invalid GitHub URL", async () => {
    (parseGitHubUrl as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const res = await POST(makeRequest({ url: "https://not-github.com/foo" }));
    const events = await readSSEEvents(res);

    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("error");
    expect(events[0]?.data.code).toBe("INVALID_URL");
    expect(events[0]?.data.message).toContain("valid GitHub");
  });

  it("returns error SSE when rate limited", async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 3600000,
    });

    const res = await POST(
      makeRequest({ url: "https://github.com/test/repo" }),
    );
    const events = await readSSEEvents(res);

    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("error");
    expect(events[0]?.data.code).toBe("RATE_LIMITED");
  });

  it("returns error SSE for invalid API key format", async () => {
    const res = await POST(
      makeRequest({
        url: "https://github.com/test/repo",
        apiKey: "bad-key-format",
      }),
    );
    const events = await readSSEEvents(res);

    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("error");
    expect(events[0]?.data.code).toBe("INVALID_API_KEY");
  });

  it("returns error SSE when repo fetch fails with REPO_NOT_FOUND", async () => {
    (fetchRepoContents as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("REPO_NOT_FOUND"),
    );

    const res = await POST(
      makeRequest({ url: "https://github.com/test/repo" }),
    );
    const events = await readSSEEvents(res);

    const errorEvent = events.find((e) => e.event === "error");
    expect(errorEvent?.data.code).toBe("FETCH_FAILED");
    expect(errorEvent?.data.message).toContain("not found");
  });

  it("returns error SSE when repo fetch fails with generic error", async () => {
    (fetchRepoContents as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );

    const res = await POST(
      makeRequest({ url: "https://github.com/test/repo" }),
    );
    const events = await readSSEEvents(res);

    const errorEvent = events.find((e) => e.event === "error");
    expect(errorEvent?.data.code).toBe("FETCH_FAILED");
    expect(errorEvent?.data.message).toContain("Failed to fetch");
  });

  it("returns error SSE when no API key is available", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const res = await POST(
      makeRequest({ url: "https://github.com/test/repo" }),
    );
    const events = await readSSEEvents(res);

    const errorEvent = events.find((e) => e.event === "error");
    expect(errorEvent?.data.code).toBe("NO_API_KEY");
  });

  it("runs full 6-agent review with correct SSE event sequence", async () => {
    // Use module-level mock - Anthropic constructor is mocked
    mockAnthropicSuccess();

    const res = await POST(
      makeRequest({ url: "https://github.com/test/repo" }),
    );
    const events = await readSSEEvents(res);

    // Check event types in order
    const eventTypes = events.map((e) => e.event);

    // Should start with fetching status
    expect(eventTypes[0]).toBe("status");
    expect(events[0]?.data.phase).toBe("fetching");

    // Then reviewing status
    expect(eventTypes[1]).toBe("status");
    expect(events[1]?.data.phase).toBe("reviewing");

    // Then 6 agent_start events
    const agentStarts = events.filter((e) => e.event === "agent_start");
    expect(agentStarts).toHaveLength(6);

    // Then agent_complete events
    const agentCompletes = events.filter((e) => e.event === "agent_complete");
    expect(agentCompletes).toHaveLength(6);

    // Synthesizing status
    const synthStatus = events.find(
      (e) => e.event === "status" && e.data.phase === "synthesizing",
    );
    expect(synthStatus).toBeDefined();

    // Finally complete event with full result
    const completeEvent = events.find((e) => e.event === "complete");
    expect(completeEvent).toBeDefined();
    expect(completeEvent?.data.audit_id).toBeDefined();
    expect(completeEvent?.data.panel).toBe("web-judges");
    expect(
      (completeEvent?.data.agents as Array<unknown>)?.length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("returns SSE headers", async () => {
    const res = await POST(makeRequest({}));
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
  });

  it("returns INSUFFICIENT_AGENTS when fewer than 3 succeed", async () => {
    // Make all agent calls fail
    mockCreate.mockRejectedValue(new Error("API error"));

    const res = await POST(
      makeRequest({ url: "https://github.com/test/repo" }),
    );
    const events = await readSSEEvents(res);

    const errorEvent = events.find((e) => e.event === "error");
    expect(errorEvent?.data.code).toBe("INSUFFICIENT_AGENTS");
  });

  it("uses fallback synthesis when synthesis parsing fails", async () => {
    let callCount = 0;
    mockCreate.mockImplementation(() => {
      callCount++;
      if (callCount <= 6) {
        return Promise.resolve({
          content: [{ type: "text", text: MOCK_AGENT_JSON }],
        });
      }
      // Synthesis returns unparseable response
      return Promise.resolve({
        content: [{ type: "text", text: "This is not JSON at all" }],
      });
    });

    const res = await POST(
      makeRequest({ url: "https://github.com/test/repo" }),
    );
    const events = await readSSEEvents(res);

    // Should still complete with fallback
    const completeEvent = events.find((e) => e.event === "complete");
    expect(completeEvent).toBeDefined();
    expect(completeEvent?.data.audit_id).toBeDefined();
    expect(completeEvent?.data.panel).toBe("web-judges");
  });

  it("handles agent returning JSON wrapped in code fences", async () => {
    let callCount = 0;
    mockCreate.mockImplementation(() => {
      callCount++;
      if (callCount <= 6) {
        return Promise.resolve({
          content: [
            { type: "text", text: "```json\n" + MOCK_AGENT_JSON + "\n```" },
          ],
        });
      }
      return Promise.resolve({
        content: [{ type: "text", text: MOCK_SYNTHESIS_JSON }],
      });
    });

    const res = await POST(
      makeRequest({ url: "https://github.com/test/repo" }),
    );
    const events = await readSSEEvents(res);

    const agentCompletes = events.filter((e) => e.event === "agent_complete");
    expect(agentCompletes.length).toBeGreaterThanOrEqual(3);
  });

  it("sets tier to byok when API key provided", async () => {
    mockAnthropicSuccess();

    const res = await POST(
      makeRequest({
        url: "https://github.com/test/repo",
        apiKey: "sk-ant-user-key",
      }),
    );
    const events = await readSSEEvents(res);

    const reviewingStatus = events.find(
      (e) => e.event === "status" && e.data.phase === "reviewing",
    );
    expect(reviewingStatus?.data.tier).toBe("byok");

    const completeEvent = events.find((e) => e.event === "complete");
    expect(completeEvent?.data.tier).toBe("byok");
  });
});
