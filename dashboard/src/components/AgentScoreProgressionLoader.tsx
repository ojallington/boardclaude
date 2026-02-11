"use client";

import dynamic from "next/dynamic";
import type { AgentScorePoint } from "@/lib/audit-loader";

const AgentScoreProgression = dynamic(
  () =>
    import("@/components/AgentScoreProgression").then(
      (m) => m.AgentScoreProgression,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] animate-pulse rounded-xl bg-gray-900/50" />
    ),
  },
);

interface AgentScoreProgressionLoaderProps {
  data: AgentScorePoint[];
  agentNames: string[];
}

export function AgentScoreProgressionLoader({
  data,
  agentNames,
}: AgentScoreProgressionLoaderProps) {
  return <AgentScoreProgression data={data} agentNames={agentNames} />;
}
