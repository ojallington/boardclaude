import Link from "next/link";
import type { Metadata } from "next";
import type { Grade, Verdict } from "@/lib/types";

// ─── Page metadata ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Audit Results - BoardClaude",
  description: "Browse all BoardClaude audit results and score progressions.",
};

// ─── Demo data (placeholder until real audits are available) ────────────────

interface AuditSummary {
  audit_id: string;
  timestamp: string;
  panel: string;
  composite: {
    score: number;
    grade: Grade;
    verdict: Verdict;
  };
  iteration: number;
}

const DEMO_AUDITS: AuditSummary[] = [
  {
    audit_id: "audit-20260210-180000",
    timestamp: "2026-02-10T18:00:00Z",
    panel: "hackathon-judges",
    composite: { score: 62, grade: "C", verdict: "MARGINAL" },
    iteration: 0,
  },
  {
    audit_id: "audit-20260210-223000",
    timestamp: "2026-02-10T22:30:00Z",
    panel: "hackathon-judges",
    composite: { score: 71, grade: "B-", verdict: "PASS" },
    iteration: 1,
  },
  {
    audit_id: "audit-20260211-040000",
    timestamp: "2026-02-11T04:00:00Z",
    panel: "hackathon-judges",
    composite: { score: 78, grade: "B+", verdict: "PASS" },
    iteration: 2,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const VERDICT_STYLES: Record<Verdict, string> = {
  STRONG_PASS: "bg-emerald-900/40 text-emerald-400 border-emerald-800",
  PASS: "bg-blue-900/40 text-blue-400 border-blue-800",
  MARGINAL: "bg-amber-900/40 text-amber-400 border-amber-800",
  FAIL: "bg-red-900/40 text-red-400 border-red-800",
};

const GRADE_STYLES: Record<string, string> = {
  "A+": "text-emerald-400",
  A: "text-emerald-400",
  "A-": "text-emerald-400",
  "B+": "text-blue-400",
  B: "text-blue-400",
  "B-": "text-blue-400",
  "C+": "text-amber-400",
  C: "text-amber-400",
  "C-": "text-amber-400",
  D: "text-red-400",
  F: "text-red-500",
};

// ─── Audit Card ─────────────────────────────────────────────────────────────

function AuditCard({ audit }: { audit: AuditSummary }) {
  const { audit_id, timestamp, panel, composite, iteration } = audit;
  const verdictStyle = VERDICT_STYLES[composite.verdict];
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
            <span className="text-xs text-gray-500">Iteration {iteration}</span>
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
        <span>View details</span>
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

export default function ResultsPage() {
  // Sort audits by iteration descending (most recent first)
  const audits = [...DEMO_AUDITS].sort((a, b) => b.iteration - a.iteration);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <nav className="mb-4">
          <Link
            href="/"
            className="text-sm text-gray-500 transition-colors hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:rounded"
          >
            &larr; Home
          </Link>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-gray-100">
          Audit Results
        </h1>
        <p className="text-gray-400">
          {audits.length} audit{audits.length !== 1 ? "s" : ""} across{" "}
          {new Set(audits.map((a) => a.panel)).size} panel
          {new Set(audits.map((a) => a.panel)).size !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Audit list */}
      {audits.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-800">
          <p className="text-sm text-gray-500">
            No audits yet. Run your first audit with{" "}
            <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs">
              /bc:review
            </code>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {audits.map((audit) => (
            <AuditCard key={audit.audit_id} audit={audit} />
          ))}
        </div>
      )}
    </main>
  );
}
