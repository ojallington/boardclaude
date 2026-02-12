/** Lightweight per-audit metrics collection for the web pipeline. */

export interface ToolCallMetric {
  agent: string;
  tool: string;
  count: number;
}

export interface DebateRevisionMetric {
  agent: string;
  criterion: string;
  old_score: number;
  new_score: number;
}

export interface DebateMetric {
  pairs_examined: number;
  revisions_applied: number;
  revisions: DebateRevisionMetric[];
}

export interface AuditMetrics {
  started_at: string;
  completed_at: string;
  duration_ms: number;
  agent_count: number;
  agents_completed: number;
  agents_failed: number;
  tool_calls: ToolCallMetric[];
  debate: DebateMetric | null;
  tier: "free" | "byok";
}

export class MetricsCollector {
  private readonly startTime: number;
  private readonly startIso: string;
  private readonly toolCalls: Map<string, Map<string, number>>;
  private agentsCompleted: number;
  private agentsFailed: number;
  private debate: DebateMetric | null;
  private readonly tierValue: "free" | "byok";

  constructor(tier: "free" | "byok") {
    this.startTime = Date.now();
    this.startIso = new Date(this.startTime).toISOString();
    this.toolCalls = new Map();
    this.agentsCompleted = 0;
    this.agentsFailed = 0;
    this.debate = null;
    this.tierValue = tier;
  }

  recordToolCall(agent: string, tool: string): void {
    let agentMap = this.toolCalls.get(agent);
    if (!agentMap) {
      agentMap = new Map();
      this.toolCalls.set(agent, agentMap);
    }
    agentMap.set(tool, (agentMap.get(tool) ?? 0) + 1);
  }

  recordAgentComplete(): void {
    this.agentsCompleted++;
  }

  recordAgentFailed(): void {
    this.agentsFailed++;
  }

  recordDebate(debate: DebateMetric): void {
    this.debate = debate;
  }

  finalize(agentCount: number): AuditMetrics {
    const now = Date.now();
    const toolCallMetrics: ToolCallMetric[] = [];

    for (const [agent, toolMap] of this.toolCalls) {
      for (const [tool, count] of toolMap) {
        toolCallMetrics.push({ agent, tool, count });
      }
    }

    return {
      started_at: this.startIso,
      completed_at: new Date(now).toISOString(),
      duration_ms: now - this.startTime,
      agent_count: agentCount,
      agents_completed: this.agentsCompleted,
      agents_failed: this.agentsFailed,
      tool_calls: toolCallMetrics,
      debate: this.debate,
      tier: this.tierValue,
    };
  }
}
