"use client";

import { useCallback, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import type { ScoreEntry } from "@/lib/story-data";

// ─── Phase boundaries ────────────────────────────────────────────────────────

const PHASE_BOUNDARIES = [
  { x: 2, label: "Climb" },
  { x: 6, label: "Feature Drop" },
  { x: 11, label: "Recovery" },
  { x: 15, label: "Final Push" },
];

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  value: number;
  payload: ScoreEntry;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function StoryTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  if (!entry) return null;
  const { score, grade, verdict, iteration } = entry.payload;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 shadow-xl">
      <p className="text-sm font-medium text-gray-300">Iteration {iteration}</p>
      <p className="mt-1 text-2xl font-bold text-indigo-400">{score}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-200">
          {grade}
        </span>
        <span className="text-xs text-gray-400">
          {verdict.replace("_", " ")}
        </span>
      </div>
    </div>
  );
}

// ─── Dots ────────────────────────────────────────────────────────────────────

interface DotProps {
  cx?: number;
  cy?: number;
}

function ScoreDot({ cx, cy }: DotProps) {
  if (cx === undefined || cy === undefined) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#6366f1"
      stroke="#1e1b4b"
      strokeWidth={2}
    />
  );
}

function ActiveScoreDot({ cx, cy }: DotProps) {
  if (cx === undefined || cy === undefined) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill="#818cf8"
      stroke="#6366f1"
      strokeWidth={2}
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface StoryScoreChartProps {
  data: ScoreEntry[];
}

export function StoryScoreChart({ data }: StoryScoreChartProps) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => a.iteration - b.iteration),
    [data],
  );

  const formatXTick = useCallback((value: number) => `#${value}`, []);
  const prefersReducedMotion = useReducedMotion();

  if (sorted.length === 0) return null;

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`Score progression chart showing ${sorted.length} iterations from ${sorted[0]?.score} to ${sorted[sorted.length - 1]?.score}`}
    >
      <ResponsiveContainer width="100%" height={360}>
        <LineChart
          data={sorted}
          margin={{ top: 16, right: 24, bottom: 8, left: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1f2937"
            vertical={false}
          />

          <XAxis
            dataKey="iteration"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
            tickLine={{ stroke: "#374151" }}
            tickFormatter={formatXTick}
          />

          <YAxis
            domain={[60, 100]}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
            tickLine={{ stroke: "#374151" }}
            width={40}
          />

          <Tooltip
            content={<StoryTooltip />}
            cursor={{ stroke: "#4b5563", strokeDasharray: "4 4" }}
          />

          {/* Passing threshold */}
          <ReferenceLine
            y={85}
            stroke="#f59e0b"
            strokeDasharray="8 4"
            label={{
              value: "Pass: 85",
              position: "right",
              fill: "#f59e0b",
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          {/* Phase boundaries */}
          {PHASE_BOUNDARIES.map((b) => (
            <ReferenceLine
              key={b.x}
              x={b.x}
              stroke="#374151"
              strokeDasharray="4 4"
              label={{
                value: b.label,
                position: "top",
                fill: "#6b7280",
                fontSize: 10,
              }}
            />
          ))}

          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={<ScoreDot />}
            activeDot={<ActiveScoreDot />}
            animationDuration={prefersReducedMotion ? 0 : 800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
