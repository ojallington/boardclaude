import { promises as fs } from "fs";
import path from "path";
import type { TryPanelResult, TryResultSummary } from "./types";

const COMMITTED_DIR = path.join(process.cwd(), "data", "try-results");
const EPHEMERAL_DIR = "/tmp/try-results";

async function resolveWriteDir(): Promise<string> {
  // Try committed dir first (works in dev)
  try {
    await fs.access(COMMITTED_DIR);
    // Check if writable
    const testFile = path.join(COMMITTED_DIR, ".write-test");
    await fs.writeFile(testFile, "");
    await fs.unlink(testFile);
    return COMMITTED_DIR;
  } catch {
    // Fall back to ephemeral dir (Vercel production)
    await fs.mkdir(EPHEMERAL_DIR, { recursive: true });
    return EPHEMERAL_DIR;
  }
}

async function resolveReadDirs(): Promise<string[]> {
  const dirs: string[] = [];
  try {
    await fs.access(COMMITTED_DIR);
    dirs.push(COMMITTED_DIR);
  } catch {
    // no committed dir
  }
  try {
    await fs.access(EPHEMERAL_DIR);
    dirs.push(EPHEMERAL_DIR);
  } catch {
    // no ephemeral dir
  }
  return dirs;
}

export async function saveWebReview(result: TryPanelResult): Promise<void> {
  const dir = await resolveWriteDir();
  const filename = `${result.audit_id}.json`;
  await fs.writeFile(
    path.join(dir, filename),
    JSON.stringify(result, null, 2),
    "utf-8",
  );
}

export async function listWebReviews(): Promise<TryResultSummary[]> {
  const dirs = await resolveReadDirs();
  const seen = new Set<string>();
  const summaries: TryResultSummary[] = [];

  for (const dir of dirs) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const auditId = file.replace(".json", "");
        if (seen.has(auditId)) continue;
        seen.add(auditId);

        try {
          const raw = await fs.readFile(path.join(dir, file), "utf-8");
          const data = JSON.parse(raw) as TryPanelResult;
          summaries.push({
            audit_id: data.audit_id,
            repo: { owner: data.repo.owner, name: data.repo.name },
            composite: {
              score: data.composite.score,
              grade: data.composite.grade,
              verdict: data.composite.verdict,
            },
            tier: data.tier,
            timestamp: data.timestamp,
          });
        } catch {
          // Skip malformed files
        }
      }
    } catch {
      // Skip inaccessible dirs
    }
  }

  return summaries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export async function getWebReview(
  auditId: string,
): Promise<TryPanelResult | null> {
  const dirs = await resolveReadDirs();
  const filename = auditId.endsWith(".json") ? auditId : `${auditId}.json`;

  for (const dir of dirs) {
    try {
      const raw = await fs.readFile(path.join(dir, filename), "utf-8");
      return JSON.parse(raw) as TryPanelResult;
    } catch {
      // Try next dir
    }
  }

  return null;
}
