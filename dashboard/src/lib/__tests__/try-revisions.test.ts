import { describe, it, expect, vi } from "vitest";
import type { TryAgentResult, ScoreRevision } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock: @/lib/try-agents -- provide WEB_AGENTS
// ---------------------------------------------------------------------------

vi.mock("@/lib/try-agents", () => ({
  WEB_AGENTS: [
    { name: "boris", role: "Architecture", panelWeight: 0.2 },
    { name: "cat", role: "Product", panelWeight: 0.18 },
    { name: "thariq", role: "AI Innovation", panelWeight: 0.18 },
    { name: "lydia", role: "Frontend", panelWeight: 0.18 },
    { name: "ado", role: "Docs", panelWeight: 0.13 },
    { name: "jason", role: "Community", panelWeight: 0.13 },
  ],
}));

// ---------------------------------------------------------------------------
// Import under test (after mocks)
// ---------------------------------------------------------------------------

import { applyRevisions } from "@/lib/try-revisions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAgent(overrides: Partial<TryAgentResult> = {}): TryAgentResult {
  return {
    agent: "boris",
    role: "Architecture & Verification",
    scores: { architecture: 80, type_safety: 70, verification: 60 },
    composite: 70,
    grade: "B-",
    verdict: "PASS",
    strengths: ["s1", "s2", "s3"],
    weaknesses: ["w1", "w2", "w3"],
    critical_issues: [],
    action_items: [],
    one_line: "test",
    model_used: "claude-opus-4-6",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("applyRevisions", () => {
  it("returns the original array unchanged when there are zero revisions", () => {
    const agents = [makeAgent(), makeAgent({ agent: "cat", role: "Product" })];
    const result = applyRevisions(agents, []);
    expect(result).toBe(agents); // same reference (short-circuit)
  });

  it("applies a single revision and recalculates composite/grade/verdict", () => {
    const agents = [
      makeAgent({
        agent: "boris",
        scores: { architecture: 80, type_safety: 70, verification: 60 },
        composite: 70,
        grade: "B-",
        verdict: "PASS",
      }),
    ];

    const revisions: ScoreRevision[] = [
      {
        agent: "boris",
        criterion: "architecture",
        original: 80,
        revised: 90,
        delta: 10,
      },
    ];

    const result = applyRevisions(agents, revisions);
    expect(result).toHaveLength(1);

    const boris = result[0]!;
    expect(boris.scores.architecture).toBe(90);
    // Composite = round((90 + 70 + 60) / 3) = round(73.33) = 73
    expect(boris.composite).toBe(73);
    expect(boris.grade).toBe("B-");
    expect(boris.verdict).toBe("PASS");
  });

  it("applies multiple revisions to multiple agents", () => {
    const agents = [
      makeAgent({
        agent: "boris",
        scores: { architecture: 60, type_safety: 60, verification: 60 },
        composite: 60,
        grade: "C",
        verdict: "MARGINAL",
      }),
      makeAgent({
        agent: "cat",
        role: "Product",
        scores: { user_value: 50, adoption_path: 50, narrative: 50 },
        composite: 50,
        grade: "D",
        verdict: "FAIL",
      }),
    ];

    const revisions: ScoreRevision[] = [
      {
        agent: "boris",
        criterion: "architecture",
        original: 60,
        revised: 80,
        delta: 20,
      },
      {
        agent: "boris",
        criterion: "type_safety",
        original: 60,
        revised: 75,
        delta: 15,
      },
      {
        agent: "cat",
        criterion: "user_value",
        original: 50,
        revised: 70,
        delta: 20,
      },
    ];

    const result = applyRevisions(agents, revisions);

    const boris = result[0]!;
    // Boris: round((80 + 75 + 60) / 3) = round(71.67) = 72
    expect(boris.scores.architecture).toBe(80);
    expect(boris.scores.type_safety).toBe(75);
    expect(boris.scores.verification).toBe(60);
    expect(boris.composite).toBe(72);

    const cat = result[1]!;
    // Cat: round((70 + 50 + 50) / 3) = round(56.67) = 57
    expect(cat.scores.user_value).toBe(70);
    expect(cat.composite).toBe(57);
    expect(cat.grade).toBe("C-");
    expect(cat.verdict).toBe("MARGINAL");
  });

  it("ignores revisions for a criterion that does not exist in scores", () => {
    const agents = [
      makeAgent({
        agent: "boris",
        scores: { architecture: 80 },
        composite: 80,
        grade: "B+",
        verdict: "PASS",
      }),
    ];

    const revisions: ScoreRevision[] = [
      {
        agent: "boris",
        criterion: "nonexistent_criterion",
        original: 0,
        revised: 99,
        delta: 99,
      },
    ];

    const result = applyRevisions(agents, revisions);

    const boris = result[0]!;
    // Score should remain unchanged since criterion not found
    expect(boris.scores.architecture).toBe(80);
    expect(boris.composite).toBe(80);
    expect(boris.grade).toBe("B+");
  });

  it("ignores revisions for a non-existent agent", () => {
    const agents = [
      makeAgent({
        agent: "boris",
        scores: { architecture: 70 },
        composite: 70,
        grade: "B-",
        verdict: "PASS",
      }),
    ];

    const revisions: ScoreRevision[] = [
      {
        agent: "nonexistent_agent",
        criterion: "architecture",
        original: 70,
        revised: 90,
        delta: 20,
      },
    ];

    const result = applyRevisions(agents, revisions);

    const boris = result[0]!;
    // Boris should be unmodified
    expect(boris.scores.architecture).toBe(70);
    expect(boris.composite).toBe(70);
    expect(boris.grade).toBe("B-");
    expect(boris.verdict).toBe("PASS");
  });
});
