import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePanelStream } from "../usePanelStream";

// ─── Helpers ────────────────────────────────────────────────────────────────

function ssePayload(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function mockFetchSSE(events: string[], ok = true) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      body: stream,
    }),
  );
}

function mockFetchFail() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, body: null }));
}

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("usePanelStream", () => {
  it("starts in idle state with 6 pending agents", () => {
    const { result } = renderHook(() => usePanelStream());

    expect(result.current.phase).toBe("idle");
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.repoInfo).toBeNull();
    expect(result.current.tier).toBeNull();
    expect(result.current.agents).toHaveLength(6);
    expect(result.current.completedCount).toBe(0);
    for (const agent of result.current.agents) {
      expect(agent.status).toBe("pending");
    }
  });

  it("transitions to fetching phase on status event", async () => {
    mockFetchSSE([
      ssePayload("status", {
        phase: "fetching",
        repo: { owner: "test", name: "repo" },
      }),
    ]);

    const { result } = renderHook(() => usePanelStream());

    await act(async () => {
      result.current.startReview("https://github.com/test/repo", null);
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("fetching");
      expect(result.current.repoInfo).toEqual({
        owner: "test",
        name: "repo",
      });
    });
  });

  it("transitions through reviewing and synthesizing phases", async () => {
    mockFetchSSE([
      ssePayload("status", {
        phase: "fetching",
        repo: { owner: "test", name: "repo" },
      }),
      ssePayload("status", { phase: "reviewing", total: 6, tier: "free" }),
      ssePayload("status", { phase: "synthesizing" }),
    ]);

    const { result } = renderHook(() => usePanelStream());

    await act(async () => {
      result.current.startReview("https://github.com/test/repo", null);
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("synthesizing");
      expect(result.current.tier).toBe("free");
    });
  });

  it("tracks agent progress through start/complete events", async () => {
    mockFetchSSE([
      ssePayload("status", { phase: "reviewing", total: 6, tier: "free" }),
      ssePayload("agent_start", { agent: "boris", index: 0 }),
      ssePayload("agent_complete", {
        agent: "boris",
        index: 0,
        result: {
          agent: "boris",
          role: "Architecture",
          scores: { architecture: 80 },
          composite: 80,
          grade: "B+",
          verdict: "PASS",
          strengths: ["s1", "s2", "s3"],
          weaknesses: ["w1", "w2", "w3"],
          critical_issues: [],
          action_items: [],
          one_line: "Good",
          model_used: "claude-haiku-4-5-20251001",
        },
      }),
    ]);

    const { result } = renderHook(() => usePanelStream());

    await act(async () => {
      result.current.startReview("https://github.com/test/repo", null);
    });

    await waitFor(() => {
      const boris = result.current.agents.find((a) => a.agent === "boris");
      expect(boris?.status).toBe("complete");
      expect(boris?.result?.composite).toBe(80);
      expect(result.current.completedCount).toBe(1);
    });
  });

  it("handles agent error events", async () => {
    mockFetchSSE([
      ssePayload("status", { phase: "reviewing", total: 6, tier: "free" }),
      ssePayload("agent_start", { agent: "cat", index: 1 }),
      ssePayload("agent_error", {
        agent: "cat",
        index: 1,
        error: "API error",
      }),
    ]);

    const { result } = renderHook(() => usePanelStream());

    await act(async () => {
      result.current.startReview("https://github.com/test/repo", null);
    });

    await waitFor(() => {
      const cat = result.current.agents.find((a) => a.agent === "cat");
      expect(cat?.status).toBe("error");
    });
  });

  it("sets result and complete phase on complete event", async () => {
    const mockResult = {
      audit_id: "web-20260211-120000",
      repo: { owner: "test", name: "repo" },
      panel: "web-judges",
      timestamp: "2026-02-11T12:00:00Z",
      agents: [],
      composite: {
        score: 78,
        radar: {},
        grade: "B",
        verdict: "PASS",
      },
      highlights: {
        top_strengths: [],
        top_weaknesses: [],
        divergent_opinions: [],
      },
      action_items: [],
      files_analyzed: 5,
      tier: "free",
    };

    mockFetchSSE([ssePayload("complete", mockResult)]);

    const { result } = renderHook(() => usePanelStream());

    await act(async () => {
      result.current.startReview("https://github.com/test/repo", null);
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("complete");
      expect(result.current.result?.audit_id).toBe("web-20260211-120000");
    });
  });

  it("handles error events from server", async () => {
    mockFetchSSE([
      ssePayload("error", {
        code: "RATE_LIMITED",
        message: "Rate limit reached.",
      }),
    ]);

    const { result } = renderHook(() => usePanelStream());

    await act(async () => {
      result.current.startReview("https://github.com/test/repo", null);
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("error");
      expect(result.current.error).toBe(
        "Rate limit reached. Try again later or use your own API key.",
      );
    });
  });

  it("handles fetch failure (non-ok response)", async () => {
    mockFetchFail();

    const { result } = renderHook(() => usePanelStream());

    await act(async () => {
      result.current.startReview("https://github.com/test/repo", null);
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("error");
      expect(result.current.error).toContain("Failed to connect");
    });
  });

  it("sets tier to byok when API key is provided", async () => {
    mockFetchSSE([
      ssePayload("status", { phase: "reviewing", total: 6, tier: "byok" }),
    ]);

    const { result } = renderHook(() => usePanelStream());

    await act(async () => {
      result.current.startReview("https://github.com/test/repo", "sk-ant-key");
    });

    await waitFor(() => {
      expect(result.current.tier).toBe("byok");
    });
  });

  it("reset() returns to idle state", async () => {
    mockFetchSSE([
      ssePayload("error", { code: "RATE_LIMITED", message: "Rate limited." }),
    ]);

    const { result } = renderHook(() => usePanelStream());

    await act(async () => {
      result.current.startReview("https://github.com/test/repo", null);
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("error");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.agents).toHaveLength(6);
    for (const agent of result.current.agents) {
      expect(agent.status).toBe("pending");
    }
  });

  it("sends correct fetch body with URL and apiKey", async () => {
    mockFetchSSE([]);

    const { result } = renderHook(() => usePanelStream());

    await act(async () => {
      result.current.startReview("https://github.com/test/repo", "sk-ant-key");
    });

    expect(fetch).toHaveBeenCalledWith("/api/try", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://github.com/test/repo",
        apiKey: "sk-ant-key",
      }),
      signal: expect.any(AbortSignal),
    });
  });

  it("sends fetch body without apiKey when null", async () => {
    mockFetchSSE([]);

    const { result } = renderHook(() => usePanelStream());

    await act(async () => {
      result.current.startReview("https://github.com/test/repo", null);
    });

    expect(fetch).toHaveBeenCalledWith("/api/try", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://github.com/test/repo" }),
      signal: expect.any(AbortSignal),
    });
  });
});
