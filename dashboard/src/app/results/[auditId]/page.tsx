import Link from "next/link";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAudit, getProjectState } from "@/lib/audit-loader";
import { AgentCard } from "@/components/AgentCard";
import {
  VERDICT_BADGE_STYLES,
  AGENT_ROLES,
  formatTimestamp,
} from "@/lib/ui-constants";

const RadarChart = dynamic(
  () =>
    import("@/components/RadarChart").then((mod) => ({
      default: mod.RadarChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-[350px] animate-pulse rounded-full bg-gray-800/40" />
    ),
  },
);

const ScoreProgression = dynamic(
  () =>
    import("@/components/ScoreProgression").then((mod) => ({
      default: mod.ScoreProgression,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-lg bg-gray-800/40" />
    ),
  },
);

// ─── Metadata ───────────────────────────────────────────────────────────────

interface AuditDetailPageProps {
  params: Promise<{ auditId: string }>;
}

export async function generateMetadata({
  params,
}: AuditDetailPageProps): Promise<Metadata> {
  const { auditId } = await params;
  return {
    title: `Audit ${auditId} - BoardClaude`,
    description: `Detailed audit report for ${auditId}`,
  };
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default async function AuditDetailPage({
  params,
}: AuditDetailPageProps) {
  const { auditId } = await params;
  const audit = await getAudit(auditId);

  if (!audit) {
    notFound();
  }

  const state = await getProjectState();
  const scoreHistory = (state?.score_history ?? []).map((entry) =>
    typeof entry === "object"
      ? {
          iteration: entry.iteration,
          score: entry.score,
          grade: entry.grade,
          timestamp: entry.timestamp,
        }
      : { iteration: 0, score: entry as number, grade: "?", timestamp: "" },
  );

  const { composite, agents, highlights, action_items, iteration_delta } =
    audit;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Navigation */}
      <nav className="mb-8">
        <Link
          href="/results"
          className="text-sm text-gray-500 transition-colors hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:rounded"
        >
          &larr; Back to Results
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-100">
            Audit #{audit.iteration}
          </h1>
          <p className="font-mono text-sm text-gray-500">{audit.audit_id}</p>
          <p className="text-sm text-gray-400">
            {audit.panel} &middot; {formatTimestamp(audit.timestamp)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-5xl font-bold tabular-nums text-gray-100">
            {composite.score}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-indigo-400">
              {composite.grade}
            </span>
            <span
              className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${VERDICT_BADGE_STYLES[composite.verdict]}`}
            >
              {composite.verdict}
            </span>
          </div>
          {iteration_delta.delta !== null && (
            <span
              className={`text-sm font-medium ${iteration_delta.delta >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {iteration_delta.delta >= 0 ? "+" : ""}
              {iteration_delta.delta} from iteration {audit.iteration - 1}
            </span>
          )}
        </div>
      </div>

      {/* Radar Chart + Score Progression */}
      <div className="mb-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-100">
            Score Radar
          </h2>
          <div className="flex justify-center">
            <RadarChart data={composite.radar} size={350} />
          </div>
        </section>

        {scoreHistory.length > 1 && (
          <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-100">
              Score Progression
            </h2>
            <ScoreProgression history={scoreHistory} />
          </section>
        )}
      </div>

      {/* Highlights */}
      <section className="mb-10 rounded-xl border border-gray-800 bg-gray-900/60 p-6">
        <h2 className="mb-6 text-lg font-semibold text-gray-100">Highlights</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">
              Top Strengths
            </h3>
            <ul className="space-y-2">
              {highlights.top_strengths.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <span className="mt-0.5 shrink-0 text-emerald-400">
                    &#10003;
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-400">
              Top Weaknesses
            </h3>
            <ul className="space-y-2">
              {highlights.top_weaknesses.map((w) => (
                <li
                  key={w}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <span className="mt-0.5 shrink-0 text-amber-400">
                    &#9888;
                  </span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Divergent Opinions */}
      {highlights.divergent_opinions.length > 0 && (
        <section className="mb-10 rounded-xl border border-gray-800 bg-gray-900/60 p-6">
          <h2 className="mb-6 text-lg font-semibold text-gray-100">
            Divergent Opinions
          </h2>
          <div className="space-y-6">
            {highlights.divergent_opinions.map((d) => (
              <div
                key={d.topic}
                className="rounded-lg border border-gray-700 bg-gray-800/50 p-4"
              >
                <h3 className="mb-3 font-medium text-gray-200">{d.topic}</h3>
                <div className="mb-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md bg-gray-900/60 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {d.agent_a.agent}
                    </p>
                    <p className="text-sm text-gray-300">
                      {d.agent_a.position}
                    </p>
                  </div>
                  <div className="rounded-md bg-gray-900/60 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {d.agent_b.agent}
                    </p>
                    <p className="text-sm text-gray-300">
                      {d.agent_b.position}
                    </p>
                  </div>
                </div>
                <p className="text-sm italic text-gray-400">{d.analysis}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Agent Evaluations */}
      <section className="mb-10">
        <h2 className="mb-6 text-lg font-semibold text-gray-100">
          Agent Evaluations
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {agents.map((agent) => (
            <AgentCard
              key={agent.agent}
              agent={agent.agent}
              role={AGENT_ROLES[agent.agent] ?? "Agent"}
              scores={agent.scores}
              composite={agent.composite}
              strengths={[...agent.strengths]}
              weaknesses={[...agent.weaknesses]}
              critical_issues={agent.critical_issues}
              verdict={agent.verdict}
            />
          ))}
        </div>
      </section>

      {/* Action Items */}
      {action_items.length > 0 && (
        <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
          <h2 className="mb-6 text-lg font-semibold text-gray-100">
            Action Items
          </h2>
          <div className="space-y-3">
            {action_items.map((item) => (
              <div
                key={`${item.priority}-${item.action.slice(0, 30)}`}
                className="flex items-start gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-900/50 text-xs font-bold text-indigo-400">
                  {item.priority}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-200">{item.action}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      from {item.source_agents?.join(", ") ?? "unknown"}
                    </span>
                    <span className="text-xs text-gray-500">
                      effort: {item.effort}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{item.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
