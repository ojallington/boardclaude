"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { TryResult, TryStreamPhase, Verdict } from "@/lib/types";
import { VERDICT_BADGE_STYLES } from "@/lib/ui-constants";
import { messages } from "@/lib/messages";
import { EvaluationList } from "./EvaluationList";

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-green-500";
  if (score >= 55) return "bg-amber-500";
  return "bg-red-500";
}

function formatDimension(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-3 w-3">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${color}`}
      />
      <span className={`relative inline-flex h-3 w-3 rounded-full ${color}`} />
    </span>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-sm text-gray-300 truncate">
        {label}
      </span>
      <div
        className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${score} out of 100`}
      >
        <motion.div
          className={`h-full rounded-full ${scoreBarColor(score)}`}
          initial={shouldReduceMotion ? false : { width: 0 }}
          animate={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.6, ease: "easeOut" }
          }
        />
      </div>
      <span className="w-8 text-right text-sm font-medium text-gray-300 tabular-nums">
        {score}
      </span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface StreamingAgentCardProps {
  phase: TryStreamPhase;
  result: Partial<TryResult> | null;
  repoInfo: { owner: string; name: string } | null;
  modelInfo: string | null;
}

export function StreamingAgentCard({
  phase,
  result,
  repoInfo,
  modelInfo,
}: StreamingAgentCardProps) {
  const shouldReduceMotion = useReducedMotion();
  // Waiting state
  if (phase === "validating" || phase === "fetching") {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
        <div className="flex items-center gap-3">
          <PulsingDot color="bg-gray-400" />
          <span className="text-gray-300">{messages.tryIt.phases[phase]}</span>
        </div>
        {repoInfo && (
          <p className="mt-3 text-sm text-gray-500">
            {repoInfo.owner}/{repoInfo.name}
          </p>
        )}
      </div>
    );
  }

  // Reviewing state
  if (phase === "reviewing") {
    return (
      <div className="rounded-xl border border-indigo-600/50 bg-gray-900/60 p-6">
        <div className="flex items-center gap-3">
          <PulsingDot color="bg-indigo-400" />
          <span className="text-indigo-300">
            {messages.tryIt.phases.reviewing}
          </span>
          {modelInfo && (
            <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
              {modelInfo}
            </span>
          )}
        </div>
        {repoInfo && (
          <p className="mt-3 text-sm text-gray-500">
            {repoInfo.owner}/{repoInfo.name}
          </p>
        )}
        {/* Shimmer skeleton */}
        <div className="mt-4 space-y-3">
          <div className="h-3 w-3/4 animate-pulse rounded bg-gray-800" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-800" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-800" />
        </div>
      </div>
    );
  }

  // Complete state
  if (phase === "complete" && result) {
    const verdict = result.verdict as Verdict | undefined;
    const verdictStyle = verdict
      ? VERDICT_BADGE_STYLES[verdict]
      : "bg-gray-800 text-gray-300 border-gray-700";

    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
        className="rounded-xl border border-gray-800 bg-gray-900 p-6"
        style={{ borderLeftWidth: 4, borderLeftColor: "#6366f1" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-100">
              {result.repo
                ? `${result.repo.owner}/${result.repo.name}`
                : "Review"}
            </h3>
            <p className="text-sm text-gray-300">
              BoardClaude Reviewer
              {result.model_used && (
                <span className="ml-2 rounded-md bg-gray-800 px-2 py-0.5 text-xs">
                  {result.model_used}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {result.composite !== undefined && (
              <span
                className="text-2xl font-bold tabular-nums text-indigo-400"
                aria-label={`Composite score: ${result.composite}`}
              >
                {result.composite}
              </span>
            )}
            {verdict && (
              <span
                className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${verdictStyle}`}
              >
                {messages.agentCard.verdicts[verdict]}
              </span>
            )}
          </div>
        </div>

        {/* One-line summary */}
        {result.one_line && (
          <p className="mt-3 text-sm italic text-gray-300">{result.one_line}</p>
        )}

        {/* Score bars */}
        {result.scores && (
          <div className="mt-4 space-y-2">
            {Object.entries(result.scores).map(([key, value]) => (
              <ScoreBar
                key={key}
                label={formatDimension(key)}
                score={value as number}
              />
            ))}
          </div>
        )}

        {/* Strengths */}
        {result.strengths && result.strengths.length > 0 && (
          <div className="mt-4">
            <EvaluationList
              items={result.strengths}
              variant="strengths"
              label="Strengths"
            />
          </div>
        )}

        {/* Weaknesses */}
        {result.weaknesses && result.weaknesses.length > 0 && (
          <div className="mt-4">
            <EvaluationList
              items={result.weaknesses}
              variant="weaknesses"
              label="Weaknesses"
            />
          </div>
        )}

        {/* Action Items */}
        {result.action_items && result.action_items.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
              Action Items
            </h4>
            <ol className="space-y-1.5">
              {result.action_items.map((item) => (
                <li
                  key={item.priority}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <span className="mt-0.5 shrink-0 text-xs font-mono text-indigo-400 w-4">
                    {item.priority}.
                  </span>
                  <span>
                    {item.action}
                    {item.impact && (
                      <span className="text-gray-500"> — {item.impact}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Meta */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 border-t border-gray-800 pt-4">
          <span>{result.files_analyzed} files analyzed</span>
          {result.timestamp && (
            <time>
              {new Date(result.timestamp).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          )}
        </div>
      </motion.div>
    );
  }

  // Idle / error state handled by parent
  return null;
}
