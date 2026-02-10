import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Mock framer-motion to avoid animation issues in jsdom
vi.mock("framer-motion", () => ({
  motion: {
    article: (props: Record<string, unknown>) => {
      const { children, ...rest } = props;
      return <article {...rest}>{children as React.ReactNode}</article>;
    },
  },
  useReducedMotion: () => false,
}));

import { AgentCard, type AgentCardProps } from "../AgentCard";

// ─── Fixtures ────────────────────────────────────────────────────────

const baseProps: AgentCardProps = {
  agent: "boris",
  role: "Architecture & Verification",
  scores: { type_safety: 82, error_handling: 75, modularity: 90 },
  composite: 83,
  strengths: ["Clean module boundaries", "Strong typing", "Clear contracts"],
  weaknesses: ["Missing error boundaries", "No retry logic", "Sparse logging"],
  critical_issues: [],
  verdict: "PASS",
  one_line: "Solid architecture with room for resilience improvements.",
};

// ─── Tests ───────────────────────────────────────────────────────────

describe("AgentCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders agent name and role", () => {
    render(<AgentCard {...baseProps} />);

    expect(screen.getByText("boris")).toBeDefined();
    expect(screen.getByText("Architecture & Verification")).toBeDefined();
  });

  it("displays composite score", () => {
    render(<AgentCard {...baseProps} />);

    expect(screen.getByText("83")).toBeDefined();
    expect(screen.getByLabelText("Composite score: 83")).toBeDefined();
  });

  it("shows verdict badge text", () => {
    render(<AgentCard {...baseProps} verdict="STRONG_PASS" />);

    expect(screen.getByText("STRONG PASS")).toBeDefined();
  });

  it("renders all score bars for given criteria", () => {
    render(<AgentCard {...baseProps} />);

    // formatCriterionLabel converts "type_safety" -> "Type Safety" etc.
    expect(screen.getByText("Type Safety")).toBeDefined();
    expect(screen.getByText("Error Handling")).toBeDefined();
    expect(screen.getByText("Modularity")).toBeDefined();

    // Numeric score values appear next to bars
    expect(screen.getByText("82")).toBeDefined();
    expect(screen.getByText("75")).toBeDefined();
    expect(screen.getByText("90")).toBeDefined();
  });

  it("renders strengths list items", () => {
    render(<AgentCard {...baseProps} />);

    expect(screen.getByText("Strengths")).toBeDefined();
    expect(screen.getByText("Clean module boundaries")).toBeDefined();
    expect(screen.getByText("Strong typing")).toBeDefined();
    expect(screen.getByText("Clear contracts")).toBeDefined();
  });

  it("renders weaknesses list items", () => {
    render(<AgentCard {...baseProps} />);

    expect(screen.getByText("Weaknesses")).toBeDefined();
    expect(screen.getByText("Missing error boundaries")).toBeDefined();
    expect(screen.getByText("No retry logic")).toBeDefined();
    expect(screen.getByText("Sparse logging")).toBeDefined();
  });

  it("shows critical issues when provided", () => {
    render(
      <AgentCard
        {...baseProps}
        critical_issues={["Security vulnerability in auth module"]}
      />,
    );

    expect(screen.getByText("Critical Issues")).toBeDefined();
    expect(
      screen.getByText("Security vulnerability in auth module"),
    ).toBeDefined();
  });

  it("hides critical issues section when array is empty", () => {
    render(<AgentCard {...baseProps} critical_issues={[]} />);

    expect(screen.queryByText("Critical Issues")).toBeNull();
  });

  it("shows one_line summary when provided", () => {
    render(<AgentCard {...baseProps} />);

    expect(
      screen.getByText(
        "Solid architecture with room for resilience improvements.",
      ),
    ).toBeDefined();
  });

  it("has correct aria-label on the article", () => {
    render(<AgentCard {...baseProps} />);

    expect(screen.getByLabelText("Evaluation by boris")).toBeDefined();
  });
});
