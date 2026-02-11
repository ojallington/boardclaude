"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { messages } from "@/lib/messages";
import { usePanelStream } from "@/hooks/usePanelStream";
import { TryForm } from "./TryForm";
import { PanelAgentCard } from "./PanelAgentCard";
import { PanelProgressHeader } from "./PanelProgressHeader";
import { PanelSynthesisView } from "./PanelSynthesisView";
import type { TryPanelStreamPhase } from "@/lib/types";

function isActivePhase(phase: TryPanelStreamPhase): boolean {
  return (
    phase === "validating" ||
    phase === "fetching" ||
    phase === "reviewing" ||
    phase === "debating" ||
    phase === "synthesizing"
  );
}

export function TryPageClient() {
  const searchParams = useSearchParams();
  const {
    phase,
    result,
    error,
    repoInfo,
    tier,
    agents,
    completedCount,
    startReview,
    reset,
  } = usePanelStream();

  // Auto-start if URL is in query params (from homepage redirect)
  useEffect(() => {
    const url = searchParams.get("url");
    if (url) {
      startReview(url, null);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = isActivePhase(phase);

  function handleSubmit(url: string, apiKey: string | null) {
    startReview(url, apiKey);
  }

  function handleTryAnother() {
    reset();
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <TryForm onSubmit={handleSubmit} isLoading={isLoading} />

      {/* Error */}
      {phase === "error" && error && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Fetching status */}
      {(phase === "validating" || phase === "fetching") && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-gray-400" />
            </span>
            <span className="text-sm text-gray-400">
              {messages.tryIt.phases[phase]}
            </span>
          </div>
          {repoInfo && (
            <p className="mt-2 text-xs text-gray-500">
              {repoInfo.owner}/{repoInfo.name}
            </p>
          )}
        </div>
      )}

      {/* Review in progress: progress header + agent cards grid */}
      {(phase === "reviewing" ||
        phase === "debating" ||
        phase === "synthesizing") && (
        <>
          <PanelProgressHeader
            agents={agents}
            completedCount={completedCount}
            total={6}
            tier={tier}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <PanelAgentCard key={a.agent} progress={a} />
            ))}
          </div>
          {phase === "debating" && (
            <div className="rounded-xl border border-cyan-600/30 bg-gray-900/60 p-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
                </span>
                <span className="text-sm text-cyan-300">
                  Agents debating divergent opinions...
                </span>
              </div>
            </div>
          )}
          {phase === "synthesizing" && (
            <div className="rounded-xl border border-indigo-600/30 bg-gray-900/60 p-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-400" />
                </span>
                <span className="text-sm text-indigo-300">
                  {messages.tryIt.phases.synthesizing}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Complete: synthesis view + agent cards */}
      {phase === "complete" && result && (
        <>
          <PanelSynthesisView result={result} />

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Individual Agent Evaluations
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((a) => (
                <PanelAgentCard key={a.agent} progress={a} />
              ))}
            </div>
          </div>

          {/* Result CTAs */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleTryAnother}
              className="rounded-lg border border-gray-700 bg-gray-800 px-6 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {messages.tryIt.resultCtas.tryAnother}
            </button>
            <a
              href="#install"
              className="rounded-lg border border-indigo-600/50 bg-indigo-950/30 px-6 py-2.5 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {messages.tryIt.resultCtas.installCli}
            </a>
            <Link
              href="/boards"
              className="rounded-lg border border-gray-700 bg-gray-800 px-6 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {messages.tryIt.resultCtas.buildBoard}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
