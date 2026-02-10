import { describe, it, expect } from "vitest";
import {
  validateAgentEvaluation,
  validateSynthesisReport,
  parseAgentEvaluation,
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
