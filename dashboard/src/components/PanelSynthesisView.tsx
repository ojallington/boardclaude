"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { TryPanelResult, Verdict, SynthesisActionItem } from "@/lib/types";
import { getAgentColor } from "@/lib/types";
import { VERDICT_BADGE_STYLES, GRADE_STYLES } from "@/lib/ui-constants";
import { RadarChart } from "./RadarChart";

interface PanelSynthesisViewProps {
  result: TryPanelResult;
}

const EFFORT_STYLES: Record<string, string> = {
  low: "bg-emerald-900/40 text-emerald-400 border-emerald-800",
  medium: "bg-blue-900/40 text-blue-400 border-blue-800",
  high: "bg-amber-900/40 text-amber-400 border-amber-800",
  max: "bg-red-900/40 text-red-400 border-red-800",
};

export function PanelSynthesisView({ result }: PanelSynthesisViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const { composite, highlights, action_items } = result;
  const verdictStyle =
    VERDICT_BADGE_STYLES[composite.verdict as Verdict] ??
    "bg-gray-800 text-gray-400 border-gray-700";
  const gradeColor = GRADE_STYLES[composite.grade] ?? "text-gray-400";

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4 }}
      className="space-y-6"
    >
      {/* Composite Score Hero */}
      <div className="rounded-xl border border-indigo-600/30 bg-gray-900 p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
          Panel Consensus
        </p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-5xl font-bold tabular-nums text-gray-100">
            {composite.score}
          </span>
          <div className="flex flex-col items-start gap-1">
            <span className={`text-2xl font-bold ${gradeColor}`}>
              {composite.grade}
            </span>
            <span
              className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${verdictStyle}`}
            >
              {composite.verdict}
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>
            {result.repo.owner}/{result.repo.name}
          </span>
          <span>&middot;</span>
          <span>{result.files_analyzed} files analyzed</span>
          <span>&middot;</span>
          <span className="rounded-full border border-gray-700 px-2 py-0.5">
            {result.tier === "byok" ? "Full Panel" : "Demo Mode"}
          </span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center">
        <RadarChart data={composite.radar} size={320} />
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Top Strengths */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
            Top Strengths
          </h3>
          <ul className="space-y-2">
            {highlights.top_strengths.filter(Boolean).map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-300"
              >
                <span className="mt-0.5 shrink-0 text-emerald-500">
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="size-4"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Weaknesses */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
            Top Weaknesses
          </h3>
          <ul className="space-y-2">
            {highlights.top_weaknesses.filter(Boolean).map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-300"
              >
                <span className="mt-0.5 shrink-0 text-amber-500">
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="size-4"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Divergent Opinions */}
      {highlights.divergent_opinions.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
            Divergent Opinions
          </h3>
          <div className="space-y-4">
            {highlights.divergent_opinions.map((d, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium text-gray-200">{d.topic}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                    <p
                      className="text-xs font-medium capitalize mb-1"
                      style={{ color: getAgentColor(d.agent_a.agent) }}
                    >
                      {d.agent_a.agent}
                    </p>
                    <p className="text-xs text-gray-400">
                      {d.agent_a.position}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                    <p
                      className="text-xs font-medium capitalize mb-1"
                      style={{ color: getAgentColor(d.agent_b.agent) }}
                    >
                      {d.agent_b.agent}
                    </p>
                    <p className="text-xs text-gray-400">
                      {d.agent_b.position}
                    </p>
                  </div>
                </div>
                <p className="text-xs italic text-gray-500">{d.analysis}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {action_items.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Prioritized Action Items
          </h3>
          <div className="space-y-3">
            {action_items.map((item: SynthesisActionItem, i: number) => {
              const effortStyle =
                EFFORT_STYLES[item.effort] ??
                "bg-gray-800 text-gray-400 border-gray-700";

              return (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 shrink-0 font-mono text-xs text-indigo-400 w-5 text-right">
                    {item.priority}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200">{item.action}</p>
                    {item.impact && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.impact}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {item.source_agents?.length > 0 && (
                        <div className="flex items-center gap-1">
                          {item.source_agents.map((a) => (
                            <span
                              key={a}
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold capitalize text-white"
                              style={{ backgroundColor: getAgentColor(a) }}
                              title={a}
                            >
                              {a[0]}
                            </span>
                          ))}
                        </div>
                      )}
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${effortStyle}`}
                      >
                        {item.effort}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
