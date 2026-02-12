"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { TryPanelResult, Verdict } from "@/lib/types";
import { VERDICT_BADGE_STYLES, GRADE_STYLES } from "@/lib/ui-constants";
import { RadarChart } from "./RadarChart";
import { DivergentOpinions } from "./DivergentOpinions";
import { PrioritizedActionItems } from "./PrioritizedActionItems";
import { FilesAnalyzedSection } from "./FilesAnalyzedSection";
import { EvaluationList } from "./EvaluationList";

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
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <EvaluationList
            items={highlights.top_strengths}
            variant="strengths"
            label="Top Strengths"
            iconColor="text-emerald-500"
          />
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <EvaluationList
            items={highlights.top_weaknesses}
            variant="weaknesses"
            label="Top Weaknesses"
            iconColor="text-amber-500"
          />
        </div>
      </div>

      {/* Divergent Opinions */}
      <DivergentOpinions opinions={highlights.divergent_opinions} />

      {/* Action Items */}
      <PrioritizedActionItems items={action_items} />
    </motion.div>
  );
}
