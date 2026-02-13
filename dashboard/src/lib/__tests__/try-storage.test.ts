import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";

const mockAccess = vi.fn();
const mockMkdir = vi.fn();
const mockReaddir = vi.fn();
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockUnlink = vi.fn();

// Mock @upstash/redis before importing the module
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(),
}));

// Mock fs with proper default export for vitest ESM interop
vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    default: {
      ...actual,
      promises: {
        access: mockAccess,
        mkdir: mockMkdir,
        readdir: mockReaddir,
        readFile: mockReadFile,
        writeFile: mockWriteFile,
        unlink: mockUnlink,
      },
    },
    promises: {
      access: mockAccess,
      mkdir: mockMkdir,
      readdir: mockReaddir,
      readFile: mockReadFile,
      writeFile: mockWriteFile,
      unlink: mockUnlink,
    },
  };
});

// Mock validate to return valid results
vi.mock("../validate", () => ({
  validateTryPanelResult: vi.fn((data: unknown) => ({ valid: true, data })),
}));

import type { TryPanelResult } from "../types";

const COMMITTED_DIR = path.join(process.cwd(), "data", "try-results");

function makePanelResult(
  overrides: Partial<TryPanelResult> = {},
): TryPanelResult {
  return {
    audit_id: "web-20260213-120000",
    repo: {
      owner: "testuser",
      name: "testrepo",
      description: "A test repo",
      stars: 10,
      language: "TypeScript",
    },
    panel: "web-judges",
    timestamp: "2026-02-13T12:00:00.000Z",
    agents: [],
    composite: {
      score: 85,
      radar: {
        architecture: 80,
        product: 82,
        innovation: 88,
        code_quality: 85,
        documentation: 90,
        integration: 85,
      },
      grade: "A-",
      verdict: "STRONG_PASS",
    },
    highlights: {
      top_strengths: ["Good code"],
      top_weaknesses: ["Missing docs"],
      divergent_opinions: [],
    },
    action_items: [],
    files_analyzed: 10,
    files_detail: [{ path: "src/index.ts", size: 1024, category: "source" }],
    tier: "free",
    ...overrides,
  };
}

describe("try-storage", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAccess.mockReset();
    mockMkdir.mockReset();
    mockReaddir.mockReset();
    mockReadFile.mockReset();
    mockWriteFile.mockReset();
    mockUnlink.mockReset();
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  describe("saveWebReview (filesystem)", () => {
    it("writes result JSON to the data directory", async () => {
      const { saveWebReview } = await import("../try-storage");
      const result = makePanelResult();

      mockAccess.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockUnlink.mockResolvedValue(undefined);

      await saveWebReview(result);

      expect(mockWriteFile).toHaveBeenCalledWith(
        path.join(COMMITTED_DIR, "web-20260213-120000.json"),
        JSON.stringify(result, null, 2),
        "utf-8",
      );
    });

    it("creates directory if it does not exist", async () => {
      const { saveWebReview } = await import("../try-storage");
      const result = makePanelResult();

      mockAccess.mockRejectedValue(new Error("ENOENT"));
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await saveWebReview(result);

      expect(mockMkdir).toHaveBeenCalledWith(COMMITTED_DIR, {
        recursive: true,
      });
    });
  });

  describe("listWebReviews (filesystem)", () => {
    it("returns sorted summaries from filesystem", async () => {
      const { listWebReviews } = await import("../try-storage");

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([
        "web-20260212-100000.json",
        "web-20260213-120000.json",
      ]);

      const result1 = makePanelResult({
        audit_id: "web-20260212-100000",
        timestamp: "2026-02-12T10:00:00.000Z",
      });
      const result2 = makePanelResult({
        audit_id: "web-20260213-120000",
        timestamp: "2026-02-13T12:00:00.000Z",
      });

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(result1))
        .mockResolvedValueOnce(JSON.stringify(result2));

      const summaries = await listWebReviews();

      expect(summaries).toHaveLength(2);
      expect(summaries[0]!.audit_id).toBe("web-20260213-120000");
      expect(summaries[1]!.audit_id).toBe("web-20260212-100000");
    });

    it("skips non-JSON files", async () => {
      const { listWebReviews } = await import("../try-storage");

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["readme.md", "web-20260213-120000.json"]);

      const result = makePanelResult();
      mockReadFile.mockResolvedValueOnce(JSON.stringify(result));

      const summaries = await listWebReviews();

      expect(summaries).toHaveLength(1);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it("returns empty array when directory is inaccessible", async () => {
      const { listWebReviews } = await import("../try-storage");

      mockAccess.mockRejectedValue(new Error("ENOENT"));

      const summaries = await listWebReviews();

      expect(summaries).toHaveLength(0);
    });

    it("deduplicates entries by audit_id", async () => {
      const { listWebReviews } = await import("../try-storage");

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["web-20260213-120000.json"]);

      const result = makePanelResult();
      mockReadFile.mockResolvedValueOnce(JSON.stringify(result));

      const summaries = await listWebReviews();

      expect(summaries).toHaveLength(1);
    });
  });

  describe("getWebReview (filesystem)", () => {
    it("returns a valid panel result by audit ID", async () => {
      const { getWebReview } = await import("../try-storage");

      mockAccess.mockResolvedValue(undefined);

      const result = makePanelResult();
      mockReadFile.mockResolvedValueOnce(JSON.stringify(result));

      const review = await getWebReview("web-20260213-120000");

      expect(review).not.toBeNull();
      expect(review!.audit_id).toBe("web-20260213-120000");
    });

    it("returns null when file not found", async () => {
      const { getWebReview } = await import("../try-storage");

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockRejectedValue(new Error("ENOENT"));

      const review = await getWebReview("nonexistent");

      expect(review).toBeNull();
    });

    it("handles audit IDs with .json extension", async () => {
      const { getWebReview } = await import("../try-storage");

      mockAccess.mockResolvedValue(undefined);

      const result = makePanelResult();
      mockReadFile.mockResolvedValueOnce(JSON.stringify(result));

      const review = await getWebReview("web-20260213-120000.json");

      expect(review).not.toBeNull();
    });

    it("returns null when no directories are accessible", async () => {
      const { getWebReview } = await import("../try-storage");

      mockAccess.mockRejectedValue(new Error("ENOENT"));

      const review = await getWebReview("web-20260213-120000");

      expect(review).toBeNull();
    });
  });

  describe("getPreviousReviewForRepo (filesystem)", () => {
    it("returns previous review for the same repo", async () => {
      const { getPreviousReviewForRepo } = await import("../try-storage");

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([
        "web-20260212-100000.json",
        "web-20260213-120000.json",
      ]);

      const result1 = makePanelResult({
        audit_id: "web-20260212-100000",
        timestamp: "2026-02-12T10:00:00.000Z",
      });
      const result2 = makePanelResult({
        audit_id: "web-20260213-120000",
        timestamp: "2026-02-13T12:00:00.000Z",
      });

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(result2))
        .mockResolvedValueOnce(JSON.stringify(result1));

      const review = await getPreviousReviewForRepo("testuser", "testrepo");

      expect(review).not.toBeNull();
      expect(review!.repo.owner).toBe("testuser");
      expect(review!.repo.name).toBe("testrepo");
    });

    it("excludes the specified audit ID", async () => {
      const { getPreviousReviewForRepo } = await import("../try-storage");

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["web-20260213-120000.json"]);

      const result = makePanelResult();
      mockReadFile.mockResolvedValueOnce(JSON.stringify(result));

      const review = await getPreviousReviewForRepo(
        "testuser",
        "testrepo",
        "web-20260213-120000",
      );

      expect(review).toBeNull();
    });

    it("returns null when repo not found", async () => {
      const { getPreviousReviewForRepo } = await import("../try-storage");

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["web-20260213-120000.json"]);

      const result = makePanelResult();
      mockReadFile.mockResolvedValueOnce(JSON.stringify(result));

      const review = await getPreviousReviewForRepo("otheruser", "otherrepo");

      expect(review).toBeNull();
    });

    it("returns null when no directories exist", async () => {
      const { getPreviousReviewForRepo } = await import("../try-storage");

      mockAccess.mockRejectedValue(new Error("ENOENT"));

      const review = await getPreviousReviewForRepo("testuser", "testrepo");

      expect(review).toBeNull();
    });
  });

  describe("getShareableUrl", () => {
    it("returns correct URL path", async () => {
      const { getShareableUrl } = await import("../try-storage");

      expect(getShareableUrl("web-20260213-120000")).toBe(
        "/results/web/web-20260213-120000",
      );
    });
  });
});
