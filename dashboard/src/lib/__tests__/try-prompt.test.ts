import { describe, it, expect } from "vitest";
import { buildUserPrompt, buildCrossIterationContext } from "../try-prompt";

// ─── buildUserPrompt ─────────────────────────────────────────────────

describe("buildUserPrompt", () => {
  const repoMeta = {
    owner: "acme",
    name: "widget",
    description: "A fantastic widget library",
    language: "TypeScript",
    stars: 42,
  };

  const files = [
    { path: "README.md", content: "# Widget\nA widget library." },
    { path: "src/index.ts", content: "export const version = '1.0.0';" },
  ];

  it("includes the repository owner and name", () => {
    const prompt = buildUserPrompt(repoMeta, files, 100);
    expect(prompt).toContain("acme/widget");
  });

  it("includes the description when provided", () => {
    const prompt = buildUserPrompt(repoMeta, files, 100);
    expect(prompt).toContain("Description: A fantastic widget library");
  });

  it("excludes description line when description is null", () => {
    const meta = { ...repoMeta, description: null };
    const prompt = buildUserPrompt(meta, files, 100);
    expect(prompt).not.toContain("Description:");
  });

  it("includes the primary language when provided", () => {
    const prompt = buildUserPrompt(repoMeta, files, 100);
    expect(prompt).toContain("Primary Language: TypeScript");
  });

  it("excludes language line when language is null", () => {
    const meta = { ...repoMeta, language: null };
    const prompt = buildUserPrompt(meta, files, 100);
    expect(prompt).not.toContain("Primary Language:");
  });

  it("includes star count", () => {
    const prompt = buildUserPrompt(repoMeta, files, 100);
    expect(prompt).toContain("Stars: 42");
  });

  it("includes total files in repo (treeSize)", () => {
    const prompt = buildUserPrompt(repoMeta, files, 250);
    expect(prompt).toContain("Total files in repo: 250");
  });

  it("includes the number of files analyzed", () => {
    const prompt = buildUserPrompt(repoMeta, files, 100);
    expect(prompt).toContain("Files analyzed: 2");
  });

  it("includes file paths and contents", () => {
    const prompt = buildUserPrompt(repoMeta, files, 100);
    expect(prompt).toContain("--- README.md ---");
    expect(prompt).toContain("# Widget");
    expect(prompt).toContain("--- src/index.ts ---");
    expect(prompt).toContain("export const version");
  });

  it("ends with the JSON instruction", () => {
    const prompt = buildUserPrompt(repoMeta, files, 100);
    expect(prompt).toContain(
      "Evaluate this repository. Respond with ONLY the JSON object.",
    );
  });

  it("handles empty files array", () => {
    const prompt = buildUserPrompt(repoMeta, [], 100);
    expect(prompt).toContain("Files analyzed: 0");
    expect(prompt).toContain("Evaluate this repository.");
  });
});

// ─── buildCrossIterationContext ──────────────────────────────────────

describe("buildCrossIterationContext", () => {
  const basePrior = {
    timestamp: "2026-02-10T19:30:00.000Z",
    composite: { score: 68.4, grade: "C+", verdict: "MARGINAL" },
    agents: [
      {
        agent: "boris",
        role: "Architecture",
        composite: 72,
        one_line: "Solid foundation but needs polish",
      },
      {
        agent: "cat",
        role: "Product",
        composite: 65,
        one_line: "Decent but incomplete UX",
      },
    ],
    action_items: [
      { priority: 1, action: "Fix type safety issues" },
      { priority: 2, action: "Add integration tests" },
      { priority: 3, action: "Improve error handling" },
      { priority: 4, action: "Add documentation" },
    ],
  };

  it("includes the previous review header", () => {
    const context = buildCrossIterationContext(basePrior);
    expect(context).toContain("## Previous Review Context");
  });

  it("includes the prior timestamp", () => {
    const context = buildCrossIterationContext(basePrior);
    expect(context).toContain("2026-02-10T19:30:00.000Z");
  });

  it("includes the prior composite score, grade, and verdict", () => {
    const context = buildCrossIterationContext(basePrior);
    expect(context).toContain("68.4");
    expect(context).toContain("C+");
    expect(context).toContain("MARGINAL");
  });

  it("includes prior agent scores", () => {
    const context = buildCrossIterationContext(basePrior);
    expect(context).toContain("boris (Architecture): 72");
    expect(context).toContain("Solid foundation but needs polish");
    expect(context).toContain("cat (Product): 65");
  });

  it("includes top 3 action items", () => {
    const context = buildCrossIterationContext(basePrior);
    expect(context).toContain("P1: Fix type safety issues");
    expect(context).toContain("P2: Add integration tests");
    expect(context).toContain("P3: Improve error handling");
    // 4th item should not be included (only top 3)
    expect(context).not.toContain("P4: Add documentation");
  });

  it("shows no-debate message when debate was not triggered", () => {
    const context = buildCrossIterationContext(basePrior);
    expect(context).toContain("No debate was triggered in the prior review.");
  });

  it("includes debate transcript when debate was triggered", () => {
    const priorWithDebate = {
      ...basePrior,
      debate: {
        triggered: true,
        transcript: [
          {
            agent_a: "boris",
            agent_b: "cat",
            topic: "Architecture quality",
            exchange: ["I think it is good", "I disagree"],
          },
        ],
      },
    };
    const context = buildCrossIterationContext(priorWithDebate);
    expect(context).toContain("Prior Debate Summary");
    expect(context).toContain("boris vs cat debated: Architecture quality");
  });

  it("includes debate score revisions when present", () => {
    const priorWithRevisions = {
      ...basePrior,
      debate: {
        triggered: true,
        revisions: [
          {
            agent: "boris",
            criterion: "architecture",
            original: 72,
            revised: 78,
          },
        ],
      },
    };
    const context = buildCrossIterationContext(priorWithRevisions);
    expect(context).toContain("Score revisions from debate");
    expect(context).toContain("boris revised architecture: 72 -> 78");
  });

  it("includes the task instructions at the end", () => {
    const context = buildCrossIterationContext(basePrior);
    expect(context).toContain("### Your Task:");
    expect(context).toContain("Evaluate the repository as it exists NOW");
    expect(context).toContain("Note improvements since the last review");
  });

  it("handles empty action items", () => {
    const prior = { ...basePrior, action_items: [] };
    const context = buildCrossIterationContext(prior);
    expect(context).not.toContain("Prior Action Items");
  });

  it("handles empty agents array", () => {
    const prior = { ...basePrior, agents: [] };
    const context = buildCrossIterationContext(prior);
    // Should still contain the header but no agent lines
    expect(context).toContain("### Prior Agent Scores:");
    expect(context).not.toContain("boris");
  });
});
