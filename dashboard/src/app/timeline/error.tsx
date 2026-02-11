"use client";

import { useEffect } from "react";
import Link from "next/link";
import { messages } from "@/lib/messages";

export default function TimelineError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Timeline error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-bold text-gray-100">
        {messages.errors.timeline.heading}
      </h2>
      <p className="mt-2 text-sm text-gray-400">
        {messages.errors.timeline.description}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          {messages.errors.timeline.retry}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          {messages.errors.timeline.goHome}
        </Link>
      </div>
    </div>
  );
}
