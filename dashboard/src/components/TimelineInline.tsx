import { getTimelineEnriched } from "@/lib/audit-loader";
import { messages } from "@/lib/messages";
import { AgentScoreProgressionLoader } from "@/components/AgentScoreProgressionLoader";
import { TimelineEventCard } from "@/components/TimelineEventCard";

export async function TimelineInline() {
  const enriched = await getTimelineEnriched();
  const events = enriched?.events ?? [];

  if (events.length === 0) {
    return <p className="mt-6 text-gray-300">{messages.timeline.noEvents}</p>;
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
          <p className="mb-4 text-sm text-gray-300">
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
            return (
              <TimelineEventCard
                key={event.id}
                event={event}
                prevEvent={prev ?? null}
              />
            );
          })}
        </ol>
      </div>
    </div>
  );
}
