import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWebReview } from "@/lib/try-storage";
import { getAgentColor } from "@/lib/types";
import type { Verdict, TryAgentResult, SynthesisActionItem } from "@/lib/types";
import {
  VERDICT_BADGE_STYLES,
  GRADE_STYLES,
  AGENT_ROLES,
  formatTimestamp,
} from "@/lib/ui-constants";
import { RadarChart } from "@/components/RadarChart";

export const metadata: Metadata = {
  title: "Web Review Detail - BoardClaude",
  description: "Detailed web panel review with per-agent scores and analysis.",
};

const EFFORT_STYLES: Record<string, string> = {
  low: "bg-emerald-900/40 text-emerald-400 border-emerald-800",
  medium: "bg-blue-900/40 text-blue-400 border-blue-800",
  high: "bg-amber-900/40 text-amber-400 border-amber-800",
  max: "bg-red-900/40 text-red-400 border-red-800",
};

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
        {highlights.divergent_opinions.length > 0 && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-4">
              Divergent Opinions
            </h2>
            <div className="space-y-5">
              {highlights.divergent_opinions.map((d, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-medium text-gray-200">{d.topic}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                      <p
                        className="text-xs font-medium capitalize mb-1"
                        style={{ color: getAgentColor(d.agent_a.agent) }}
                      >
                        {d.agent_a.agent}
                      </p>
                      <p className="text-xs text-gray-400">
                        {d.agent_a.position}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                      <p
                        className="text-xs font-medium capitalize mb-1"
                        style={{ color: getAgentColor(d.agent_b.agent) }}
                      >
                        {d.agent_b.agent}
                      </p>
                      <p className="text-xs text-gray-400">
                        {d.agent_b.position}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs italic text-gray-500">{d.analysis}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {action_items.length > 0 && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Prioritized Action Items
            </h2>
            <div className="space-y-3">
              {action_items.map((item: SynthesisActionItem, i: number) => {
                const effortStyle =
                  EFFORT_STYLES[item.effort] ??
                  "bg-gray-800 text-gray-400 border-gray-700";

                return (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 shrink-0 font-mono text-xs text-indigo-400 w-5 text-right">
                      {item.priority}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200">{item.action}</p>
                      {item.impact && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.impact}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {item.source_agents?.length > 0 && (
                          <div className="flex items-center gap-1">
                            {item.source_agents.map((a) => (
                              <span
                                key={a}
                                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold capitalize text-white"
                                style={{ backgroundColor: getAgentColor(a) }}
                                title={a}
                              >
                                {a[0]}
                              </span>
                            ))}
                          </div>
                        )}
                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${effortStyle}`}
                        >
                          {item.effort}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
