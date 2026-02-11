interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

const LIMITS = {
  free: { max: 3, windowMs: 60 * 60 * 1000 },
  byok: { max: 30, windowMs: 60 * 60 * 1000 },
} as const;

type Tier = keyof typeof LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ─── Redis (Upstash) for durable rate limiting ──────────────────────────────

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

// ─── Public API ─────────────────────────────────────────────────────────────

export async function checkRateLimit(
  ip: string,
  tier: Tier,
): Promise<RateLimitResult> {
  const limit = LIMITS[tier];
  const key = `ratelimit:${tier}:${ip}`;

  const kv = await getRedis();
  if (kv) {
    const windowSeconds = Math.ceil(limit.windowMs / 1000);
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, windowSeconds);
    }
    const ttl = await kv.ttl(key);
    const resetAt = Date.now() + ttl * 1000;

    if (count > limit.max) {
      return { allowed: false, remaining: 0, resetAt };
    }
    return { allowed: true, remaining: limit.max - count, resetAt };
  }

  // In-memory fallback (local dev)
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + limit.windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit.max - 1, resetAt };
  }

  if (entry.count >= limit.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit.max - entry.count,
    resetAt: entry.resetAt,
  };
}
