import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MetricsCollector } from "@/lib/try-metrics";
import type { AuditMetrics, DebateMetric } from "@/lib/try-metrics";

describe("MetricsCollector", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-12T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with correct tier", () => {
    const collector = new MetricsCollector("free");
    const metrics = collector.finalize(6);

    expect(metrics.tier).toBe("free");
    expect(metrics.agents_completed).toBe(0);
    expect(metrics.agents_failed).toBe(0);
    expect(metrics.tool_calls).toEqual([]);
    expect(metrics.debate).toBeNull();
  });

  it("records tool calls and aggregates per agent/tool", () => {
    const collector = new MetricsCollector("byok");

    collector.recordToolCall("boris", "search_codebase");
    collector.recordToolCall("boris", "search_codebase");
    collector.recordToolCall("boris", "read_file");
    collector.recordToolCall("thariq", "search_codebase");

    const metrics = collector.finalize(6);

    expect(metrics.tool_calls).toHaveLength(3);
    expect(metrics.tool_calls).toContainEqual({
      agent: "boris",
      tool: "search_codebase",
      count: 2,
    });
    expect(metrics.tool_calls).toContainEqual({
      agent: "boris",
      tool: "read_file",
      count: 1,
    });
    expect(metrics.tool_calls).toContainEqual({
      agent: "thariq",
      tool: "search_codebase",
      count: 1,
    });
  });

  it("increments agents completed counter", () => {
    const collector = new MetricsCollector("free");

    collector.recordAgentComplete();
    collector.recordAgentComplete();
    collector.recordAgentComplete();

    const metrics = collector.finalize(6);
    expect(metrics.agents_completed).toBe(3);
  });

  it("increments agents failed counter", () => {
    const collector = new MetricsCollector("free");

    collector.recordAgentFailed();
    collector.recordAgentFailed();

    const metrics = collector.finalize(6);
    expect(metrics.agents_failed).toBe(2);
  });

  it("records debate metrics", () => {
    const collector = new MetricsCollector("byok");

    const debate: DebateMetric = {
      pairs_examined: 2,
      revisions_applied: 3,
      revisions: [
        {
          agent: "boris",
          criterion: "architecture",
          old_score: 80,
          new_score: 83,
        },
        {
          agent: "cat",
          criterion: "product",
          old_score: 75,
          new_score: 72,
        },
        {
          agent: "thariq",
          criterion: "innovation",
          old_score: 85,
          new_score: 82,
        },
      ],
    };

    collector.recordDebate(debate);
    const metrics = collector.finalize(6);

    expect(metrics.debate).toEqual(debate);
  });

  it("finalize returns correct shape with duration > 0", () => {
    const collector = new MetricsCollector("free");

    // Advance time by 5 seconds
    vi.advanceTimersByTime(5000);

    const metrics = collector.finalize(6);

    expect(metrics.started_at).toBe("2026-02-12T12:00:00.000Z");
    expect(metrics.completed_at).toBe("2026-02-12T12:00:05.000Z");
    expect(metrics.duration_ms).toBe(5000);
    expect(metrics.agent_count).toBe(6);
  });

  it("uses agent_count from finalize parameter", () => {
    const collector = new MetricsCollector("free");

    collector.recordAgentComplete();
    collector.recordAgentComplete();
    collector.recordAgentComplete();
    collector.recordAgentFailed();

    const metrics = collector.finalize(4);
    expect(metrics.agent_count).toBe(4);
    expect(metrics.agents_completed).toBe(3);
    expect(metrics.agents_failed).toBe(1);
  });

  it("handles multiple tool calls for same agent and tool", () => {
    const collector = new MetricsCollector("byok");

    for (let i = 0; i < 10; i++) {
      collector.recordToolCall("boris", "search_codebase");
    }

    const metrics = collector.finalize(6);

    expect(metrics.tool_calls).toHaveLength(1);
    expect(metrics.tool_calls[0]).toEqual({
      agent: "boris",
      tool: "search_codebase",
      count: 10,
    });
  });

  it("satisfies AuditMetrics interface shape", () => {
    const collector = new MetricsCollector("byok");

    collector.recordToolCall("boris", "read_file");
    collector.recordAgentComplete();
    collector.recordDebate({
      pairs_examined: 1,
      revisions_applied: 0,
      revisions: [],
    });

    vi.advanceTimersByTime(1000);

    const metrics: AuditMetrics = collector.finalize(6);

    expect(typeof metrics.started_at).toBe("string");
    expect(typeof metrics.completed_at).toBe("string");
    expect(typeof metrics.duration_ms).toBe("number");
    expect(typeof metrics.agent_count).toBe("number");
    expect(typeof metrics.agents_completed).toBe("number");
    expect(typeof metrics.agents_failed).toBe("number");
    expect(Array.isArray(metrics.tool_calls)).toBe(true);
    expect(metrics.debate).not.toBeNull();
    expect(metrics.tier).toBe("byok");
  });
});
