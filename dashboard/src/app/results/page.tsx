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

export default async function ResultsPage() {
  const [audits, webReviews] = await Promise.all([
    getAllAuditSummaries(),
    listWebReviews(),
  ]);

  return (
    <main
      id="main-content"
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <ResultsPageClient
        audits={audits}
        webReviews={webReviews}
        timelineContent={<TimelineInline />}
      />
    </main>
  );
}
