import { Suspense } from "react";
import type { Metadata } from "next";
import { messages } from "@/lib/messages";
import { getAllAuditSummaries } from "@/lib/audit-loader";
import { listWebReviews } from "@/lib/try-storage";
import { ResultsPageClient } from "@/components/ResultsPageClient";
import { TimelineInline } from "@/components/TimelineInline";

export const metadata: Metadata = {
  title: messages.results.title,
  description: messages.results.description,
};

function ResultsLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-gray-800" />
      <div className="h-4 w-72 rounded bg-gray-800" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={`skel-${i}`} className="h-32 rounded-xl bg-gray-800/50" />
        ))}
      </div>
    </div>
  );
}

async function ResultsContent() {
  const [audits, webReviews] = await Promise.all([
    getAllAuditSummaries(),
    listWebReviews(),
  ]);

  return (
    <ResultsPageClient
      audits={audits}
      webReviews={webReviews}
      timelineContent={<TimelineInline />}
    />
  );
}

export default function ResultsPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <Suspense fallback={<ResultsLoadingSkeleton />}>
        <ResultsContent />
      </Suspense>
    </main>
  );
}
