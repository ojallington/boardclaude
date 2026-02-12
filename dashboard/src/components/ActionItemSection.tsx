import { getAgentColor } from "@/lib/types";
import { messages } from "@/lib/messages";

interface CreatedItem {
  id: string;
  action: string;
  priority: number;
  source_agents: string[];
}

interface ResolvedItem {
  id: string;
  action: string;
  resolution: string;
}

interface ActionItemSectionProps {
  itemsCreated: CreatedItem[];
  itemsResolved: ResolvedItem[];
}

const PRIORITY_STYLES: Record<string, string> = {
  "1": "bg-red-900/60 text-red-300 border-red-700/50",
  "2": "bg-amber-900/60 text-amber-300 border-amber-700/50",
  "3": "bg-yellow-900/60 text-yellow-300 border-yellow-700/50",
  "4": "bg-gray-800/60 text-gray-300 border-gray-700/50",
  "5": "bg-gray-800/60 text-gray-400 border-gray-700/50",
};

const DEFAULT_PRIORITY_STYLE =
  "bg-gray-800/60 text-gray-400 border-gray-700/50";

function getPriorityStyle(priority: number): string {
  return PRIORITY_STYLES[String(priority)] ?? DEFAULT_PRIORITY_STYLE;
}

export function ActionItemSection({
  itemsCreated,
  itemsResolved,
}: ActionItemSectionProps) {
  if (itemsCreated.length === 0 && itemsResolved.length === 0) return null;

  const createdCount = itemsCreated.length;
  const resolvedCount = itemsResolved.length;

  return (
    <details className="mt-3 group">
      <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-400 transition-colors">
        <span className="ml-1">
          {messages.timeline.actionItems}
          {" \u2014 "}
          {createdCount > 0 && (
            <span className="text-amber-400/80">
              {createdCount} {messages.timeline.itemsCreated}
            </span>
          )}
          {createdCount > 0 && resolvedCount > 0 && ", "}
          {resolvedCount > 0 && (
            <span className="text-emerald-400/80">
              {resolvedCount} {messages.timeline.itemsResolved}
            </span>
          )}
        </span>
      </summary>

      <div className="mt-2 space-y-2 pl-1">
        {/* Created items */}
        {itemsCreated.length > 0 && (
          <div className="space-y-1.5">
            {itemsCreated.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 text-xs text-gray-300"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${getPriorityStyle(item.priority)}`}
                >
                  P{item.priority}
                </span>
                <span className="line-clamp-2">{item.action}</span>
                <div className="ml-auto flex shrink-0 gap-1">
                  {item.source_agents.map((agent) => (
                    <span
                      key={agent}
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize text-white/80"
                      style={{ backgroundColor: getAgentColor(agent) + "80" }}
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resolved items */}
        {itemsResolved.length > 0 && (
          <div className="space-y-1.5 border-t border-gray-800/50 pt-2">
            {itemsResolved.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 text-xs text-gray-300"
              >
                <span className="mt-0.5 shrink-0 text-emerald-400">
                  &#10003;
                </span>
                <div className="min-w-0">
                  <span className="line-clamp-1 text-gray-300">
                    {item.action}
                  </span>
                  {item.resolution && (
                    <span className="line-clamp-1 text-gray-500">
                      {item.resolution}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
