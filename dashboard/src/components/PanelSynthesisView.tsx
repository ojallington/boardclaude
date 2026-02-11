"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { TryPanelResult, Verdict } from "@/lib/types";
import { VERDICT_BADGE_STYLES, GRADE_STYLES } from "@/lib/ui-constants";
import { RadarChart } from "./RadarChart";
import { DivergentOpinions } from "./DivergentOpinions";
import { PrioritizedActionItems } from "./PrioritizedActionItems";
import { FilesAnalyzedSection } from "./FilesAnalyzedSection";

interface PanelSynthesisViewProps {
  result: TryPanelResult;
}

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

      {/* Files Analyzed */}
      <FilesAnalyzedSection
        filesAnalyzed={result.files_analyzed}
        filesDetail={result.files_detail}
      />

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
      <DivergentOpinions opinions={highlights.divergent_opinions} />

      {/* Action Items */}
      <PrioritizedActionItems items={action_items} />
    </motion.div>
  );
}
