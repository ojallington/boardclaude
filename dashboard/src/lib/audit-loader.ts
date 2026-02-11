import { promises as fs } from "fs";
import path from "path";
import type {
  SynthesisReport,
  ProjectState,
  Timeline,
  ActionItemsLedger,
  AuditSummary,
  TimelineDisplay,
} from "./types";
import {
  parseSynthesisReport,
  parseProjectState,
  parseTimeline,
  parseActionItemsLedger,
} from "./validate";

// Local dev: .boardclaude/ at repo root (gitignored, live data)
const LOCAL_DIR = path.join(process.cwd(), "..", ".boardclaude");
// Production/Vercel: committed snapshot in dashboard/data/
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
