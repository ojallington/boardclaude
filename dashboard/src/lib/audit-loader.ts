import { promises as fs } from "fs";
import path from "path";
import type {
  SynthesisReport,
  ProjectState,
  Timeline,
  ActionItemsLedger,
  AuditSummary,
  TimelineDisplay,
  TimelineDisplayEvent,
} from "./types";
import {
  parseSynthesisReport,
  parseProjectState,
  parseTimeline,
  parseActionItemsLedger,
} from "./validate";

// Local dev: .boardclaude/ at repo root (tracked in git, source of truth)
const LOCAL_DIR = path.join(process.cwd(), "..", ".boardclaude");
// Production/Vercel: synced copy in dashboard/data/ (build artifact via sync-data.mjs)
const COMMITTED_DIR = path.join(process.cwd(), "data");

async function resolveDataDir(): Promise<string> {
  try {
    await fs.access(path.join(LOCAL_DIR, "state.json"));
    return LOCAL_DIR;
  } catch {
    return COMMITTED_DIR;
  }
}

export async function getProjectState(): Promise<ProjectState | null> {
  try {
    const dir = await resolveDataDir();
    const raw = await fs.readFile(path.join(dir, "state.json"), "utf-8");
    const result = parseProjectState(raw);
    if (!result.valid) {
      console.warn("[audit-loader] Invalid project state:", result.errors);
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

export async function getTimeline(): Promise<Timeline | null> {
  try {
    const dir = await resolveDataDir();
    const raw = await fs.readFile(path.join(dir, "timeline.json"), "utf-8");
    const result = parseTimeline(raw);
    if (!result.valid) {
      console.warn("[audit-loader] Invalid timeline:", result.errors);
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

/**
 * Returns timeline events in their actual JSON shape (composite, verdict, etc.)
 * rather than the stricter TypeScript AuditTimelineEvent type.
 */
export async function getTimelineForDisplay(): Promise<TimelineDisplay | null> {
  try {
    const dir = await resolveDataDir();
    const raw = await fs.readFile(path.join(dir, "timeline.json"), "utf-8");
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.events)
    ) {
      return null;
    }
    return parsed as TimelineDisplay;
  } catch {
    return null;
  }
}

export async function getActionItems(): Promise<ActionItemsLedger | null> {
  try {
    const dir = await resolveDataDir();
    const raw = await fs.readFile(path.join(dir, "action-items.json"), "utf-8");
    const result = parseActionItemsLedger(raw);
    if (!result.valid) {
      console.warn(
        "[audit-loader] Invalid action items ledger:",
        result.errors,
      );
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

export async function listAudits(): Promise<string[]> {
  try {
    const dir = await resolveDataDir();
    const auditsDir = path.join(dir, "audits");
    const files = await fs.readdir(auditsDir);
    return files
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export async function getAudit(
  auditId: string,
): Promise<SynthesisReport | null> {
  try {
    const dir = await resolveDataDir();
    const filename = auditId.endsWith(".json") ? auditId : `${auditId}.json`;
    const raw = await fs.readFile(path.join(dir, "audits", filename), "utf-8");
    const result = parseSynthesisReport(raw);
    if (!result.valid) {
      console.warn(
        `[audit-loader] Invalid synthesis report "${auditId}":`,
        result.errors,
      );
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

// ─── Enriched Timeline ──────────────────────────────────────────────────────

export interface EnrichedTimelineEvent {
  id: string;
  iteration: number;
  composite: number;
  verdict: string;
  timestamp: string;
  description: string;
  panel: string;
  agents: number;
  agentScores: Array<{ agent: string; composite: number; verdict: string }>;
  itemsCreated: Array<{
    id: string;
    action: string;
    priority: number;
    source_agents: string[];
  }>;
  itemsResolved: Array<{
    id: string;
    action: string;
    resolution: string;
  }>;
}

export interface AgentScorePoint {
  iteration: number;
  timestamp: string;
  [agentName: string]: number | string;
}

export interface EnrichedTimeline {
  events: EnrichedTimelineEvent[];
  agentProgression: AgentScorePoint[];
  agentNames: string[];
}

/** Raw action item shape from action-items.json (superset of typed ActionItem) */
export interface RawActionItem {
  id: string;
  source_audit: string;
  iteration?: number;
  priority: number;
  action: string;
  source_agents?: string[];
  source_agent?: string;
  status: string;
  resolved_at?: string;
  resolution?: string;
}

export async function getRawActionItems(): Promise<RawActionItem[]> {
  try {
    const dir = await resolveDataDir();
    const raw = await fs.readFile(path.join(dir, "action-items.json"), "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "items" in parsed &&
      Array.isArray((parsed as { items: unknown }).items)
    ) {
      return (parsed as { items: RawActionItem[] }).items;
    }
    return [];
  } catch {
    return [];
  }
}

export async function getTimelineEnriched(): Promise<EnrichedTimeline | null> {
  const timeline = await getTimelineForDisplay();
  if (!timeline || timeline.events.length === 0) return null;

  // Filter to audit-type events only (excludes "fix" events that lack composite/iteration)
  const events = timeline.events.filter(
    (e) => e.type === "audit" || e.composite !== undefined,
  );
  if (events.length === 0) return null;

  // Load all audits and raw action items in parallel
  const [audits, items] = await Promise.all([
    Promise.all(events.map((e) => getAudit(e.id))),
    getRawActionItems(),
  ]);

  const agentNamesSet = new Set<string>();

  const enrichedEvents: EnrichedTimelineEvent[] = events.map(
    (event: TimelineDisplayEvent, idx: number) => {
      const audit = audits[idx];

      // Extract per-agent scores from the audit
      const agentScores = (audit?.agents ?? []).map((a) => {
        agentNamesSet.add(a.agent);
        return {
          agent: a.agent,
          composite: a.composite,
          verdict: a.verdict,
        };
      });

      // Items created by this audit (match by iteration)
      const itemsCreated = items
        .filter((item) => item.iteration === event.iteration)
        .map((item) => ({
          id: item.id,
          action: item.action,
          priority: item.priority,
          source_agents:
            item.source_agents ??
            (item.source_agent ? [item.source_agent] : []),
        }));

      // Items resolved before this audit (resolved_at between previous and current timestamp)
      const prevTimestamp = idx > 0 ? events[idx - 1]?.timestamp : null;
      const currentTimestamp = event.timestamp;

      const itemsResolved = items
        .filter((item) => {
          if (!item.resolved_at) return false;
          if (prevTimestamp && item.resolved_at <= prevTimestamp) return false;
          return item.resolved_at <= currentTimestamp;
        })
        .map((item) => ({
          id: item.id,
          action: item.action,
          resolution: item.resolution ?? "",
        }));

      return {
        id: event.id,
        iteration: event.iteration,
        composite: event.composite,
        verdict: event.verdict,
        timestamp: event.timestamp,
        description: event.description,
        panel: event.panel,
        agents: event.agents,
        agentScores,
        itemsCreated,
        itemsResolved,
      };
    },
  );

  const agentNames = Array.from(agentNamesSet).sort();

  // Build agent progression: one point per iteration
  const agentProgression: AgentScorePoint[] = enrichedEvents.map((event) => {
    const point: AgentScorePoint = {
      iteration: event.iteration,
      timestamp: event.timestamp,
    };
    for (const agent of event.agentScores) {
      point[agent.agent] = agent.composite;
    }
    return point;
  });

  return { events: enrichedEvents, agentProgression, agentNames };
}

export async function getAllAuditSummaries(): Promise<AuditSummary[]> {
  const files = await listAudits();
  const summaries = [];

  for (const file of files) {
    const audit = await getAudit(file);
    if (audit) {
      summaries.push({
        audit_id: audit.audit_id,
        timestamp: audit.timestamp,
        panel: audit.panel,
        iteration: audit.iteration,
        composite: {
          score: audit.composite.score,
          grade: audit.composite.grade,
          verdict: audit.composite.verdict,
        },
      });
    }
  }

  return summaries;
}
