"use client";

import { messages } from "@/lib/messages";

export type ResultsView = "list" | "timeline" | "web";

interface ResultsSubNavProps {
  active: ResultsView;
  onChange: (view: ResultsView) => void;
}

export function ResultsSubNav({ active, onChange }: ResultsSubNavProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-900 p-1 border border-gray-800">
      <button
        onClick={() => onChange("list")}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
          active === "list"
            ? "bg-gray-800 text-gray-100"
            : "text-gray-300 hover:text-gray-200"
        }`}
      >
        {messages.resultsSubNav.list}
      </button>
      <button
        onClick={() => onChange("timeline")}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
          active === "timeline"
            ? "bg-gray-800 text-gray-100"
            : "text-gray-300 hover:text-gray-200"
        }`}
      >
        {messages.resultsSubNav.timeline}
      </button>
      <button
        onClick={() => onChange("web")}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
          active === "web"
            ? "bg-gray-800 text-gray-100"
            : "text-gray-300 hover:text-gray-200"
        }`}
      >
        {messages.resultsSubNav.web}
      </button>
    </div>
  );
}
