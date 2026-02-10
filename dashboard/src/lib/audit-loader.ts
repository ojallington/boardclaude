import { promises as fs } from "fs";
import path from "path";
import type {
  SynthesisReport,
  ProjectState,
  Timeline,
  ActionItemsLedger,
  AuditSummary,
} from "./types";

const BOARDCLAUDE_DIR = path.join(process.cwd(), "..", ".boardclaude");

export async function getProjectState(): Promise<ProjectState | null> {
  try {
    const raw = await fs.readFile(
      path.join(BOARDCLAUDE_DIR, "state.json"),
      "utf-8",
    );
    return JSON.parse(raw) as ProjectState;
  } catch {
    return null;
  }
}

export async function getTimeline(): Promise<Timeline | null> {
  try {
    const raw = await fs.readFile(
      path.join(BOARDCLAUDE_DIR, "timeline.json"),
      "utf-8",
    );
    return JSON.parse(raw) as Timeline;
  } catch {
    return null;
  }
}

export async function getActionItems(): Promise<ActionItemsLedger | null> {
  try {
    const raw = await fs.readFile(
      path.join(BOARDCLAUDE_DIR, "action-items.json"),
      "utf-8",
    );
    return JSON.parse(raw) as ActionItemsLedger;
  } catch {
    return null;
  }
}

export async function listAudits(): Promise<string[]> {
  try {
    const auditsDir = path.join(BOARDCLAUDE_DIR, "audits");
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
    const filename = auditId.endsWith(".json") ? auditId : `${auditId}.json`;
    const raw = await fs.readFile(
      path.join(BOARDCLAUDE_DIR, "audits", filename),
      "utf-8",
    );
    return JSON.parse(raw) as SynthesisReport;
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
