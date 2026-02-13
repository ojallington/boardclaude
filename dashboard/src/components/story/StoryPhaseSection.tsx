import type { StoryPhase } from "@/lib/story-data";

const EVENT_COLORS: Record<string, string> = {
  milestone: "bg-emerald-500",
  regression: "bg-red-500",
  feature: "bg-indigo-500",
  fix: "bg-amber-500",
};

interface StoryPhaseSectionProps {
  phase: StoryPhase;
  index: number;
}

export function StoryPhaseSection({ phase, index }: StoryPhaseSectionProps) {
  return (
    <div className="relative">
      {/* Phase number watermark */}
      <span className="absolute -top-4 -left-2 text-8xl font-black text-gray-800/30 select-none pointer-events-none">
        {index + 1}
      </span>

      <div className="relative rounded-xl border border-gray-800 bg-gray-900/50 p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-baseline gap-3 mb-2">
          <h3 className="text-xl font-bold text-gray-100">{phase.title}</h3>
          <span className="text-sm text-gray-400">
            Iter {phase.iterationRange[0]}&ndash;{phase.iterationRange[1]}
          </span>
          <span className="text-sm font-mono text-indigo-400">
            {phase.scoreRange[0]} &rarr; {phase.scoreRange[1]}
          </span>
        </div>

        <p className="text-gray-300 leading-relaxed mb-6">{phase.summary}</p>

        {/* Events */}
        <div className="space-y-3 mb-6">
          {phase.keyEvents.map((event) => (
            <div key={event.label} className="flex items-start gap-3">
              <span
                className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${EVENT_COLORS[event.type] ?? "bg-gray-500"}`}
                aria-hidden="true"
              />
              <span className="sr-only">{event.type}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-100">
                    {event.label}
                  </span>
                  {event.scoreBadge && (
                    <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-mono text-indigo-300">
                      {event.scoreBadge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-0.5">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Insight */}
        <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 px-4 py-3">
          <p className="text-sm text-gray-300 italic">{phase.insight}</p>
        </div>
      </div>
    </div>
  );
}
