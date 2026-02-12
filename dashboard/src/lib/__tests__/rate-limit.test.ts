import { describe, it, expect, beforeEach, vi } from "vitest";

// Ensure no Redis env vars are set so the in-memory fallback is used
beforeEach(() => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

describe("checkRateLimit (in-memory fallback)", () => {
  // Re-import for each test to get a fresh memory store
  async function getFreshCheckRateLimit() {
    // Clear module cache to reset the in-memory Map
    vi.resetModules();
    const mod = await import("../rate-limit");
    return mod.checkRateLimit;
  }

  it("allows the first request", async () => {
    const checkRateLimit = await getFreshCheckRateLimit();
    const result = await checkRateLimit("192.168.1.1", "free");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2); // free max is 3, used 1
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("allows requests up to the free tier limit (3)", async () => {
    const checkRateLimit = await getFreshCheckRateLimit();
    const ip = "10.0.0.1";

    const r1 = await checkRateLimit(ip, "free");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await checkRateLimit(ip, "free");
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await checkRateLimit(ip, "free");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests beyond the free tier limit", async () => {
    const checkRateLimit = await getFreshCheckRateLimit();
    const ip = "10.0.0.2";

    // Exhaust the limit
    await checkRateLimit(ip, "free");
    await checkRateLimit(ip, "free");
    await checkRateLimit(ip, "free");

    // Fourth request should be blocked
    const r4 = await checkRateLimit(ip, "free");
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("allows up to byok tier limit (30)", async () => {
    const checkRateLimit = await getFreshCheckRateLimit();
    const ip = "10.0.0.3";

    for (let i = 0; i < 30; i++) {
      const result = await checkRateLimit(ip, "byok");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(29 - i);
    }

    // 31st request should be blocked
    const blocked = await checkRateLimit(ip, "byok");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks different IPs independently", async () => {
    const checkRateLimit = await getFreshCheckRateLimit();

    // Exhaust limit for IP A
    await checkRateLimit("ip-a", "free");
    await checkRateLimit("ip-a", "free");
    await checkRateLimit("ip-a", "free");
    const blockedA = await checkRateLimit("ip-a", "free");
    expect(blockedA.allowed).toBe(false);

    // IP B should still be allowed
    const allowedB = await checkRateLimit("ip-b", "free");
    expect(allowedB.allowed).toBe(true);
    expect(allowedB.remaining).toBe(2);
  });

  it("tracks different tiers independently for the same IP", async () => {
    const checkRateLimit = await getFreshCheckRateLimit();
    const ip = "10.0.0.4";

    // Exhaust free tier
    await checkRateLimit(ip, "free");
    await checkRateLimit(ip, "free");
    await checkRateLimit(ip, "free");
    const blockedFree = await checkRateLimit(ip, "free");
    expect(blockedFree.allowed).toBe(false);

    // byok tier should still be allowed for the same IP
    const allowedByok = await checkRateLimit(ip, "byok");
    expect(allowedByok.allowed).toBe(true);
  });

  it("returns a resetAt timestamp in the future", async () => {
    const checkRateLimit = await getFreshCheckRateLimit();
    const before = Date.now();
    const result = await checkRateLimit("10.0.0.5", "free");
    // resetAt should be roughly 1 hour from now
    expect(result.resetAt).toBeGreaterThan(before);
    expect(result.resetAt).toBeLessThanOrEqual(before + 60 * 60 * 1000 + 100);
  });

  it("resets the counter after the window expires", async () => {
    const checkRateLimit = await getFreshCheckRateLimit();
    const ip = "10.0.0.6";

    // Exhaust the limit
    await checkRateLimit(ip, "free");
    await checkRateLimit(ip, "free");
    await checkRateLimit(ip, "free");
    const blocked = await checkRateLimit(ip, "free");
    expect(blocked.allowed).toBe(false);

    // Advance time past the window (1 hour + 1ms)
    vi.useFakeTimers();
    vi.advanceTimersByTime(60 * 60 * 1000 + 1);

    // Should be allowed again after window reset
    const allowed = await checkRateLimit(ip, "free");
    expect(allowed.allowed).toBe(true);
    expect(allowed.remaining).toBe(2);

    vi.useRealTimers();
  });
});
