"use client";

import { useEffect } from "react";
import { messages } from "@/lib/messages";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("BoardClaude error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-bold text-gray-100">
        {messages.errors.global.heading}
      </h2>
      <p className="mt-2 text-sm text-gray-400">
        {messages.errors.global.description}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
      >
        {messages.errors.global.retry}
      </button>
    </div>
  );
}
