import { getAgentColor } from "@/lib/types";

interface AgentScore {
  agent: string;
  composite: number;
}

interface AgentScoreMiniBarProps {
  scores: AgentScore[];
}

export function AgentScoreMiniBar({ scores }: AgentScoreMiniBarProps) {
  if (scores.length === 0) return null;

  const total = scores.reduce((sum, s) => sum + s.composite, 0);

  return (
    <div className="flex h-6 w-full overflow-hidden rounded-md">
      {scores.map((s) => {
        const widthPct = total > 0 ? (s.composite / total) * 100 : 0;
        return (
          <div
            key={s.agent}
            className="relative flex items-center justify-center text-[10px] font-semibold text-white/80 transition-all"
            style={{
              width: `${widthPct}%`,
              backgroundColor: getAgentColor(s.agent),
            }}
            title={`${s.agent}: ${s.composite}`}
          >
            {widthPct > 12 && (
              <span className="truncate px-0.5 capitalize">{s.composite}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
