"use client";

import type { TryAgentProgress } from "@/lib/types";
import { getAgentColor } from "@/lib/types";
import { messages } from "@/lib/messages";

interface PanelProgressHeaderProps {
  agents: TryAgentProgress[];
  completedCount: number;
  total: number;
  tier: "free" | "byok" | null;
}

export function PanelProgressHeader({
  agents,
  completedCount,
  total,
  tier,
}: PanelProgressHeaderProps) {
  const progress = total > 0 ? (completedCount / total) * 100 : 0;
  const tierLabel =
    tier === "byok"
      ? messages.tryIt.byokModeLabel
      : messages.tryIt.demoModeLabel;
  const tierDesc =
    tier === "byok"
      ? messages.tryIt.byokModeDescription
      : messages.tryIt.demoModeDescription;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-200">
          {messages.tryIt.phases.reviewing}
        </h3>
        <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-0.5 text-xs text-gray-300">
          {tierLabel} &mdash; {tierDesc}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden mb-3"
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${completedCount} of ${total} agents complete`}
      >
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Agent dots */}
      <div className="flex items-center gap-2">
        {agents.map((a) => {
          const color = getAgentColor(a.agent);
          const isRunning = a.status === "running";
          const isComplete = a.status === "complete";
          const isError = a.status === "error";

          return (
            <div
              key={a.agent}
              className="flex flex-col items-center gap-1"
              title={`${a.agent}: ${a.status}`}
            >
              <span className="relative flex h-3 w-3">
                {isRunning && (
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span
                  className="relative inline-flex h-3 w-3 rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      isComplete || isRunning
                        ? color
                        : isError
                          ? "#ef4444"
                          : "#374151",
                  }}
                />
              </span>
              <span className="text-[9px] capitalize text-gray-500">
                {a.agent}
              </span>
            </div>
          );
        })}
        <span className="ml-auto text-xs text-gray-500 tabular-nums">
          {completedCount}/{total}
        </span>
      </div>
    </div>
  );
}
