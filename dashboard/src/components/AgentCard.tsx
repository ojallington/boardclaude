"use client";

import { motion, useReducedMotion } from "framer-motion";
import { getAgentColor, type Verdict } from "@/lib/types";
import { VERDICT_BADGE_STYLES } from "@/lib/ui-constants";
import { messages } from "@/lib/messages";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AgentCardProps {
  agent: string;
  role: string;
  scores: Record<string, number>;
  composite: number;
  strengths: string[];
  weaknesses: string[];
  critical_issues: string[];
  verdict: Verdict;
  one_line?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VERDICT_LABELS = messages.agentCard.verdicts;

function formatCriterionLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-green-500";
  if (score >= 55) return "bg-amber-500";
  return "bg-red-500";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${VERDICT_BADGE_STYLES[verdict]}`}
    >
      {VERDICT_LABELS[verdict]}
    </span>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <span
        className="w-36 shrink-0 text-sm text-gray-400 truncate"
        title={label}
      >
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
        <div
          className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(score)}`}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-medium text-gray-300 tabular-nums">
        {score}
      </span>
    </div>
  );
}

function ListSection({
  items,
  icon,
  iconColor,
  label,
}: {
  items: string[];
  icon: React.ReactNode;
  iconColor: string;
  label: string;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        {label}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-sm text-gray-300"
          >
            <span className={`mt-0.5 shrink-0 ${iconColor}`}>{icon}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid external dependency)
// ---------------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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
  );
}

function WarningIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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
  );
}

function AlertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * AgentCard -- Displays one agent's evaluation results on the BoardClaude
 * dashboard. Each card has a colored left border keyed to the agent, a
 * composite score with verdict badge, per-criterion horizontal bars,
 * strengths/weaknesses/critical issues, and a one-line summary.
 *
 * @example
 * ```tsx
 * import { AgentCard } from "@/components/AgentCard";
 *
 * <AgentCard
 *   agent="boris"
 *   role="Architecture & Verification"
 *   scores={{ type_safety: 82, error_handling: 75, modularity: 90 }}
 *   composite={83}
 *   strengths={["Clean module boundaries", "Strong typing", "Clear contracts"]}
 *   weaknesses={["Missing error boundaries", "No retry logic", "Sparse logging"]}
 *   critical_issues={[]}
 *   verdict="PASS"
 *   one_line="Solid architecture with room for resilience improvements."
 * />
 * ```
 */
export function AgentCard({
  agent,
  role,
  scores,
  composite,
  strengths,
  weaknesses,
  critical_issues,
  verdict,
  one_line,
}: AgentCardProps) {
  const accentColor = getAgentColor(agent);
  const scoreEntries = Object.entries(scores);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.35, ease: "easeOut" }
      }
      className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
      aria-label={`Evaluation by ${agent}`}
    >
      <div className="p-5 space-y-5">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold capitalize text-gray-100 truncate">
              {agent}
            </h3>
            <p className="text-sm text-gray-400">{role}</p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: accentColor }}
              aria-label={`Composite score: ${composite}`}
            >
              {composite}
            </span>
            <VerdictBadge verdict={verdict} />
          </div>
        </div>

        {/* ── Criterion Score Bars ────────────────────────────── */}
        {scoreEntries.length > 0 && (
          <div className="space-y-2" role="list" aria-label="Criterion scores">
            {scoreEntries.map(([criterion, value]) => (
              <ScoreBar
                key={criterion}
                label={formatCriterionLabel(criterion)}
                score={value}
              />
            ))}
          </div>
        )}

        {/* ── Strengths / Weaknesses / Critical Issues ───────── */}
        <div className="space-y-4">
          <ListSection
            items={strengths}
            icon={<CheckIcon />}
            iconColor="text-emerald-400"
            label={messages.agentCard.sections.strengths}
          />
          <ListSection
            items={weaknesses}
            icon={<WarningIcon />}
            iconColor="text-amber-400"
            label={messages.agentCard.sections.weaknesses}
          />
          <ListSection
            items={critical_issues}
            icon={<AlertIcon />}
            iconColor="text-red-400"
            label={messages.agentCard.sections.criticalIssues}
          />
        </div>

        {/* ── One-line Summary ────────────────────────────────── */}
        {one_line && (
          <p className="text-sm italic text-gray-400 border-t border-gray-800 pt-4">
            {one_line}
          </p>
        )}
      </div>
    </motion.article>
  );
}
