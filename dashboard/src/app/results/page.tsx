import Link from "next/link";
import type { Metadata } from "next";
import type { AuditSummary } from "@/lib/types";
import { messages } from "@/lib/messages";
import { getAllAuditSummaries } from "@/lib/audit-loader";
import {
  VERDICT_BADGE_STYLES,
  GRADE_STYLES,
  formatTimestamp,
} from "@/lib/ui-constants";

// ─── Page metadata ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: messages.results.title,
  description: messages.results.description,
};

// ─── Audit Card ─────────────────────────────────────────────────────────────

function AuditCard({ audit }: { audit: AuditSummary }) {
  const { audit_id, timestamp, panel, composite, iteration } = audit;
  const verdictStyle = VERDICT_BADGE_STYLES[composite.verdict];
  const gradeColor = GRADE_STYLES[composite.grade] ?? "text-gray-400";

  return (
    <Link
      href={`/results/${audit_id}`}
      className="group block rounded-xl border border-gray-800 bg-gray-900/60 p-6 transition-all hover:border-indigo-600/50 hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: audit info */}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate font-mono text-sm text-gray-400">{audit_id}</p>
          <p className="text-xs text-gray-500">{formatTimestamp(timestamp)}</p>
          <div className="flex items-center gap-2 pt-1">
            <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-300">
              {panel}
            </span>
            <span className="text-xs text-gray-500">
              {messages.results.iterationLabel} {iteration}
            </span>
          </div>
        </div>

        {/* Right: score + grade */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-gray-100">
              {composite.score}
            </span>
            <span className={`text-lg font-semibold ${gradeColor}`}>
              {composite.grade}
            </span>
          </div>
          <span
            className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${verdictStyle}`}
          >
            {composite.verdict}
          </span>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="mt-4 flex items-center gap-1 text-xs text-gray-600 transition-colors group-hover:text-indigo-400">
        <span>{messages.results.viewDetails}</span>
        <svg
          className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default async function ResultsPage() {
  const audits = await getAllAuditSummaries();
  const sorted = [...audits].sort((a, b) => b.iteration - a.iteration);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <nav className="mb-4">
          <Link
            href="/"
            className="text-sm text-gray-500 transition-colors hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:rounded"
          >
            {messages.results.backHome}
          </Link>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-gray-100">
          {messages.results.heading}
        </h1>
        <p className="text-gray-400">
          {sorted.length} audit{sorted.length !== 1 ? "s" : ""} across{" "}
          {new Set(sorted.map((a) => a.panel)).size} panel
          {new Set(sorted.map((a) => a.panel)).size !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Audit list */}
      {sorted.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-800">
          <p className="text-sm text-gray-500">
            No audits yet. Run your first audit with{" "}
            <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs">
              {messages.results.emptyCommand}
            </code>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((audit) => (
            <AuditCard key={audit.audit_id} audit={audit} />
          ))}
        </div>
      )}
    </main>
  );
}
