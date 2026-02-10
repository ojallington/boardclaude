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

// ─── Props ──────────────────────────────────────────────────────────────────

interface ScoreDataPoint {
  iteration: number;
  score: number;
  grade: string;
  timestamp: string;
}

interface ScoreProgressionProps {
  history: ScoreDataPoint[];
  /** Iteration target score shown as a dashed reference line. Defaults to 85. */
  target?: number;
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  value: number;
  payload: ScoreDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ScoreTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const entry = payload[0];
  if (!entry) return null;
  const { score, grade, timestamp, iteration } = entry.payload;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 shadow-xl">
      <p className="text-sm font-medium text-gray-300">Iteration {iteration}</p>
      <p className="mt-1 text-2xl font-bold text-indigo-400">{score}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-200">
          {grade}
        </span>
        <span className="text-xs text-gray-500">
          {formatTimestamp(timestamp)}
        </span>
      </div>
    </div>
  );
}

// ─── Dot Renderer ───────────────────────────────────────────────────────────

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
  value?: number;
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

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * ScoreProgression renders a line chart showing score improvement across
 * audit iterations. Designed for dark theme dashboards.
 *
 * @example
 * ```tsx
 * import { ScoreProgression } from "@/components/ScoreProgression";
 *
 * const history = [
 *   { iteration: 0, score: 62, grade: "C", timestamp: "2026-02-10T18:00:00Z" },
 *   { iteration: 1, score: 71, grade: "B-", timestamp: "2026-02-10T20:30:00Z" },
 *   { iteration: 2, score: 78, grade: "B+", timestamp: "2026-02-11T01:00:00Z" },
 * ];
 *
 * <ScoreProgression history={history} target={85} />
 * ```
 */
export function ScoreProgression({
  history,
  target = 85,
}: ScoreProgressionProps) {
  // Memoize sorted data to avoid re-sorting on each render
  const data = useMemo(
    () => [...history].sort((a, b) => a.iteration - b.iteration),
    [history],
  );

  // Determine Y-axis domain: always include 0 and stretch to at least the target
  const yMax = useMemo(() => {
    const maxScore = data.reduce((max, d) => Math.max(max, d.score), 0);
    return Math.max(100, maxScore, target + 5);
  }, [data, target]);

  // Stable tick formatter to avoid anonymous function re-creation
  const formatXTick = useCallback((value: number) => `#${value}`, []);

  // Respect prefers-reduced-motion (consistent with AgentCard)
  const prefersReducedMotion = useReducedMotion();

  if (data.length === 0) {
    return (
      <div
        className="flex h-64 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50"
        role="img"
        aria-label="Score progression chart with no data"
      >
        <p className="text-sm text-gray-500">No audit history available</p>
      </div>
    );
  }

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`Score progression chart showing ${data.length} iterations. Latest score: ${data[data.length - 1]?.score ?? 0}. Target: ${target}.`}
    >
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={data}
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
            domain={[0, yMax]}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
            tickLine={{ stroke: "#374151" }}
            width={40}
          />

          <Tooltip
            content={<ScoreTooltip />}
            cursor={{ stroke: "#4b5563", strokeDasharray: "4 4" }}
          />

          {/* Target reference line */}
          <ReferenceLine
            y={target}
            stroke="#f59e0b"
            strokeDasharray="8 4"
            label={{
              value: `Target: ${target}`,
              position: "right",
              fill: "#f59e0b",
              fontSize: 12,
              fontWeight: 600,
            }}
          />

          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={<ScoreDot />}
            activeDot={<ActiveScoreDot />}
            animationDuration={prefersReducedMotion ? 0 : 600}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
