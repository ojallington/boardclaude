import Link from "next/link";
import { messages } from "@/lib/messages";

export default function AuditNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-bold text-gray-100">
        {messages.errors.auditNotFound.heading}
      </h2>
      <p className="mt-2 text-sm text-gray-400">
        {messages.errors.auditNotFound.description}
      </p>
      <Link
        href="/results"
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
      >
        {messages.errors.auditNotFound.backToResults}
      </Link>
    </div>
  );
}
