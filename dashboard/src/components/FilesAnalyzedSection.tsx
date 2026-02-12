"use client";

import { useState } from "react";
import type { FileDetail } from "@/lib/types";

interface FilesAnalyzedSectionProps {
  filesAnalyzed: number;
  filesDetail?: FileDetail[];
  className?: string;
}

function formatSize(chars: number): string {
  if (chars < 1000) return `${chars} chars`;
  return `${(chars / 1000).toFixed(1)}KB`;
}

export function FilesAnalyzedSection({
  filesAnalyzed,
  filesDetail,
  className = "",
}: FilesAnalyzedSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!filesDetail || filesDetail.length === 0) {
    return (
      <p className={`text-xs text-gray-500 ${className}`}>
        {filesAnalyzed} files analyzed
      </p>
    );
  }

  const priorityFiles = filesDetail.filter((f) => f.category === "priority");
  const sourceFiles = filesDetail.filter((f) => f.category === "source");

  return (
    <div
      className={`rounded-xl border border-gray-800 bg-gray-900/60 ${className}`}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-xl"
        aria-expanded={expanded}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
          Files Analyzed ({filesAnalyzed})
        </h3>
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`size-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-800 px-4 pb-4 pt-3 space-y-3">
          {priorityFiles.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Config &amp; Documentation
              </p>
              <div className="space-y-1">
                {priorityFiles.map((f) => (
                  <div
                    key={f.path}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-gray-300 truncate">
                      {f.path}
                    </span>
                    <span className="ml-2 shrink-0 text-gray-600">
                      {formatSize(f.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sourceFiles.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Source Code
              </p>
              <div className="space-y-1">
                {sourceFiles.map((f) => (
                  <div
                    key={f.path}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-gray-300 truncate">
                      {f.path}
                    </span>
                    <span className="ml-2 shrink-0 text-gray-600">
                      {formatSize(f.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-gray-600 italic">
            Files selected by relevance scoring: entry points, config, and core
            source files prioritized.
          </p>
        </div>
      )}
    </div>
  );
}
