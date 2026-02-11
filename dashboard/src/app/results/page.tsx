import type { Metadata } from "next";
import { messages } from "@/lib/messages";
import { getAllAuditSummaries } from "@/lib/audit-loader";
import { ResultsPageClient } from "@/components/ResultsPageClient";
import { TimelineInline } from "@/components/TimelineInline";

export const metadata: Metadata = {
  title: messages.results.title,
  description: messages.results.description,
};

export default async function ResultsPage() {
  const audits = await getAllAuditSummaries();

  return (
    <main
      id="main-content"
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <ResultsPageClient audits={audits} timelineContent={<TimelineInline />} />
    </main>
  );
}
