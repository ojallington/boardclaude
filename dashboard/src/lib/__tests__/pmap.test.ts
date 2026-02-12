import { describe, it, expect } from "vitest";
import { pMap } from "@/lib/github";

describe("pMap", () => {
  it("maps items preserving order", async () => {
    const result = await pMap([1, 2, 3], async (x) => x * 2, 3);
    expect(result).toEqual([2, 4, 6]);
  });

  it("respects concurrency limit", async () => {
    let maxConcurrent = 0;
    let current = 0;

    const result = await pMap(
      [10, 20, 30, 40, 50],
      async (x) => {
        current++;
        maxConcurrent = Math.max(maxConcurrent, current);
        await new Promise((r) => setTimeout(r, 10));
        current--;
        return x;
      },
      2,
    );

    expect(maxConcurrent).toBeLessThanOrEqual(2);
    expect(result).toEqual([10, 20, 30, 40, 50]);
  });

  it("handles empty array", async () => {
    const result = await pMap([], async (x: number) => x, 5);
    expect(result).toEqual([]);
  });

  it("handles concurrency greater than items", async () => {
    const result = await pMap([1, 2], async (x) => x + 1, 10);
    expect(result).toEqual([2, 3]);
  });

  it("propagates errors", async () => {
    await expect(
      pMap(
        [1, 2, 3],
        async (x) => {
          if (x === 2) throw new Error("fail");
          return x;
        },
        2,
      ),
    ).rejects.toThrow("fail");
  });
});
