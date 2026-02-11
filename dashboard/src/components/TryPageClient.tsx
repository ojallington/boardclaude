"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { messages } from "@/lib/messages";
import { useReviewStream } from "@/hooks/useReviewStream";
import { TryForm } from "./TryForm";
import { StreamingAgentCard } from "./StreamingAgentCard";
import { RadarChart } from "./RadarChart";
import type { RadarData, TryStreamPhase } from "@/lib/types";

function isActivePhase(phase: TryStreamPhase): boolean {
  return (
    phase === "validating" || phase === "fetching" || phase === "reviewing"
  );
}

export function TryPageClient() {
  const searchParams = useSearchParams();
  const { phase, result, error, repoInfo, modelInfo, startReview, reset } =
    useReviewStream();

  // Auto-start if URL is in query params (from homepage redirect)
  useEffect(() => {
    const url = searchParams.get("url");
    if (url) {
      startReview(url, null, "haiku");
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = isActivePhase(phase);
  const showCard = phase !== "validating" || result !== null;
  const showRadar = phase === "complete" && result?.radar;

  function handleSubmit(url: string, apiKey: string | null, model: string) {
    startReview(url, apiKey, model);
  }

  function handleTryAnother() {
    reset();
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <TryForm onSubmit={handleSubmit} isLoading={isLoading} />

      {/* Error */}
      {phase === "error" && error && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Streaming card */}
      {showCard && phase !== "error" && (
        <StreamingAgentCard
          phase={phase}
          result={result}
          repoInfo={repoInfo}
          modelInfo={modelInfo}
        />
      )}

      {/* Radar chart */}
      {showRadar && result?.radar && (
        <div className="flex justify-center">
          <RadarChart data={result.radar as RadarData} size={350} />
        </div>
      )}

      {/* Result CTAs */}
      {phase === "complete" && (
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleTryAnother}
            className="rounded-lg border border-gray-700 bg-gray-800 px-6 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
          >
            {messages.tryIt.resultCtas.tryAnother}
          </button>
          <a
            href="#install"
            className="rounded-lg border border-indigo-600/50 bg-indigo-950/30 px-6 py-2.5 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-950/50"
          >
            {messages.tryIt.resultCtas.installCli}
          </a>
          <Link
            href="/boards"
            className="rounded-lg border border-gray-700 bg-gray-800 px-6 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
          >
            {messages.tryIt.resultCtas.buildBoard}
          </Link>
        </div>
      )}
    </div>
  );
}
