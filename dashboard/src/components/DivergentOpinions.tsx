import { getAgentColor } from "@/lib/types";
import type { DivergentOpinion } from "@/lib/types";

interface DivergentOpinionsProps {
  opinions: DivergentOpinion[];
  className?: string;
}

export function DivergentOpinions({
  opinions,
  className = "",
}: DivergentOpinionsProps) {
  if (opinions.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-gray-800 bg-gray-900/60 p-4 ${className}`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
        Divergent Opinions
      </h3>
      <div className="space-y-4">
        {opinions.map((d) => (
          <div
            key={`${d.agent_a.agent}-${d.agent_b.agent}-${d.topic.slice(0, 30)}`}
            className="space-y-2"
          >
            <p className="text-sm font-medium text-gray-200">{d.topic}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                <p
                  className="text-xs font-medium capitalize mb-1"
                  style={{ color: getAgentColor(d.agent_a.agent) }}
                >
                  {d.agent_a.agent}
                </p>
                <p className="text-xs text-gray-300">{d.agent_a.position}</p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                <p
                  className="text-xs font-medium capitalize mb-1"
                  style={{ color: getAgentColor(d.agent_b.agent) }}
                >
                  {d.agent_b.agent}
                </p>
                <p className="text-xs text-gray-300">{d.agent_b.position}</p>
              </div>
            </div>
            <p className="text-xs italic text-gray-500">{d.analysis}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
