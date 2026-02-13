import { describe, it, expect, vi, beforeEach } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import type { TryAgentResult, DebateResult, SSESender } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock: @anthropic-ai/sdk
// ---------------------------------------------------------------------------

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

// ---------------------------------------------------------------------------
// Mock: @/lib/try-agents — provide WEB_AGENTS, DEBATE_REVISION_SCHEMA, getModelId
// ---------------------------------------------------------------------------

vi.mock("@/lib/try-agents", () => ({
  WEB_AGENTS: [
    { name: "boris", role: "Architecture", systemPrompt: "You are Boris." },
    { name: "cat", role: "Product", systemPrompt: "You are Cat." },
    { name: "thariq", role: "AI Innovation", systemPrompt: "You are Thariq." },
    { name: "lydia", role: "Frontend", systemPrompt: "You are Lydia." },
    { name: "ado", role: "Docs", systemPrompt: "You are Ado." },
    { name: "jason", role: "Community", systemPrompt: "You are Jason." },
  ],
  DEBATE_REVISION_SCHEMA: "REVISED: <criterion>: <score>",
  getModelId: () => "claude-opus-4-6",
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an Anthropic.Message-shaped response with the given text. */
function fakeMessage(text: string): Anthropic.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-4-6",
    content: [{ type: "text", text, citations: null }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: {
      input_tokens: 10,
      output_tokens: 20,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      cache_creation: null,
      inference_geo: null,
      server_tool_use: null,
      service_tier: null,
    },
  } satisfies Anthropic.Message;
}

/** Build a TryAgentResult with a specific agent name and composite score. */
function makeAgentResult(
  agent: string,
  composite: number,
  scores?: Record<string, number>,
): TryAgentResult {
  const defaultScores: Record<string, number> =
    scores ?? Object.fromEntries([["quality", composite]]);
  return {
    agent,
    role: `${agent} role`,
    scores: defaultScores,
    composite,
    grade: composite >= 85 ? "A" : composite >= 70 ? "B" : "C",
    verdict:
      composite >= 85 ? "STRONG_PASS" : composite >= 70 ? "PASS" : "MARGINAL",
    strengths: ["s1", "s2", "s3"],
    weaknesses: ["w1", "w2", "w3"],
    critical_issues: [],
    action_items: [],
    one_line: `${agent} one-liner`,
    model_used: "claude-opus-4-6",
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("runDebate", () => {
  let send: SSESender;
  let client: Anthropic;

  beforeEach(async () => {
    vi.clearAllMocks();
    send = vi.fn<SSESender>().mockResolvedValue(undefined);

    // Dynamically import to get the mocked Anthropic constructor
    const Sdk = (await import("@anthropic-ai/sdk")).default;
    client = new Sdk() as unknown as Anthropic;
  });

  // -----------------------------------------------------------------------
  // 1. Returns empty result for free tier
  // -----------------------------------------------------------------------
  it("returns empty result when tier is 'free'", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    const agents = [
      makeAgentResult("boris", 90),
      makeAgentResult("cat", 70),
      makeAgentResult("thariq", 60),
      makeAgentResult("lydia", 50),
    ];

    const result = await runDebate(
      client,
      agents,
      "Evaluate repo",
      "free",
      send,
    );

    expect(result).toEqual<DebateResult>({
      exchanges: [],
      revisions: [],
      transcript: "",
      pairs_debated: 0,
      scores_revised: 0,
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 2. Returns empty result when fewer than 4 agent results
  // -----------------------------------------------------------------------
  it("returns empty result when fewer than 4 agent results", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    const agents = [
      makeAgentResult("boris", 90),
      makeAgentResult("cat", 70),
      makeAgentResult("thariq", 60),
    ];

    const result = await runDebate(
      client,
      agents,
      "Evaluate repo",
      "byok",
      send,
    );

    expect(result.pairs_debated).toBe(0);
    expect(result.exchanges).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 3. Returns empty result when no pairs exceed DIVERGENCE_THRESHOLD (10)
  // -----------------------------------------------------------------------
  it("returns empty result when no pairs exceed divergence threshold", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    // All agents within 9 points of each other — below 10-point threshold
    const agents = [
      makeAgentResult("boris", 70),
      makeAgentResult("cat", 72),
      makeAgentResult("thariq", 75),
      makeAgentResult("lydia", 78),
    ];

    const result = await runDebate(
      client,
      agents,
      "Evaluate repo",
      "byok",
      send,
    );

    expect(result.pairs_debated).toBe(0);
    expect(result.exchanges).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 4. Triggers debate when agents have >10 point delta
  // -----------------------------------------------------------------------
  it("triggers debate when agents have >10 point delta in composite scores", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    const agents = [
      makeAgentResult("boris", 90, { architecture: 95, type_safety: 85 }),
      makeAgentResult("cat", 75, { user_value: 80, adoption_path: 70 }),
      makeAgentResult("thariq", 60, { ai_depth: 55, novelty: 65 }),
      makeAgentResult("lydia", 72, { code_quality: 75, dx: 69 }),
    ];

    mockCreate.mockResolvedValue(
      fakeMessage("I agree on some points. No revisions."),
    );

    const result = await runDebate(
      client,
      agents,
      "Evaluate repo",
      "byok",
      send,
    );

    // boris(90) vs thariq(60) = 30pt delta, boris(90) vs lydia(72) = 18pt delta,
    // cat(75) vs thariq(60) = 15pt delta — all exceed 10. Max 3 pairs.
    expect(result.pairs_debated).toBeGreaterThanOrEqual(1);
    expect(result.exchanges.length).toBeGreaterThanOrEqual(1);
    expect(mockCreate).toHaveBeenCalled();

    // Verify status SSE was sent
    expect(send).toHaveBeenCalledWith("status", { phase: "debating" });
    // Verify debate_complete SSE was sent
    expect(send).toHaveBeenCalledWith(
      "debate_complete",
      expect.objectContaining({
        pairs_debated: expect.any(Number) as number,
      }),
    );
  });

  // -----------------------------------------------------------------------
  // 5. Parses REVISED: lines and caps at +/-5
  // -----------------------------------------------------------------------
  it("parses REVISED: lines from agent responses and caps at +/-5", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    const agents = [
      makeAgentResult("boris", 90, { architecture: 90, type_safety: 80 }),
      makeAgentResult("cat", 65, { user_value: 60, adoption_path: 70 }),
      makeAgentResult("thariq", 72, { ai_depth: 75, novelty: 69 }),
      makeAgentResult("lydia", 70, { code_quality: 72, dx: 68 }),
    ];

    // Agent A (boris, higher scorer) responds with a valid revision
    // Agent B (cat, lower scorer) responds with a revision that exceeds +/-5 bound
    mockCreate
      .mockResolvedValueOnce(
        fakeMessage(
          "I see your point about user value.\nREVISED: architecture: 87",
        ),
      )
      .mockResolvedValueOnce(
        fakeMessage(
          // delta of +20 from original 60 — exceeds the +/-5 cap, should be ignored
          "Good arguments on architecture.\nREVISED: user_value: 80\nREVISED: adoption_path: 73",
        ),
      )
      // Remaining pairs get simple responses
      .mockResolvedValue(fakeMessage("No revisions."));

    const result = await runDebate(
      client,
      agents,
      "Evaluate repo",
      "byok",
      send,
    );

    // Check that revisions were parsed
    // boris revised architecture: 90 -> 87 (delta -3, within bounds)
    const borisRevision = result.revisions.find(
      (r) => r.agent === "boris" && r.criterion === "architecture",
    );
    expect(borisRevision).toBeDefined();
    expect(borisRevision?.original).toBe(90);
    expect(borisRevision?.revised).toBe(87);
    expect(borisRevision?.delta).toBe(-3);

    // cat's user_value revision: 60 -> 80 (delta +20) should be REJECTED (exceeds +/-5)
    const catUserValueRevision = result.revisions.find(
      (r) => r.agent === "cat" && r.criterion === "user_value",
    );
    expect(catUserValueRevision).toBeUndefined();

    // cat's adoption_path revision: 70 -> 73 (delta +3, within bounds) — accepted
    const catAdoptionRevision = result.revisions.find(
      (r) => r.agent === "cat" && r.criterion === "adoption_path",
    );
    expect(catAdoptionRevision).toBeDefined();
    expect(catAdoptionRevision?.original).toBe(70);
    expect(catAdoptionRevision?.revised).toBe(73);
    expect(catAdoptionRevision?.delta).toBe(3);
  });

  // -----------------------------------------------------------------------
  // 6. Handles agent API errors gracefully
  // -----------------------------------------------------------------------
  it("handles agent API errors gracefully and continues with other pairs", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    const agents = [
      makeAgentResult("boris", 95, { architecture: 95 }),
      makeAgentResult("cat", 50, { user_value: 50 }),
      makeAgentResult("thariq", 60, { ai_depth: 60 }),
      makeAgentResult("lydia", 70, { code_quality: 70 }),
    ];

    // First pair: boris(95) vs cat(50) — Agent A (boris) call errors
    mockCreate
      .mockRejectedValueOnce(new Error("API rate limit exceeded"))
      // Second pair: boris(95) vs thariq(60) — succeeds
      .mockResolvedValueOnce(fakeMessage("I see the innovation gaps."))
      .mockResolvedValueOnce(fakeMessage("Fair points on architecture."))
      // Third pair: boris(95) vs lydia(70) — succeeds
      .mockResolvedValueOnce(fakeMessage("Agreed on code quality."))
      .mockResolvedValueOnce(
        fakeMessage("Your architecture analysis is solid."),
      );

    const result = await runDebate(
      client,
      agents,
      "Evaluate repo",
      "byok",
      send,
    );

    // First pair skipped entirely due to Agent A error (continue in catch),
    // second and third pairs should succeed
    expect(result.pairs_debated).toBe(2);
    expect(result.exchanges).toHaveLength(2);
  });

  // -----------------------------------------------------------------------
  // 7. Builds transcript with exchanges
  // -----------------------------------------------------------------------
  it("builds transcript with formatted exchanges", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    const agents = [
      makeAgentResult("boris", 85, { architecture: 85 }),
      makeAgentResult("cat", 60, { user_value: 60 }),
      makeAgentResult("thariq", 72, { ai_depth: 72 }),
      makeAgentResult("lydia", 71, { code_quality: 71 }),
    ];

    mockCreate
      .mockResolvedValueOnce(
        fakeMessage("I disagree with the product assessment."),
      )
      .mockResolvedValueOnce(
        fakeMessage(
          "Your architecture point is valid.\nREVISED: user_value: 63",
        ),
      )
      // Remaining pair responses
      .mockResolvedValue(fakeMessage("No revisions."));

    const result = await runDebate(
      client,
      agents,
      "Evaluate repo",
      "byok",
      send,
    );

    // Transcript should start with debate round header
    expect(result.transcript).toContain("## Debate Round");

    // Transcript should reference the agents and scores
    expect(result.transcript).toContain("boris");
    expect(result.transcript).toContain("cat");
    expect(result.transcript).toContain("scored 85");
    expect(result.transcript).toContain("scored 60");

    // Transcript should contain the actual response text
    expect(result.transcript).toContain(
      "I disagree with the product assessment.",
    );
    expect(result.transcript).toContain("Your architecture point is valid.");

    // Transcript should include score revision notation
    expect(result.transcript).toContain("Score revisions");
    expect(result.transcript).toContain("user_value");
    expect(result.transcript).toContain("60");
    expect(result.transcript).toContain("63");

    // Exchanges should record both sides
    const firstExchange = result.exchanges[0];
    expect(firstExchange).toBeDefined();
    expect(firstExchange?.agent_a).toBe("boris");
    expect(firstExchange?.agent_b).toBe("cat");
    expect(firstExchange?.response_a).toBe(
      "I disagree with the product assessment.",
    );
    expect(firstExchange?.response_b).toContain(
      "Your architecture point is valid.",
    );
  });

  // -----------------------------------------------------------------------
  // 8. Limits to MAX_PAIRS (3) pairs
  // -----------------------------------------------------------------------
  it("limits debate to at most 3 pairs", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    // 6 agents with widely spread scores — creates many pairs exceeding threshold
    const agents = [
      makeAgentResult("boris", 95, { architecture: 95 }),
      makeAgentResult("cat", 40, { user_value: 40 }),
      makeAgentResult("thariq", 55, { ai_depth: 55 }),
      makeAgentResult("lydia", 80, { code_quality: 80 }),
      makeAgentResult("ado", 30, { readme_quality: 30 }),
      makeAgentResult("jason", 70, { accessibility: 70 }),
    ];
    // Possible pairs exceeding 10: many more than 3

    mockCreate.mockResolvedValue(fakeMessage("No revisions."));

    const result = await runDebate(
      client,
      agents,
      "Evaluate repo",
      "byok",
      send,
    );

    // MAX_PAIRS = 3 — should not exceed
    expect(result.pairs_debated).toBeLessThanOrEqual(3);

    // Each pair makes 2 API calls (Agent A + Agent B), so at most 6 calls
    expect(mockCreate).toHaveBeenCalledTimes(result.pairs_debated * 2);
  });

  // -----------------------------------------------------------------------
  // 9. Agent B error records partial exchange
  // -----------------------------------------------------------------------
  it("records partial exchange when Agent B fails", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    const agents = [
      makeAgentResult("boris", 90, { architecture: 90 }),
      makeAgentResult("cat", 55, { user_value: 55 }),
      makeAgentResult("thariq", 72, { ai_depth: 72 }),
      makeAgentResult("lydia", 71, { code_quality: 71 }),
    ];

    // First pair: Agent A succeeds, Agent B errors
    mockCreate
      .mockResolvedValueOnce(fakeMessage("My analysis stands."))
      .mockRejectedValueOnce(new Error("Connection timeout"))
      // Second pair succeeds normally
      .mockResolvedValue(fakeMessage("No revisions."));

    const result = await runDebate(
      client,
      agents,
      "Evaluate repo",
      "byok",
      send,
    );

    // First pair: exchange recorded with empty response_b
    const partialExchange = result.exchanges.find(
      (e) => e.agent_a === "boris" && e.agent_b === "cat",
    );
    expect(partialExchange).toBeDefined();
    expect(partialExchange?.response_a).toBe("My analysis stands.");
    expect(partialExchange?.response_b).toBe("");
  });

  // -----------------------------------------------------------------------
  // 10. SSE events are sent in correct order
  // -----------------------------------------------------------------------
  it("sends SSE events for each debate exchange and revisions", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    const agents = [
      makeAgentResult("boris", 85, { architecture: 85 }),
      makeAgentResult("cat", 60, { user_value: 60 }),
      makeAgentResult("thariq", 72, { ai_depth: 72 }),
      makeAgentResult("lydia", 71, { code_quality: 71 }),
    ];

    mockCreate.mockResolvedValue(
      fakeMessage("Good points.\nREVISED: architecture: 83"),
    );

    await runDebate(client, agents, "Evaluate repo", "byok", send);

    // Should start with debating status
    const sendMock = vi.mocked(send);
    const sendCalls = sendMock.mock.calls as Array<[string, unknown]>;
    expect(sendCalls[0]).toEqual(["status", { phase: "debating" }]);

    // Should have debate_exchange events
    const exchangeEvents = sendCalls.filter(
      ([event]) => event === "debate_exchange",
    );
    expect(exchangeEvents.length).toBeGreaterThanOrEqual(2);

    // Should end with debate_complete
    const lastCall = sendCalls[sendCalls.length - 1];
    expect(lastCall?.[0]).toBe("debate_complete");
  });

  // -----------------------------------------------------------------------
  // 11. Pairs are sorted by delta (highest first)
  // -----------------------------------------------------------------------
  it("debates the most divergent pairs first", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    const agents = [
      makeAgentResult("boris", 95, { architecture: 95 }),
      makeAgentResult("cat", 80, { user_value: 80 }),
      makeAgentResult("thariq", 40, { ai_depth: 40 }),
      makeAgentResult("lydia", 70, { code_quality: 70 }),
    ];

    mockCreate.mockResolvedValue(fakeMessage("No revisions."));

    const result = await runDebate(
      client,
      agents,
      "Evaluate repo",
      "byok",
      send,
    );

    // Most divergent: boris(95) vs thariq(40) = 55pt delta
    // Should appear first in exchanges
    expect(result.exchanges[0]?.agent_a).toBe("boris");
    expect(result.exchanges[0]?.agent_b).toBe("thariq");
    expect(result.exchanges[0]?.score_a).toBe(95);
    expect(result.exchanges[0]?.score_b).toBe(40);
  });

  // -----------------------------------------------------------------------
  // 12. Boundary: exactly 10 point delta triggers debate
  // -----------------------------------------------------------------------
  it("triggers debate at exactly 10 point delta (threshold is >=)", async () => {
    const { runDebate } = await import("@/lib/try-debate");

    // Only one pair at exactly 10 points apart
    const agents = [
      makeAgentResult("boris", 80, { architecture: 80 }),
      makeAgentResult("cat", 70, { user_value: 70 }),
      makeAgentResult("thariq", 75, { ai_depth: 75 }),
      makeAgentResult("lydia", 74, { code_quality: 74 }),
    ];

    mockCreate.mockResolvedValue(fakeMessage("No revisions."));

    const result = await runDebate(
      client,
      agents,
      "Evaluate repo",
      "byok",
      send,
    );

    // boris(80) vs cat(70) = exactly 10, should trigger
    expect(result.pairs_debated).toBe(1);
    expect(result.exchanges[0]?.agent_a).toBe("boris");
    expect(result.exchanges[0]?.agent_b).toBe("cat");
  });
});
