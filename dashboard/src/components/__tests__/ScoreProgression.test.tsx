import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Mock recharts -- jsdom cannot render SVG, so we stub all chart primitives
vi.mock("recharts", () => ({
  LineChart: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CartesianGrid: () => null,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  useReducedMotion: () => false,
}));

import { ScoreProgression } from "../ScoreProgression";

// ─── Fixtures ────────────────────────────────────────────────────────

const sampleHistory = [
  {
    iteration: 0,
    score: 68,
    grade: "C+",
    timestamp: "2026-02-10T18:00:00Z",
  },
  {
    iteration: 1,
    score: 81,
    grade: "B+",
    timestamp: "2026-02-10T20:00:00Z",
  },
  {
    iteration: 2,
    score: 84,
    grade: "B+",
    timestamp: "2026-02-10T22:00:00Z",
  },
];

// ─── Tests ───────────────────────────────────────────────────────────

describe("ScoreProgression", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders without crashing", () => {
    const { container } = render(<ScoreProgression history={sampleHistory} />);

    expect(container.firstChild).not.toBeNull();
  });

  it("shows empty state when history is empty", () => {
    render(<ScoreProgression history={[]} />);

    expect(screen.getByText("No audit history available")).toBeDefined();
  });

  it("has correct aria-label with latest score and default target", () => {
    render(<ScoreProgression history={sampleHistory} />);

    const chart = screen.getByRole("img");
    expect(chart.getAttribute("aria-label")).toContain("3 iterations");
    expect(chart.getAttribute("aria-label")).toContain("Latest score: 84");
    expect(chart.getAttribute("aria-label")).toContain("Target: 85");
  });

  it("accepts custom target prop", () => {
    render(<ScoreProgression history={sampleHistory} target={90} />);

    const chart = screen.getByRole("img");
    expect(chart.getAttribute("aria-label")).toContain("Target: 90");
  });

  it("renders with a single data point", () => {
    const single = [sampleHistory[0]!];
    const { container } = render(<ScoreProgression history={single} />);

    expect(container.firstChild).not.toBeNull();
    const chart = screen.getByRole("img");
    expect(chart.getAttribute("aria-label")).toContain("1 iterations");
  });

  it("empty state has correct aria-label", () => {
    render(<ScoreProgression history={[]} />);

    expect(
      screen.getByLabelText("Score progression chart with no data"),
    ).toBeDefined();
  });
});
