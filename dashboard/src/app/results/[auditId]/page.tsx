import Link from "next/link";
import type { Metadata } from "next";

// ─── Page metadata ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Audit Detail - BoardClaude",
  description: "Detailed audit report with per-agent scores and analysis.",
};

// ─── Page Component ─────────────────────────────────────────────────────────

interface AuditDetailPageProps {
  params: Promise<{ auditId: string }>;
}

export default async function AuditDetailPage({ params }: AuditDetailPageProps) {
  const { auditId } = await params;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-8">
        <Link
          href="/results"
          className="text-sm text-gray-500 transition-colors hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:rounded"
        >
          &larr; Back to Results
        </Link>
      </nav>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-24">
        <h1 className="text-2xl font-bold text-gray-100">
          Audit detail coming soon
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Detailed view for{" "}
          <code className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-gray-300">
            {auditId}
          </code>
        </p>
        <p className="mt-6 max-w-md text-center text-sm text-gray-600">
          This page will display per-agent scores, radar chart, divergent
          opinions, action items, and the full synthesis report.
        </p>
      </div>
    </main>
  );
}
