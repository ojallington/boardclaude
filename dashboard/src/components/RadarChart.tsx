"use client";

import React from "react";
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { RadarData } from "@/lib/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RadarChartProps {
  data: RadarData;
  size?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RadarDatum {
  axis: string;
  value: number;
  fullMark: number;
}

const AXIS_LABELS: Record<keyof RadarData, string> = {
  architecture: "Architecture",
  product: "Product",
  innovation: "Innovation",
  code_quality: "Code Quality",
  documentation: "Documentation",
  integration: "Integration",
};

function toRadarData(data: RadarData): RadarDatum[] {
  return (Object.keys(AXIS_LABELS) as Array<keyof RadarData>).map((key) => ({
    axis: AXIS_LABELS[key],
    value: data[key],
    fullMark: 100,
  }));
}

// ---------------------------------------------------------------------------
// Custom tick renderer (Recharts PolarAngleAxis requires explicit styling
// to match dark-theme colors since it does not accept Tailwind classes)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Recharts tick callback uses `any` props
function renderAxisTick(props: any): React.ReactElement<SVGElement> {
  const { x, y, payload, textAnchor } = props as {
    x: number;
    y: number;
    payload: { value: string };
    textAnchor: "inherit" | "start" | "middle" | "end";
  };

  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      fill="#d1d5db" /* gray-300 */
      fontSize={12}
      fontFamily="var(--font-inter), Inter, system-ui, sans-serif"
    >
      {payload.value}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * RadarChart -- A 6-axis radar/spider chart visualizing aggregate scores
 * across the core evaluation dimensions. Built on Recharts with dark-theme
 * styling that matches the BoardClaude dashboard.
 *
 * @example
 * ```tsx
 * import { RadarChart } from "@/components/RadarChart";
 *
 * <RadarChart
 *   data={{
 *     architecture: 85,
 *     product: 72,
 *     innovation: 90,
 *     code_quality: 78,
 *     documentation: 65,
 *     integration: 80,
 *   }}
 *   size={400}
 * />
 * ```
 */
export function RadarChart({ data, size = 400 }: RadarChartProps) {
  const chartData = toRadarData(data);

  return (
    <div
      style={{ width: size, height: size }}
      role="img"
      aria-label="Radar chart showing scores for Architecture, Product, Innovation, Code Quality, Documentation, and Integration"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart
          cx="50%"
          cy="50%"
          outerRadius="75%"
          data={chartData}
        >
          <PolarGrid stroke="#374151" /* gray-700 */ />
          <PolarAngleAxis dataKey="axis" tick={renderAxisTick} />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#6366f1" /* indigo-500 */
            fill="#6366f1"
            fillOpacity={0.3}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
