interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

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

export function checkRateLimit(ip: string, tier: Tier): RateLimitResult {
  const now = Date.now();
  const limit = LIMITS[tier];
  const key = `${tier}:${ip}`;

  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + limit.windowMs;
    store.set(key, { count: 1, resetAt });
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

// Clean up expired entries periodically (every 10 minutes)
if (typeof globalThis !== "undefined") {
  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  };
  setInterval(cleanup, 10 * 60 * 1000).unref?.();
}
