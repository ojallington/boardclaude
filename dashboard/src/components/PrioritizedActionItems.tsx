import { getAgentColor } from "@/lib/types";
import type { SynthesisActionItem } from "@/lib/types";
import { EFFORT_STYLES } from "@/lib/ui-constants";

interface PrioritizedActionItemsProps {
  items: SynthesisActionItem[];
  className?: string;
}

export function PrioritizedActionItems({
  items,
  className = "",
}: PrioritizedActionItemsProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-gray-800 bg-gray-900/60 p-4 ${className}`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">
        Prioritized Action Items
      </h3>
      <div className="space-y-3">
        {items.map((item: SynthesisActionItem) => {
          const effortStyle =
            EFFORT_STYLES[item.effort] ??
            "bg-gray-800 text-gray-300 border-gray-700";

          return (
            <div key={item.priority} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 shrink-0 font-mono text-xs text-indigo-400 w-5 text-right">
                {item.priority}.
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-200">{item.action}</p>
                {item.impact && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.impact}</p>
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
  );
}
