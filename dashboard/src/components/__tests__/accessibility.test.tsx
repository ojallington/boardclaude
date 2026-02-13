import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { ActionItemSection } from "../ActionItemSection";
import { EvaluationList } from "../EvaluationList";
import { AgentScoreMiniBar } from "../AgentScoreMiniBar";
import { PrioritizedActionItems } from "../PrioritizedActionItems";

expect.extend(toHaveNoViolations);

describe("Accessibility (axe-core)", () => {
  describe("ActionItemSection", () => {
    it("has no a11y violations with created items", async () => {
      const { container } = render(
        <ActionItemSection
          itemsCreated={[
            {
              id: "item-1",
              action: "Fix type assertion in reducer",
              priority: 1,
              source_agents: ["boris", "lydia"],
            },
          ]}
          itemsResolved={[]}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no a11y violations with resolved items", async () => {
      const { container } = render(
        <ActionItemSection
          itemsCreated={[]}
          itemsResolved={[
            {
              id: "item-2",
              action: "Add parseToRecord helper",
              resolution: "Extracted to type-guards.ts",
            },
          ]}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no a11y violations when empty", async () => {
      const { container } = render(
        <ActionItemSection itemsCreated={[]} itemsResolved={[]} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("EvaluationList", () => {
    it("has no a11y violations for strengths", async () => {
      const { container } = render(
        <EvaluationList
          items={["Clean architecture", "Strong typing", "Good tests"]}
          variant="strengths"
          label="Strengths"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no a11y violations for weaknesses", async () => {
      const { container } = render(
        <EvaluationList
          items={["Missing docs", "No retry logic"]}
          variant="weaknesses"
          label="Weaknesses"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no a11y violations for critical issues", async () => {
      const { container } = render(
        <EvaluationList
          items={["SQL injection vulnerability"]}
          variant="critical"
          label="Critical Issues"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no a11y violations when empty", async () => {
      const { container } = render(
        <EvaluationList items={[]} variant="strengths" label="Strengths" />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("AgentScoreMiniBar", () => {
    it("has no a11y violations with scores", async () => {
      const { container } = render(
        <AgentScoreMiniBar
          scores={[
            { agent: "boris", composite: 85 },
            { agent: "cat", composite: 78 },
            { agent: "thariq", composite: 90 },
          ]}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("PrioritizedActionItems", () => {
    it("has no a11y violations with items", async () => {
      const { container } = render(
        <PrioritizedActionItems
          items={[
            {
              priority: 1,
              action: "Fix type safety issue",
              impact: "Eliminates unsafe casts",
              source_agents: ["boris"],
              effort: "low",
            },
            {
              priority: 2,
              action: "Add accessibility tests",
              impact: "Catches regressions",
              source_agents: ["jason", "ado"],
              effort: "medium",
            },
          ]}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no a11y violations when empty", async () => {
      const { container } = render(<PrioritizedActionItems items={[]} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
