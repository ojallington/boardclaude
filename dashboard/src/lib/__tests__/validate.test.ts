import { describe, it, expect } from "vitest";
import {
  validateAgentEvaluation,
  validateSynthesisReport,
  parseAgentEvaluation,
  validateProjectState,
  validateTimeline,
  validateActionItemsLedger,
  validateTryPanelResult,
} from "../validate";

// ─── Valid fixtures ──────────────────────────────────────────────────

const validEvaluation = {
  agent: "boris",
  scores: { architecture: 82, verification: 48 },
  composite: 69.0,
  strengths: ["s1", "s2", "s3"],
  weaknesses: ["w1", "w2", "w3"],
  critical_issues: [],
  action_items: [{ priority: 1, action: "do something", impact: "+5" }],
  verdict: "MARGINAL",
  one_line: "summary line",
};

const validReport = {
  audit_id: "20260210-193000",
  panel: "hackathon-judges",
  target: "boardclaude",
  iteration: 0,
  timestamp: "2026-02-10T19:30:00.000Z",
  agents: [{ agent: "boris", scores: {}, composite: 69, verdict: "MARGINAL" }],
  composite: {
    score: 68.4,
    radar: {
      architecture: 69,
      product: 71,
      innovation: 71,
      code_quality: 68,
      documentation: 64,
      integration: 62,
    },
    grade: "C+",
    verdict: "MARGINAL",
  },
  highlights: { top_strengths: [], top_weaknesses: [], divergent_opinions: [] },
  action_items: [],
  iteration_delta: {
    previous_score: null,
    current_score: 68.4,
    delta: null,
    improvements: [],
    regressions: [],
  },
};

// ─── AgentEvaluation validation ──────────────────────────────────────

describe("validateAgentEvaluation", () => {
  it("accepts a valid evaluation", () => {
    const result = validateAgentEvaluation(validEvaluation);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data).not.toBeNull();
  });

  it("rejects non-object input", () => {
    const result = validateAgentEvaluation("not an object");
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.field).toBe("root");
  });

  it("rejects missing agent name", () => {
    const result = validateAgentEvaluation({ ...validEvaluation, agent: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "agent")).toBe(true);
  });

  it("rejects scores outside 0-100 range", () => {
    const result = validateAgentEvaluation({
      ...validEvaluation,
      scores: { arch: 150 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "scores.arch")).toBe(true);
  });

  it("rejects invalid verdict", () => {
    const result = validateAgentEvaluation({
      ...validEvaluation,
      verdict: "AMAZING",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "verdict")).toBe(true);
  });

  it("rejects wrong number of strengths", () => {
    const result = validateAgentEvaluation({
      ...validEvaluation,
      strengths: ["only one"],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "strengths")).toBe(true);
  });
});

// ─── SynthesisReport validation ──────────────────────────────────────

describe("validateSynthesisReport", () => {
  it("accepts a valid report", () => {
    const result = validateSynthesisReport(validReport);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing audit_id", () => {
    const result = validateSynthesisReport({ ...validReport, audit_id: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "audit_id")).toBe(true);
  });

  it("rejects invalid composite grade", () => {
    const result = validateSynthesisReport({
      ...validReport,
      composite: { ...validReport.composite, grade: "Z" },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "composite.grade")).toBe(true);
  });
});

// ─── Agent-level validation in synthesis ─────────────────────────────

describe("validateSynthesisReport agent-level checks", () => {
  it("rejects agent with scores outside 0-100", () => {
    const report = {
      ...validReport,
      agents: [
        {
          agent: "boris",
          scores: { arch: 150 },
          composite: 69,
          verdict: "PASS",
        },
      ],
    };
    const result = validateSynthesisReport(report);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "agents[0].scores.arch")).toBe(
      true,
    );
  });

  it("rejects agent with missing name", () => {
    const report = {
      ...validReport,
      agents: [{ agent: "", scores: {}, composite: 69, verdict: "PASS" }],
    };
    const result = validateSynthesisReport(report);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "agents[0].agent")).toBe(true);
  });

  it("rejects agent with invalid verdict", () => {
    const report = {
      ...validReport,
      agents: [
        { agent: "boris", scores: {}, composite: 69, verdict: "AMAZING" },
      ],
    };
    const result = validateSynthesisReport(report);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "agents[0].verdict")).toBe(
      true,
    );
  });

  it("rejects agent with composite outside 0-100", () => {
    const report = {
      ...validReport,
      agents: [{ agent: "boris", scores: {}, composite: -5, verdict: "PASS" }],
    };
    const result = validateSynthesisReport(report);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "agents[0].composite")).toBe(
      true,
    );
  });

  it("accepts multiple valid agents", () => {
    const report = {
      ...validReport,
      agents: [
        {
          agent: "boris",
          scores: { arch: 85 },
          composite: 85,
          verdict: "STRONG_PASS",
        },
        { agent: "cat", scores: { ux: 72 }, composite: 72, verdict: "PASS" },
      ],
    };
    const result = validateSynthesisReport(report);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ─── JSON parsing ────────────────────────────────────────────────────

describe("parseAgentEvaluation", () => {
  it("parses valid JSON", () => {
    const result = parseAgentEvaluation(JSON.stringify(validEvaluation));
    expect(result.valid).toBe(true);
  });

  it("rejects invalid JSON", () => {
    const result = parseAgentEvaluation("not json {{{");
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toContain("Invalid JSON");
  });

  it("rejects valid JSON with invalid schema", () => {
    const result = parseAgentEvaluation(JSON.stringify({ agent: 123 }));
    expect(result.valid).toBe(false);
  });
});

// ─── ProjectState validation ────────────────────────────────────────

const validProjectState = {
  project: "boardclaude",
  panel: "hackathon-judges",
  branch: "main",
  audit_count: 4,
  latest_audit: "audit-20260211-040000",
  latest_score: 87.37,
  score_history: [
    {
      audit_id: "audit-20260210-193000",
      iteration: 0,
      score: 68.4,
      grade: "C+",
      verdict: "MARGINAL",
      timestamp: "2026-02-10T19:30:00.000Z",
    },
  ],
  worktrees: [],
  status: "idle",
};

describe("validateProjectState", () => {
  it("accepts a valid project state", () => {
    const result = validateProjectState(validProjectState);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data).not.toBeNull();
  });

  it("rejects non-object input", () => {
    const result = validateProjectState("not an object");
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.field).toBe("root");
  });

  it("rejects null input", () => {
    const result = validateProjectState(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.field).toBe("root");
  });

  it("rejects missing project field", () => {
    const { project: _, ...rest } = validProjectState;
    const result = validateProjectState(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "project")).toBe(true);
  });

  it("rejects negative audit_count", () => {
    const result = validateProjectState({
      ...validProjectState,
      audit_count: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "audit_count")).toBe(true);
  });

  it("rejects non-array score_history", () => {
    const result = validateProjectState({
      ...validProjectState,
      score_history: "not an array",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "score_history")).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = validateProjectState({
      ...validProjectState,
      status: "running",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "status")).toBe(true);
  });

  it("accepts all valid status values", () => {
    for (const status of ["idle", "active", "auditing"]) {
      const result = validateProjectState({ ...validProjectState, status });
      expect(result.valid).toBe(true);
    }
  });
});

// ─── Timeline validation ────────────────────────────────────────────

const validTimeline = {
  events: [
    {
      id: "evt-001",
      type: "audit",
      timestamp: "2026-02-10T19:30:00.000Z",
      parent: null,
      status: "completed",
      branch: "main",
      panel: "hackathon-judges",
      composite_score: 68.4,
      agent_scores: { boris: 69 },
      audit_file: "audit-20260210-193000.json",
    },
  ],
};

describe("validateTimeline", () => {
  it("accepts a valid timeline", () => {
    const result = validateTimeline(validTimeline);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data).not.toBeNull();
  });

  it("rejects non-object input", () => {
    const result = validateTimeline(42);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.field).toBe("root");
  });

  it("rejects non-array events", () => {
    const result = validateTimeline({ events: "not an array" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "events")).toBe(true);
  });

  it("rejects event with missing id", () => {
    const result = validateTimeline({
      events: [{ type: "audit", timestamp: "2026-01-01T00:00:00Z" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "events[0].id")).toBe(true);
  });

  it("rejects event with invalid type", () => {
    const result = validateTimeline({
      events: [
        { id: "evt-001", type: "unknown", timestamp: "2026-01-01T00:00:00Z" },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "events[0].type")).toBe(true);
  });

  it("rejects event with missing timestamp", () => {
    const result = validateTimeline({
      events: [{ id: "evt-001", type: "audit" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "events[0].timestamp")).toBe(
      true,
    );
  });

  it("accepts all valid event types", () => {
    for (const type of ["audit", "fork", "merge", "rollback"]) {
      const result = validateTimeline({
        events: [{ id: "evt-001", type, timestamp: "2026-01-01T00:00:00Z" }],
      });
      expect(result.valid).toBe(true);
    }
  });

  it("accepts empty events array", () => {
    const result = validateTimeline({ events: [] });
    expect(result.valid).toBe(true);
  });
});

// ─── ActionItemsLedger validation ───────────────────────────────────

const validLedger = {
  items: [
    {
      id: "ai-001",
      source_audit: "20260210-193000",
      source_agent: "boris",
      action: "Fix type errors",
      file_refs: ["src/lib/types.ts"],
      priority: 1,
      effort: "low",
      status: "open",
      resolved_in_audit: null,
      iterations_open: 0,
      created_at: "2026-02-10T19:30:00.000Z",
      updated_at: "2026-02-10T19:30:00.000Z",
    },
  ],
  metadata: {
    total_items: 1,
    open: 1,
    resolved: 0,
    chronic: 0,
  },
};

describe("validateActionItemsLedger", () => {
  it("accepts a valid ledger", () => {
    const result = validateActionItemsLedger(validLedger);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data).not.toBeNull();
  });

  it("rejects non-object input", () => {
    const result = validateActionItemsLedger([]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.field).toBe("root");
  });

  it("rejects non-array items", () => {
    const result = validateActionItemsLedger({
      items: "not an array",
      metadata: {},
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "items")).toBe(true);
  });

  it("rejects item with missing id", () => {
    const result = validateActionItemsLedger({
      items: [{ action: "do something" }],
      metadata: { total_items: 1, open: 1, resolved: 0, chronic: 0 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "items[0].id")).toBe(true);
  });

  it("rejects item with missing action", () => {
    const result = validateActionItemsLedger({
      items: [{ id: "ai-001" }],
      metadata: { total_items: 1, open: 1, resolved: 0, chronic: 0 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "items[0].action")).toBe(true);
  });

  it("rejects missing metadata", () => {
    const result = validateActionItemsLedger({ items: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "metadata")).toBe(true);
  });

  it("accepts empty items array with valid metadata", () => {
    const result = validateActionItemsLedger({
      items: [],
      metadata: { total_items: 0, open: 0, resolved: 0, chronic: 0 },
    });
    expect(result.valid).toBe(true);
  });
});

// ─── TryPanelResult validation ─────────────────────────────────────

const validTryPanelResult = {
  audit_id: "web-20260211-120000",
  repo: {
    owner: "test",
    name: "repo",
    description: null,
    language: "TypeScript",
    stars: 10,
  },
  panel: "web-judges",
  timestamp: "2026-02-11T12:00:00Z",
  agents: [
    {
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
      one_line: "Solid",
      model_used: "claude-haiku-4-5-20251001",
    },
  ],
  composite: {
    score: 78,
    radar: {
      architecture: 80,
      product: 75,
      innovation: 70,
      code_quality: 82,
      documentation: 78,
      integration: 76,
    },
    grade: "B",
    verdict: "PASS",
  },
  highlights: {
    top_strengths: ["Good architecture"],
    top_weaknesses: ["Needs docs"],
    divergent_opinions: [],
  },
  action_items: [],
  files_analyzed: 5,
  tier: "free",
};

describe("validateTryPanelResult", () => {
  it("accepts a valid TryPanelResult", () => {
    const result = validateTryPanelResult(validTryPanelResult);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data).not.toBeNull();
  });

  it("rejects non-object input", () => {
    const result = validateTryPanelResult("not an object");
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.field).toBe("root");
  });

  it("rejects missing audit_id", () => {
    const result = validateTryPanelResult({
      ...validTryPanelResult,
      audit_id: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "audit_id")).toBe(true);
  });

  it("rejects invalid panel value", () => {
    const result = validateTryPanelResult({
      ...validTryPanelResult,
      panel: "other",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "panel")).toBe(true);
  });

  it("rejects invalid composite score", () => {
    const result = validateTryPanelResult({
      ...validTryPanelResult,
      composite: { ...validTryPanelResult.composite, score: 150 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "composite.score")).toBe(true);
  });

  it("rejects invalid composite grade", () => {
    const result = validateTryPanelResult({
      ...validTryPanelResult,
      composite: { ...validTryPanelResult.composite, grade: "Z" },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "composite.grade")).toBe(true);
  });

  it("rejects invalid tier", () => {
    const result = validateTryPanelResult({
      ...validTryPanelResult,
      tier: "premium",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "tier")).toBe(true);
  });

  it("rejects non-array agents", () => {
    const result = validateTryPanelResult({
      ...validTryPanelResult,
      agents: "not-array",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "agents")).toBe(true);
  });

  it("rejects negative files_analyzed", () => {
    const result = validateTryPanelResult({
      ...validTryPanelResult,
      files_analyzed: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "files_analyzed")).toBe(true);
  });

  it("rejects malformed files_detail entries", () => {
    const result = validateTryPanelResult({
      ...validTryPanelResult,
      files_detail: [{ path: 123, size: "big", category: "unknown" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field.startsWith("files_detail"))).toBe(
      true,
    );
  });

  it("accepts valid files_detail", () => {
    const result = validateTryPanelResult({
      ...validTryPanelResult,
      files_detail: [
        { path: "README.md", size: 1024, category: "priority" },
        { path: "src/index.ts", size: 2048, category: "source" },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it("accepts byok tier", () => {
    const result = validateTryPanelResult({
      ...validTryPanelResult,
      tier: "byok",
    });
    expect(result.valid).toBe(true);
  });
});
