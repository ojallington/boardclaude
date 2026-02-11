import Link from "next/link";
import { getTimelineEnriched } from "@/lib/audit-loader";
import { getGrade } from "@/lib/types";
import { messages } from "@/lib/messages";
import { AgentScoreMiniBar } from "@/components/AgentScoreMiniBar";
import { ActionItemSection } from "@/components/ActionItemSection";
import { AgentScoreProgressionLoader } from "@/components/AgentScoreProgressionLoader";

const VERDICT_STYLES: Record<string, string> = {
  STRONG_PASS: "bg-emerald-900/40 text-emerald-400 border-emerald-700/50",
  PASS: "bg-blue-900/40 text-blue-400 border-blue-700/50",
  MARGINAL: "bg-amber-900/40 text-amber-400 border-amber-700/50",
  FAIL: "bg-red-900/40 text-red-400 border-red-700/50",
};

const VERDICT_DOT: Record<string, string> = {
  STRONG_PASS: "bg-emerald-400",
  PASS: "bg-blue-400",
  MARGINAL: "bg-amber-400",
  FAIL: "bg-red-400",
};

export async function TimelineInline() {
  const enriched = await getTimelineEnriched();
  const events = enriched?.events ?? [];

  if (events.length === 0) {
    return <p className="mt-6 text-gray-400">{messages.timeline.noEvents}</p>;
  }

  return (
    <div>
      {/* Score summary banner */}
      {(() => {
        const first = events[0];
        const last = events[events.length - 1];
        if (!first || !last) return null;
        return (
          <div className="mb-10 flex items-center gap-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Start
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-400">
                {first.composite}
              </p>
            </div>
            <div className="flex-1 border-t border-dashed border-gray-700" />
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Current
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                {last.composite}
              </p>
            </div>
            <div className="rounded-lg bg-indigo-900/40 px-3 py-1.5 text-sm font-medium text-indigo-300">
              +{(last.composite - first.composite).toFixed(1)}
            </div>
          </div>
        );
      })()}

      {/* Agent Score Progression chart */}
      {enriched && enriched.agentProgression.length > 1 && (
        <div className="mb-10 rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-lg font-semibold">
            {messages.timeline.agentProgression}
          </h2>
          <p className="mb-4 text-sm text-gray-400">
            {messages.timeline.agentProgressionDesc}
          </p>
          <AgentScoreProgressionLoader
            data={enriched.agentProgression}
            agentNames={enriched.agentNames}
          />
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-800 sm:left-8" />
        <ol className="space-y-6">
          {events.map((event, idx) => {
            const prev = idx > 0 ? events[idx - 1] : null;
            const delta = prev
              ? (event.composite - prev.composite).toFixed(1)
              : null;
            const grade = getGrade(event.composite);
            const verdictStyle =
              VERDICT_STYLES[event.verdict] ?? VERDICT_STYLES.MARGINAL;
            const dotColor = VERDICT_DOT[event.verdict] ?? VERDICT_DOT.MARGINAL;

            return (
              <li key={event.id} className="relative pl-14 sm:pl-20">
                <div
                  className={`absolute left-4 top-4 h-5 w-5 rounded-full border-2 border-gray-950 sm:left-6 ${dotColor}`}
                />
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 transition-colors hover:border-gray-700">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">
                      #{event.iteration}
                    </span>
                    <span className="text-2xl font-bold">
                      {event.composite}
                    </span>
                    <span className="rounded-md bg-gray-800 px-2 py-0.5 text-sm font-medium text-gray-300">
                      {grade}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-medium ${verdictStyle}`}
                    >
                      {event.verdict.replace("_", " ")}
                    </span>
                    {delta !== null && (
                      <span
                        className={`text-sm font-medium ${
                          Number(delta) > 0
                            ? "text-emerald-400"
                            : Number(delta) < 0
                              ? "text-red-400"
                              : "text-gray-500"
                        }`}
                      >
                        {Number(delta) > 0 ? "+" : ""}
                        {delta}
                      </span>
                    )}
                  </div>

                  {event.agentScores.length > 0 && (
                    <div className="mt-3">
                      <AgentScoreMiniBar scores={event.agentScores} />
                    </div>
                  )}

                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    {event.description}
                  </p>

                  <ActionItemSection
                    itemsCreated={event.itemsCreated}
                    itemsResolved={event.itemsResolved}
                  />

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <time dateTime={event.timestamp}>
                      {new Date(event.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    <span>{event.agents} agents</span>
                    <span>{event.panel}</span>
                    <Link
                      href={`/results/${event.id}`}
                      className="text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      {messages.timeline.viewAudit} &rarr;
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
