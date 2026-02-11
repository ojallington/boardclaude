import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWebReview } from "@/lib/try-storage";
import { getAgentColor } from "@/lib/types";
import type { Verdict, TryAgentResult } from "@/lib/types";
import {
  VERDICT_BADGE_STYLES,
  GRADE_STYLES,
  AGENT_ROLES,
  formatTimestamp,
} from "@/lib/ui-constants";
import { RadarChart } from "@/components/RadarChart";
import { DivergentOpinions } from "@/components/DivergentOpinions";
import { PrioritizedActionItems } from "@/components/PrioritizedActionItems";
import { FilesAnalyzedSection } from "@/components/FilesAnalyzedSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ auditId: string }>;
}): Promise<Metadata> {
  const { auditId } = await params;
  const result = await getWebReview(auditId);

  if (!result) {
    return {
      title: "Web Review Detail - BoardClaude",
      description:
        "Detailed web panel review with per-agent scores and analysis.",
    };
  }

  const { composite, repo, agents } = result;
  const title = `${repo.owner}/${repo.name} scored ${composite.score}/100 - BoardClaude`;
  const description = `Grade ${composite.grade} (${composite.verdict}) — reviewed by ${agents.length} AI judges on BoardClaude.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "BoardClaude",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function WebReviewDetailPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const result = await getWebReview(auditId);

  if (!result) notFound();

  const { composite, highlights, action_items, agents, repo } = result;
  const verdictStyle =
    VERDICT_BADGE_STYLES[composite.verdict as Verdict] ??
    "bg-gray-800 text-gray-400 border-gray-700";
  const gradeColor = GRADE_STYLES[composite.grade] ?? "text-gray-400";

  return (
    <main
      id="main-content"
      className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <nav className="mb-6">
        <Link
          href="/results"
          className="text-sm text-gray-400 transition-colors hover:text-gray-300"
        >
          &larr; Back to Results
        </Link>
      </nav>

      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-xl border border-indigo-600/30 bg-gray-900 p-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
            Panel Consensus
          </p>
          <h1 className="text-xl font-semibold text-gray-100 mb-4">
            {repo.owner}/{repo.name}
          </h1>
          <div className="flex items-center justify-center gap-4">
            <span className="text-5xl font-bold tabular-nums text-gray-100">
              {composite.score}
            </span>
            <div className="flex flex-col items-start gap-1">
              <span className={`text-2xl font-bold ${gradeColor}`}>
                {composite.grade}
              </span>
              <span
                className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${verdictStyle}`}
              >
                {composite.verdict}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-500">
            <span>{result.files_analyzed} files analyzed</span>
            <span>&middot;</span>
            <span>{formatTimestamp(result.timestamp)}</span>
            <span>&middot;</span>
            <span
              className={`rounded-full border px-2 py-0.5 ${
                result.tier === "byok"
                  ? "border-indigo-700 bg-indigo-900/30 text-indigo-400"
                  : "border-gray-700 bg-gray-800 text-gray-400"
              }`}
            >
              {result.tier === "byok" ? "Full Panel" : "Demo Mode"}
            </span>
          </div>
        </div>

        {/* Radar */}
        <div className="flex justify-center">
          <RadarChart data={composite.radar} size={350} />
        </div>

        {/* Files Analyzed */}
        <FilesAnalyzedSection
          filesAnalyzed={result.files_analyzed}
          filesDetail={result.files_detail}
        />

        {/* Highlights */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
              Top Strengths
            </h2>
            <ul className="space-y-2">
              {highlights.top_strengths.filter(Boolean).map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <span className="mt-0.5 shrink-0 text-emerald-500">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
              Top Weaknesses
            </h2>
            <ul className="space-y-2">
              {highlights.top_weaknesses.filter(Boolean).map((w, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <span className="mt-0.5 shrink-0 text-amber-500">-</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divergent Opinions */}
        <DivergentOpinions
          opinions={highlights.divergent_opinions}
          className="p-5"
        />

        {/* Action Items */}
        <PrioritizedActionItems items={action_items} className="p-5" />

        {/* Per-Agent Evaluations */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
            Individual Agent Evaluations
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {agents.map((agent: TryAgentResult) => {
              const agentColor = getAgentColor(agent.agent);
              const agentVerdictStyle =
                VERDICT_BADGE_STYLES[agent.verdict as Verdict] ??
                "bg-gray-800 text-gray-400 border-gray-700";
              const role = AGENT_ROLES[agent.agent] ?? agent.role;

              return (
                <div
                  key={agent.agent}
                  className="rounded-xl border bg-gray-900/60 p-5"
                  style={{
                    borderColor: `${agentColor}30`,
                    borderLeftWidth: 3,
                    borderLeftColor: agentColor,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p
                        className="text-sm font-medium capitalize"
                        style={{ color: agentColor }}
                      >
                        {agent.agent}
                      </p>
                      <p className="text-xs text-gray-500">{role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold tabular-nums text-gray-100">
                        {agent.composite}
                      </span>
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${agentVerdictStyle}`}
                      >
                        {agent.verdict}
                      </span>
                    </div>
                  </div>

                  {agent.one_line && (
                    <p className="text-xs italic text-gray-400 mb-3">
                      {agent.one_line}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Strengths
                      </h4>
                      <ul className="space-y-0.5">
                        {agent.strengths.filter(Boolean).map((s, i) => (
                          <li
                            key={i}
                            className="text-xs text-gray-300 flex items-start gap-1"
                          >
                            <span className="text-emerald-500 shrink-0">+</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Weaknesses
                      </h4>
                      <ul className="space-y-0.5">
                        {agent.weaknesses.filter(Boolean).map((w, i) => (
                          <li
                            key={i}
                            className="text-xs text-gray-300 flex items-start gap-1"
                          >
                            <span className="text-amber-500 shrink-0">-</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <p className="mt-2 text-[10px] text-gray-600">
                    Model: {agent.model_used}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
