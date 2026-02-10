import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Mock recharts -- jsdom cannot render SVG, so we stub all chart primitives
vi.mock("recharts", () => ({
  RadarChart: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  Radar: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import { RadarChart } from "../RadarChart";
import type { RadarData } from "@/lib/types";

// ─── Fixtures ────────────────────────────────────────────────────────

const sampleData: RadarData = {
  architecture: 85,
  product: 72,
  innovation: 90,
  code_quality: 78,
  documentation: 65,
  integration: 80,
};

// ─── Tests ───────────────────────────────────────────────────────────

describe("RadarChart", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders without crashing", () => {
    const { container } = render(<RadarChart data={sampleData} />);

    expect(container.firstChild).not.toBeNull();
  });

  it("has correct aria-label", () => {
    render(<RadarChart data={sampleData} />);

    expect(
      screen.getByLabelText(
        "Radar chart showing scores for Architecture, Product, Innovation, Code Quality, Documentation, and Integration",
      ),
    ).toBeDefined();
  });

  it("accepts custom size prop", () => {
    render(<RadarChart data={sampleData} size={300} />);

    const wrapper = screen.getByRole("img");
    expect(wrapper.style.width).toBe("300px");
    expect(wrapper.style.height).toBe("300px");
  });
});
