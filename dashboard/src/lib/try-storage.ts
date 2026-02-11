import { promises as fs } from "fs";
import path from "path";
import type { TryPanelResult, TryResultSummary } from "./types";
import { validateTryPanelResult } from "./validate";

// ─── Redis (Upstash) for production persistence ─────────────────────────────

let redis: import("@upstash/redis").Redis | null = null;

async function getRedis(): Promise<import("@upstash/redis").Redis | null> {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import("@upstash/redis");
  redis = new Redis({ url, token });
  return redis;
}

const REDIS_PREFIX = "try-result:";
const REDIS_INDEX_KEY = "try-results:index";
const REDIS_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// ─── Filesystem fallback (local dev) ────────────────────────────────────────

const COMMITTED_DIR = path.join(process.cwd(), "data", "try-results");

async function resolveWriteDir(): Promise<string> {
  try {
    await fs.access(COMMITTED_DIR);
    const testFile = path.join(COMMITTED_DIR, ".write-test");
    await fs.writeFile(testFile, "");
    await fs.unlink(testFile);
    return COMMITTED_DIR;
  } catch {
    await fs.mkdir(COMMITTED_DIR, { recursive: true });
    return COMMITTED_DIR;
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
  return dirs;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function saveWebReview(result: TryPanelResult): Promise<void> {
  const kv = await getRedis();
  if (kv) {
    const key = REDIS_PREFIX + result.audit_id;
    const summary: TryResultSummary = {
      audit_id: result.audit_id,
      repo: { owner: result.repo.owner, name: result.repo.name },
      composite: {
        score: result.composite.score,
        grade: result.composite.grade,
        verdict: result.composite.verdict,
      },
      tier: result.tier,
      timestamp: result.timestamp,
    };

    await Promise.all([
      kv.set(key, JSON.stringify(result), { ex: REDIS_TTL_SECONDS }),
      kv.lpush(REDIS_INDEX_KEY, JSON.stringify(summary)),
      kv.ltrim(REDIS_INDEX_KEY, 0, 99), // Keep latest 100 entries
    ]);
    return;
  }

  // Filesystem fallback
  const dir = await resolveWriteDir();
  const filename = `${result.audit_id}.json`;
  await fs.writeFile(
    path.join(dir, filename),
    JSON.stringify(result, null, 2),
    "utf-8",
  );
}

export async function listWebReviews(): Promise<TryResultSummary[]> {
  const kv = await getRedis();
  if (kv) {
    const raw = await kv.lrange(REDIS_INDEX_KEY, 0, 99);
    const summaries: TryResultSummary[] = [];
    for (const entry of raw) {
      try {
        const parsed =
          typeof entry === "string"
            ? (JSON.parse(entry) as TryResultSummary)
            : (entry as TryResultSummary);
        summaries.push(parsed);
      } catch {
        // Skip malformed entries
      }
    }
    return summaries.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  // Filesystem fallback
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
          const rawFile = await fs.readFile(path.join(dir, file), "utf-8");
          const parsed = validateTryPanelResult(JSON.parse(rawFile));
          if (!parsed.valid || !parsed.data) continue;
          const data = parsed.data;
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
  const kv = await getRedis();
  if (kv) {
    const key = REDIS_PREFIX + auditId;
    const raw = await kv.get<string>(key);
    if (!raw) return null;
    try {
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      const parsed = validateTryPanelResult(data);
      return parsed.valid ? parsed.data : null;
    } catch {
      return null;
    }
  }

  // Filesystem fallback
  const dirs = await resolveReadDirs();
  const filename = auditId.endsWith(".json") ? auditId : `${auditId}.json`;

  for (const dir of dirs) {
    try {
      const rawFile = await fs.readFile(path.join(dir, filename), "utf-8");
      const parsed = validateTryPanelResult(JSON.parse(rawFile));
      return parsed.valid ? parsed.data : null;
    } catch {
      // Try next dir
    }
  }

  return null;
}

/** Generate a shareable URL path for a Try-It-Now result */
export function getShareableUrl(auditId: string): string {
  return `/results/web/${auditId}`;
}
