import { describe, it, expect } from "vitest";
import {
  panelToYaml,
  escapeYaml,
  type SerializedPanel,
} from "../panel-serializer";

// ─── escapeYaml ──────────────────────────────────────────────────────

describe("escapeYaml", () => {
  it("returns plain string when no special characters", () => {
    expect(escapeYaml("simple string")).toBe("simple string");
  });

  it("quotes strings containing colons", () => {
    const result = escapeYaml("key: value");
    expect(result).toBe('"key: value"');
  });

  it("quotes strings containing hash/comment characters", () => {
    const result = escapeYaml("has # comment");
    expect(result).toBe('"has # comment"');
  });

  it("quotes strings containing double quotes and escapes them", () => {
    const result = escapeYaml('say "hello"');
    expect(result).toBe('"say \\"hello\\""');
  });

  it("quotes strings containing single quotes", () => {
    const result = escapeYaml("it's a test");
    expect(result).toBe('"it\'s a test"');
  });

  it("quotes strings with leading spaces", () => {
    const result = escapeYaml(" leading space");
    expect(result).toBe('" leading space"');
  });

  it("quotes strings with trailing spaces", () => {
    const result = escapeYaml("trailing space ");
    expect(result).toBe('"trailing space "');
  });

  it("escapes backslashes in strings that need quoting", () => {
    const result = escapeYaml("path: C:\\Users");
    expect(result).toBe('"path: C:\\\\Users"');
  });

  it("does not quote a simple alphanumeric string", () => {
    expect(escapeYaml("AlphaNumeric123")).toBe("AlphaNumeric123");
  });
});

// ─── panelToYaml ─────────────────────────────────────────────────────

describe("panelToYaml", () => {
  const minimalPanel: SerializedPanel = {
    name: "test-panel",
    type: "professional",
    version: "1.0.0",
    description: "A test panel for unit testing",
    agents: [
      {
        name: "reviewer",
        role: "Code Reviewer",
        weight: 1.0,
        model: "claude-haiku-4-5-20251001",
        veto_power: false,
        prompt: "",
        criteria: [
          {
            name: "quality",
            weight: 1.0,
            description: "Code quality assessment",
          },
        ],
      },
    ],
    scoring: {
      scale: 100,
      passing_threshold: 70,
      iteration_target: 85,
    },
  };

  it("produces a string containing the panel name", () => {
    const yaml = panelToYaml(minimalPanel);
    expect(yaml).toContain("name: test-panel");
  });

  it("includes the panel type", () => {
    const yaml = panelToYaml(minimalPanel);
    expect(yaml).toContain("type: professional");
  });

  it("includes the version in quotes", () => {
    const yaml = panelToYaml(minimalPanel);
    expect(yaml).toContain('version: "1.0.0"');
  });

  it("includes the description", () => {
    const yaml = panelToYaml(minimalPanel);
    expect(yaml).toContain("A test panel for unit testing");
  });

  it("includes agent name and role", () => {
    const yaml = panelToYaml(minimalPanel);
    expect(yaml).toContain("- name: reviewer");
    expect(yaml).toContain("role: Code Reviewer");
  });

  it("includes agent weight and model", () => {
    const yaml = panelToYaml(minimalPanel);
    expect(yaml).toContain("weight: 1");
    expect(yaml).toContain("model: claude-haiku-4-5-20251001");
  });

  it("includes criteria entries", () => {
    const yaml = panelToYaml(minimalPanel);
    expect(yaml).toContain("- name: quality");
    expect(yaml).toContain("description: Code quality assessment");
  });

  it("includes scoring section", () => {
    const yaml = panelToYaml(minimalPanel);
    expect(yaml).toContain("scale: 100");
    expect(yaml).toContain("passing_threshold: 70");
    expect(yaml).toContain("iteration_target: 85");
  });

  it("includes veto_power only when true", () => {
    const yamlNoVeto = panelToYaml(minimalPanel);
    expect(yamlNoVeto).not.toContain("veto_power");

    const panelWithVeto: SerializedPanel = {
      ...minimalPanel,
      agents: [{ ...minimalPanel.agents[0]!, veto_power: true }],
    };
    const yamlWithVeto = panelToYaml(panelWithVeto);
    expect(yamlWithVeto).toContain("veto_power: true");
  });

  it("includes prompt block when prompt is non-empty", () => {
    const panelWithPrompt: SerializedPanel = {
      ...minimalPanel,
      agents: [
        {
          ...minimalPanel.agents[0]!,
          prompt: "You are a strict reviewer.\nBe thorough.",
        },
      ],
    };
    const yaml = panelToYaml(panelWithPrompt);
    expect(yaml).toContain("prompt: |");
    expect(yaml).toContain("You are a strict reviewer.");
    expect(yaml).toContain("Be thorough.");
  });

  it("does not include prompt block when prompt is empty", () => {
    const yaml = panelToYaml(minimalPanel);
    expect(yaml).not.toContain("prompt:");
  });

  it("escapes agent names with special characters", () => {
    const panelSpecial: SerializedPanel = {
      ...minimalPanel,
      agents: [
        {
          ...minimalPanel.agents[0]!,
          name: "agent: special",
        },
      ],
    };
    const yaml = panelToYaml(panelSpecial);
    expect(yaml).toContain('"agent: special"');
  });

  it("renders multiple agents", () => {
    const panelMulti: SerializedPanel = {
      ...minimalPanel,
      agents: [
        { ...minimalPanel.agents[0]!, name: "agent-a" },
        { ...minimalPanel.agents[0]!, name: "agent-b" },
      ],
    };
    const yaml = panelToYaml(panelMulti);
    expect(yaml).toContain("- name: agent-a");
    expect(yaml).toContain("- name: agent-b");
  });

  it("ends with a newline", () => {
    const yaml = panelToYaml(minimalPanel);
    expect(yaml.endsWith("\n")).toBe(true);
  });

  it("starts with the header comment", () => {
    const yaml = panelToYaml(minimalPanel);
    expect(yaml.startsWith("# BoardClaude Panel Configuration")).toBe(true);
  });
});
