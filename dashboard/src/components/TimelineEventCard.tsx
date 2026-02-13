import Link from "next/link";

import { getGrade } from "@/lib/types";
import { messages } from "@/lib/messages";
import { VERDICT_STYLES, VERDICT_DOT } from "@/lib/ui-constants";
import type { EnrichedTimelineEvent } from "@/lib/audit-loader";
import { AgentScoreMiniBar } from "@/components/AgentScoreMiniBar";
import { ActionItemSection } from "@/components/ActionItemSection";

interface TimelineEventCardProps {
  event: EnrichedTimelineEvent;
  prevEvent: EnrichedTimelineEvent | null;
}

export function TimelineEventCard({
  event,
  prevEvent,
}: TimelineEventCardProps) {
  const delta = prevEvent
    ? (event.composite - prevEvent.composite).toFixed(1)
    : null;
  const grade = getGrade(event.composite);
  const verdictStyle = VERDICT_STYLES[event.verdict] ?? VERDICT_STYLES.MARGINAL;
  const dotColor = VERDICT_DOT[event.verdict] ?? VERDICT_DOT.MARGINAL;

  return (
    <li className="relative pl-14 sm:pl-20">
      {/* Dot on timeline */}
      <div
        className={`absolute left-4 top-4 h-5 w-5 rounded-full border-2 border-gray-950 sm:left-6 ${dotColor}`}
      />

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 transition-colors hover:border-gray-700">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-500">
            #{event.iteration}
          </span>
          <span className="text-2xl font-bold">{event.composite}</span>
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

        {/* Agent score mini bar */}
        {event.agentScores.length > 0 && (
          <div className="mt-3">
            <AgentScoreMiniBar scores={event.agentScores} />
          </div>
        )}

        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          {event.description}
        </p>

        {/* Action items */}
        <ActionItemSection
          itemsCreated={event.itemsCreated}
          itemsResolved={event.itemsResolved}
        />

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <time dateTime={event.timestamp}>
            {new Intl.DateTimeFormat(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(event.timestamp))}
          </time>
          <span>
            {event.agents} {messages.timeline.viewAudit ? "" : ""}
            agents
          </span>
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
}
