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
        {opinions.map((d) => {
          const isV1 = "agent_a" in d;
          const agentAName = isV1
            ? d.agent_a.agent
            : (d.agents?.[0] ?? "\u2014");
          const agentBName = isV1
            ? d.agent_b.agent
            : (d.agents?.[1] ?? "\u2014");
          const agentAPosition = isV1 ? d.agent_a.position : "";
          const agentBPosition = isV1 ? d.agent_b.position : "";
          const analysisText = isV1 ? d.analysis : (d.summary ?? "");
          const delta = !isV1 ? d.delta : undefined;

          return (
            <div
              key={`${agentAName}-${agentBName}-${d.topic.slice(0, 30)}`}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-200">{d.topic}</p>
                {delta !== undefined && (
                  <span className="rounded-md border border-amber-700/50 bg-amber-900/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                    &Delta; {delta.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                  <p
                    className="text-xs font-medium capitalize mb-1"
                    style={{ color: getAgentColor(agentAName) }}
                  >
                    {agentAName}
                  </p>
                  {agentAPosition && (
                    <p className="text-xs text-gray-300">{agentAPosition}</p>
                  )}
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                  <p
                    className="text-xs font-medium capitalize mb-1"
                    style={{ color: getAgentColor(agentBName) }}
                  >
                    {agentBName}
                  </p>
                  {agentBPosition && (
                    <p className="text-xs text-gray-300">{agentBPosition}</p>
                  )}
                </div>
              </div>
              <p className="text-xs italic text-gray-500">{analysisText}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
