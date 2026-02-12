import { describe, it, expect } from "vitest";
import {
  extractNumber,
  extractRadar,
  extractStringArray,
  extractDivergentOpinion,
  extractHighlights,
  extractSynthesisActionItem,
  extractActionItems,
} from "@/lib/try-synthesize";

describe("extractNumber", () => {
  it("returns the number when valid", () => {
    expect(extractNumber({ score: 85 }, "score", 50)).toBe(85);
  });

  it("returns fallback for non-number", () => {
    expect(extractNumber({ score: "hello" }, "score", 50)).toBe(50);
  });

  it("returns fallback for missing key", () => {
    expect(extractNumber({}, "score", 50)).toBe(50);
  });

  it("returns fallback for NaN", () => {
    expect(extractNumber({ score: NaN }, "score", 50)).toBe(50);
  });

  it("returns fallback for Infinity", () => {
    expect(extractNumber({ score: Infinity }, "score", 50)).toBe(50);
  });

  it("accepts zero", () => {
    expect(extractNumber({ score: 0 }, "score", 50)).toBe(0);
  });

  it("accepts negative numbers", () => {
    expect(extractNumber({ score: -10 }, "score", 50)).toBe(-10);
  });
});

describe("extractRadar", () => {
  it("extracts valid radar data", () => {
    const data = {
      composite: {
        radar: {
          architecture: 90,
          product: 85,
          innovation: 75,
          code_quality: 88,
          documentation: 70,
          integration: 80,
        },
      },
    };
    const result = extractRadar(data, 50);
    expect(result).toEqual({
      architecture: 90,
      product: 85,
      innovation: 75,
      code_quality: 88,
      documentation: 70,
      integration: 80,
    });
  });

  it("returns all fallback when composite is missing", () => {
    const result = extractRadar({}, 60);
    expect(result).toEqual({
      architecture: 60,
      product: 60,
      innovation: 60,
      code_quality: 60,
      documentation: 60,
      integration: 60,
    });
  });

  it("returns fallback for missing axes", () => {
    const data = {
      composite: {
        radar: { architecture: 90 },
      },
    };
    const result = extractRadar(data, 50);
    expect(result.architecture).toBe(90);
    expect(result.product).toBe(50);
  });

  it("handles non-object composite", () => {
    const result = extractRadar({ composite: "string" }, 50);
    expect(result.architecture).toBe(50);
  });
});

describe("extractStringArray", () => {
  it("returns strings from valid array", () => {
    expect(extractStringArray(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("filters non-string items", () => {
    expect(extractStringArray(["a", 42, null, "b"])).toEqual(["a", "b"]);
  });

  it("returns empty for non-array", () => {
    expect(extractStringArray("not array")).toEqual([]);
    expect(extractStringArray(null)).toEqual([]);
    expect(extractStringArray(undefined)).toEqual([]);
  });
});

describe("extractDivergentOpinion", () => {
  const valid = {
    topic: "Architecture quality",
    agent_a: { agent: "boris", position: "Strong" },
    agent_b: { agent: "thariq", position: "Weak" },
    analysis: "Both have points",
  };

  it("extracts valid opinion", () => {
    const result = extractDivergentOpinion(valid);
    expect(result).toEqual(valid);
  });

  it("returns null for non-object", () => {
    expect(extractDivergentOpinion("string")).toBeNull();
    expect(extractDivergentOpinion(null)).toBeNull();
  });

  it("returns null when topic missing", () => {
    const { topic: _t, ...rest } = valid;
    expect(extractDivergentOpinion(rest)).toBeNull();
  });

  it("returns null when agent_a is invalid", () => {
    expect(
      extractDivergentOpinion({ ...valid, agent_a: "not object" }),
    ).toBeNull();
    expect(
      extractDivergentOpinion({
        ...valid,
        agent_a: { agent: 123, position: "ok" },
      }),
    ).toBeNull();
  });

  it("returns null when agent_b is missing position", () => {
    expect(
      extractDivergentOpinion({
        ...valid,
        agent_b: { agent: "name" },
      }),
    ).toBeNull();
  });
});

describe("extractHighlights", () => {
  it("extracts valid highlights", () => {
    const data = {
      highlights: {
        top_strengths: ["s1", "s2"],
        top_weaknesses: ["w1"],
        divergent_opinions: [
          {
            topic: "T",
            agent_a: { agent: "a", position: "p" },
            agent_b: { agent: "b", position: "q" },
            analysis: "X",
          },
        ],
      },
    };
    const result = extractHighlights(data);
    expect(result.top_strengths).toEqual(["s1", "s2"]);
    expect(result.top_weaknesses).toEqual(["w1"]);
    expect(result.divergent_opinions).toHaveLength(1);
  });

  it("returns empty defaults when highlights is missing", () => {
    const result = extractHighlights({});
    expect(result.top_strengths).toEqual([]);
    expect(result.top_weaknesses).toEqual([]);
    expect(result.divergent_opinions).toEqual([]);
  });

  it("filters invalid divergent opinions", () => {
    const data = {
      highlights: {
        top_strengths: [],
        top_weaknesses: [],
        divergent_opinions: [
          "not an object",
          { topic: "T" },
          {
            topic: "Valid",
            agent_a: { agent: "a", position: "p" },
            agent_b: { agent: "b", position: "q" },
            analysis: "ok",
          },
        ],
      },
    };
    const result = extractHighlights(data);
    expect(result.divergent_opinions).toHaveLength(1);
    expect(result.divergent_opinions[0]?.topic).toBe("Valid");
  });
});

describe("extractSynthesisActionItem", () => {
  it("extracts valid action item", () => {
    const item = {
      priority: 1,
      action: "Fix bug",
      impact: "High",
      source_agents: ["boris", "lydia"],
      effort: "low",
    };
    const result = extractSynthesisActionItem(item);
    expect(result).toEqual(item);
  });

  it("returns null for non-object", () => {
    expect(extractSynthesisActionItem("string")).toBeNull();
  });

  it("returns null when priority is missing", () => {
    expect(
      extractSynthesisActionItem({ action: "Fix", impact: "High" }),
    ).toBeNull();
  });

  it("returns null when action is missing", () => {
    expect(
      extractSynthesisActionItem({ priority: 1, impact: "High" }),
    ).toBeNull();
  });

  it("defaults effort to medium when invalid", () => {
    const result = extractSynthesisActionItem({
      priority: 1,
      action: "Fix",
      impact: "High",
      effort: "invalid",
    });
    expect(result?.effort).toBe("medium");
  });

  it("handles missing source_agents gracefully", () => {
    const result = extractSynthesisActionItem({
      priority: 1,
      action: "Fix",
      impact: "High",
    });
    expect(result?.source_agents).toEqual([]);
  });

  it("filters non-string source_agents", () => {
    const result = extractSynthesisActionItem({
      priority: 1,
      action: "Fix",
      impact: "High",
      source_agents: ["boris", 42, null],
    });
    expect(result?.source_agents).toEqual(["boris"]);
  });
});

describe("extractActionItems", () => {
  it("extracts valid action items", () => {
    const data = {
      action_items: [
        { priority: 1, action: "Fix A", impact: "High", effort: "low" },
        { priority: 2, action: "Fix B", impact: "Med", effort: "medium" },
      ],
    };
    const result = extractActionItems(data);
    expect(result).toHaveLength(2);
  });

  it("returns empty for non-array", () => {
    expect(extractActionItems({})).toEqual([]);
    expect(extractActionItems({ action_items: "not array" })).toEqual([]);
  });

  it("filters invalid items", () => {
    const data = {
      action_items: [
        { priority: 1, action: "Fix", impact: "High" },
        "invalid",
        null,
        { priority: 2 }, // missing action and impact
      ],
    };
    const result = extractActionItems(data);
    expect(result).toHaveLength(1);
  });
});
