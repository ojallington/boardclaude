"use client";

import { useCallback, useMemo, useState } from "react";
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
  Legend,
} from "recharts";
import type { AgentScorePoint } from "@/lib/audit-loader";
import { getAgentColor } from "@/lib/types";

// ─── Props ──────────────────────────────────────────────────────────────────

interface AgentScoreProgressionProps {
  data: AgentScorePoint[];
  agentNames: string[];
  target?: number;
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
}

function AgentTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const sorted = [...payload].sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 shadow-xl">
      <p className="mb-2 text-sm font-medium text-gray-300">
        Iteration #{label}
      </p>
      <div className="space-y-1">
        {sorted.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="capitalize text-gray-300">{entry.dataKey}</span>
            <span className="ml-auto font-semibold text-gray-200">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AgentScoreProgression({
  data,
  agentNames,
  target = 85,
}: AgentScoreProgressionProps) {
  const [hiddenAgents, setHiddenAgents] = useState<Set<string>>(new Set());
  const prefersReducedMotion = useReducedMotion();

  const sortedData = useMemo(
    () => [...data].sort((a, b) => a.iteration - b.iteration),
    [data],
  );

  const formatXTick = useCallback((value: number) => `#${value}`, []);

  const toggleAgent = useCallback((agentName: string) => {
    setHiddenAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentName)) {
        next.delete(agentName);
      } else {
        next.add(agentName);
      }
      return next;
    });
  }, []);

  if (sortedData.length === 0) {
    return (
      <div
        className="flex h-64 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50"
        role="img"
        aria-label="Agent score progression chart with no data"
      >
        <p className="text-sm text-gray-300">No agent history available</p>
      </div>
    );
  }

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`Agent score progression chart showing ${agentNames.length} agents across ${sortedData.length} iterations`}
    >
      {/* Clickable agent legend */}
      <div className="mb-3 flex flex-wrap gap-3">
        {agentNames.map((name) => {
          const hidden = hiddenAgents.has(name);
          return (
            <button
              key={name}
              onClick={() => toggleAgent(name)}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-opacity ${
                hidden ? "opacity-40" : "opacity-100"
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getAgentColor(name) }}
              />
              <span className="capitalize text-gray-300">{name}</span>
            </button>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={sortedData}
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
            domain={[0, 100]}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
            tickLine={{ stroke: "#374151" }}
            width={40}
          />

          <Tooltip
            content={<AgentTooltip />}
            cursor={{ stroke: "#4b5563", strokeDasharray: "4 4" }}
          />

          <Legend content={() => null} />

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

          {agentNames.map((name) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={getAgentColor(name)}
              strokeWidth={2}
              hide={hiddenAgents.has(name)}
              dot={{ r: 3, fill: getAgentColor(name), strokeWidth: 0 }}
              activeDot={{
                r: 5,
                fill: getAgentColor(name),
                stroke: "#111827",
                strokeWidth: 2,
              }}
              animationDuration={prefersReducedMotion ? 0 : 600}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
