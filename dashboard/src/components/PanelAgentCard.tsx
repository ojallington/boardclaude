"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { TryAgentProgress, Verdict } from "@/lib/types";
import { getAgentColor } from "@/lib/types";
import { VERDICT_BADGE_STYLES, AGENT_ROLES } from "@/lib/ui-constants";
import { messages } from "@/lib/messages";
import { EvaluationList } from "./EvaluationList";

interface PanelAgentCardProps {
  progress: TryAgentProgress;
}

export function PanelAgentCard({ progress }: PanelAgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { agent, status, result, toolUseCount } = progress;
  const color = getAgentColor(agent);
  const role = AGENT_ROLES[agent] ?? agent;

  // Pending
  if (status === "pending") {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium capitalize text-gray-400">
              {agent}
            </p>
            <p className="text-xs text-gray-600">{role}</p>
          </div>
          <span className="text-xs text-gray-600">
            {messages.tryIt.agentProgress.pending}
          </span>
        </div>
      </div>
    );
  }

  // Running
  if (status === "running") {
    return (
      <div
        className="rounded-xl border-2 bg-gray-900/60 p-4"
        style={{ borderColor: `${color}40` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium capitalize" style={{ color }}>
              {agent}
            </p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: color }}
            />
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
          </span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-3/4 animate-pulse rounded bg-gray-800" />
          <div className="h-2 w-1/2 animate-pulse rounded bg-gray-800" />
        </div>
        <p className="mt-2 text-xs text-gray-600">
          {toolUseCount
            ? `Investigating codebase (${toolUseCount} tool calls)...`
            : messages.tryIt.agentProgress.running}
        </p>
      </div>
    );
  }

  // Error
  if (status === "error") {
    return (
      <div className="rounded-xl border border-red-900/50 bg-gray-900/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium capitalize text-gray-500">
              {agent}
            </p>
            <p className="text-xs text-gray-600">{role}</p>
          </div>
          <span className="text-xs text-red-500">
            ({messages.tryIt.agentProgress.error.toLowerCase()})
          </span>
        </div>
      </div>
    );
  }

  // Complete
  if (!result) return null;
  const verdictStyle =
    VERDICT_BADGE_STYLES[result.verdict as Verdict] ??
    "bg-gray-800 text-gray-400 border-gray-700";

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
      className="rounded-xl border bg-gray-900/60 p-4 cursor-pointer transition-colors hover:bg-gray-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
      style={{
        borderColor: `${color}30`,
        borderLeftWidth: 3,
        borderLeftColor: color,
      }}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium capitalize" style={{ color }}>
              {agent}
            </p>
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${verdictStyle}`}
            >
              {result.verdict}
            </span>
          </div>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold tabular-nums text-gray-100">
            {result.composite}
          </span>
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {result.one_line && (
        <p className="mt-1.5 text-xs italic text-gray-400 line-clamp-1">
          {result.one_line}
        </p>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }
            }
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 border-t border-gray-800 pt-3">
              <EvaluationList
                items={result.strengths}
                variant="strengths"
                label="Strengths"
                size="sm"
                iconColor="text-emerald-500"
              />
              <EvaluationList
                items={result.weaknesses}
                variant="weaknesses"
                label="Weaknesses"
                size="sm"
                iconColor="text-amber-500"
              />

              {/* Action items */}
              {result.action_items.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Action Items
                  </h4>
                  <ol className="space-y-0.5">
                    {result.action_items.map((item) => (
                      <li
                        key={item.priority}
                        className="flex items-start gap-1.5 text-xs text-gray-300"
                      >
                        <span className="text-indigo-400 shrink-0 font-mono">
                          {item.priority}.
                        </span>
                        <span>{item.action}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <p className="text-[10px] text-gray-600">
                Model: {result.model_used}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
