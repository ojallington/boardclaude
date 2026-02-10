import { describe, it, expect } from "vitest";
import {
  getGrade,
  getVerdict,
  AGENT_COLORS,
  type Grade,
  type Verdict,
  type AgentEvaluation,
  type ActionItemsLedger,
} from "../types";

// ─── Test 1: getGrade boundary values ────────────────────────────────

describe("getGrade", () => {
  it("returns correct grade for each boundary", () => {
    const cases: [number, Grade][] = [
      [100, "A+"],
      [95, "A+"],
      [94, "A"],
      [90, "A"],
      [89, "A-"],
      [85, "A-"],
      [84, "B+"],
      [80, "B+"],
      [79, "B"],
      [75, "B"],
      [74, "B-"],
      [70, "B-"],
      [69, "C+"],
      [65, "C+"],
      [64, "C"],
      [60, "C"],
      [59, "C-"],
      [55, "C-"],
      [54, "D"],
      [50, "D"],
      [49, "F"],
      [0, "F"],
    ];

    for (const [score, expected] of cases) {
      expect(getGrade(score)).toBe(expected);
    }
  });
});

// ─── Test 2: getVerdict boundary values ──────────────────────────────

describe("getVerdict", () => {
  it("returns correct verdict for each threshold", () => {
    const cases: [number, Verdict][] = [
      [100, "STRONG_PASS"],
      [85, "STRONG_PASS"],
      [84, "PASS"],
      [70, "PASS"],
      [69, "MARGINAL"],
      [55, "MARGINAL"],
      [54, "FAIL"],
      [0, "FAIL"],
    ];

    for (const [score, expected] of cases) {
      expect(getVerdict(score)).toBe(expected);
    }
  });
});

// ─── Test 3: AGENT_COLORS has all required agents ────────────────────

describe("AGENT_COLORS", () => {
  it("contains all 7 agents with valid hex colors", () => {
    const requiredAgents = [
      "boris",
      "cat",
      "thariq",
      "lydia",
      "ado",
      "jason",
      "synthesis",
    ];

    for (const agent of requiredAgents) {
      expect(AGENT_COLORS[agent]).toBeDefined();
      expect(AGENT_COLORS[agent]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("has exactly 7 agents", () => {
    expect(Object.keys(AGENT_COLORS)).toHaveLength(7);
  });
});

// ─── Test 4: AgentEvaluation schema shape ────────────────────────────

describe("AgentEvaluation schema", () => {
  it("validates a well-formed agent evaluation", () => {
    const evaluation: AgentEvaluation = {
      agent: "boris",
      scores: { architecture: 82, verification: 48 },
      composite: 69.0,
      strengths: ["strength 1", "strength 2", "strength 3"],
      weaknesses: ["weakness 1", "weakness 2", "weakness 3"],
      critical_issues: [],
      action_items: [
        { priority: 1, action: "do something", impact: "score +5" },
      ],
      verdict: "MARGINAL",
      one_line: "summary",
    };

    expect(evaluation.agent).toBe("boris");
    expect(evaluation.composite).toBeGreaterThanOrEqual(0);
    expect(evaluation.composite).toBeLessThanOrEqual(100);
    expect(evaluation.strengths).toHaveLength(3);
    expect(evaluation.weaknesses).toHaveLength(3);
    expect(["STRONG_PASS", "PASS", "MARGINAL", "FAIL"]).toContain(
      evaluation.verdict,
    );
    expect(getVerdict(evaluation.composite)).toBe(evaluation.verdict);
  });
});

// ─── Test 5: ActionItemsLedger metadata consistency ──────────────────

describe("ActionItemsLedger metadata", () => {
  it("metadata counts match items array", () => {
    const ledger: ActionItemsLedger = {
      items: [
        {
          id: "ai-001",
          source_audit: "20260210-193000",
          source_agent: "boris",
          action: "Add tests",
          file_refs: [],
          priority: 1,
          effort: "medium",
          status: "open",
          resolved_in_audit: null,
          iterations_open: 0,
          created_at: "2026-02-10T19:30:00.000Z",
          updated_at: "2026-02-10T19:30:00.000Z",
        },
        {
          id: "ai-002",
          source_audit: "20260210-193000",
          source_agent: "lydia",
          action: "Fix formatting",
          file_refs: [],
          priority: 2,
          effort: "low",
          status: "resolved",
          resolved_in_audit: "20260210-200000",
          iterations_open: 1,
          created_at: "2026-02-10T19:30:00.000Z",
          updated_at: "2026-02-10T20:00:00.000Z",
        },
      ],
      metadata: {
        total_items: 2,
        open: 1,
        resolved: 1,
        chronic: 0,
      },
    };

    expect(ledger.metadata.total_items).toBe(ledger.items.length);

    const open = ledger.items.filter((i) => i.status === "open").length;
    const resolved = ledger.items.filter((i) => i.status === "resolved").length;
    const chronic = ledger.items.filter((i) => i.status === "chronic").length;

    expect(ledger.metadata.open).toBe(open);
    expect(ledger.metadata.resolved).toBe(resolved);
    expect(ledger.metadata.chronic).toBe(chronic);
  });

  it("validates action item status transitions", () => {
    const validStatuses = [
      "open",
      "in_progress",
      "resolved",
      "wont_fix",
      "chronic",
      "blocked",
    ];
    const item: ActionItemsLedger["items"][0] = {
      id: "ai-test",
      source_audit: "test",
      source_agent: "boris",
      action: "test action",
      file_refs: [],
      priority: 1,
      effort: "low",
      status: "open",
      resolved_in_audit: null,
      iterations_open: 0,
      created_at: "2026-02-10T19:30:00.000Z",
      updated_at: "2026-02-10T19:30:00.000Z",
    };

    expect(validStatuses).toContain(item.status);
  });
});
