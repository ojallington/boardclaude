import { describe, it, expect } from "vitest";
import { parseGitHubUrl, getTierLimits } from "../github";

// ─── parseGitHubUrl ──────────────────────────────────────────────────

describe("parseGitHubUrl", () => {
  it("parses a standard GitHub URL", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses a URL with trailing slash", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo/");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses a URL with .git suffix", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo.git");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses a URL with tree path (branch)", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo/tree/main");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses a URL with tree path and trailing slash", () => {
    const result = parseGitHubUrl(
      "https://github.com/owner/repo/tree/develop/",
    );
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses a URL with www prefix", () => {
    const result = parseGitHubUrl("https://www.github.com/owner/repo");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses an http URL", () => {
    const result = parseGitHubUrl("http://github.com/owner/repo");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("handles owner and repo with dots and hyphens", () => {
    const result = parseGitHubUrl("https://github.com/my-org/my.repo-name");
    expect(result).toEqual({ owner: "my-org", repo: "my.repo-name" });
  });

  it("returns null for non-GitHub URL", () => {
    expect(parseGitHubUrl("https://gitlab.com/owner/repo")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseGitHubUrl("")).toBeNull();
  });

  it("returns null for URL with no repo", () => {
    expect(parseGitHubUrl("https://github.com/owner")).toBeNull();
  });

  it("returns null for plain text", () => {
    expect(parseGitHubUrl("not a url at all")).toBeNull();
  });

  it("returns null for GitHub URL with extra path segments (non-tree)", () => {
    expect(
      parseGitHubUrl("https://github.com/owner/repo/blob/main/file.ts"),
    ).toBeNull();
  });
});

// ─── getTierLimits ───────────────────────────────────────────────────

describe("getTierLimits", () => {
  it("returns correct limits for free tier", () => {
    const limits = getTierLimits("free");
    expect(limits.maxTotalChars).toBe(80_000);
    expect(limits.maxSourceFiles).toBe(10);
  });

  it("returns correct limits for byok tier", () => {
    const limits = getTierLimits("byok");
    expect(limits.maxTotalChars).toBe(1_200_000);
    expect(limits.maxSourceFiles).toBe(60);
  });

  it("byok limits are larger than free limits", () => {
    const free = getTierLimits("free");
    const byok = getTierLimits("byok");
    expect(byok.maxTotalChars).toBeGreaterThan(free.maxTotalChars);
    expect(byok.maxSourceFiles).toBeGreaterThan(free.maxSourceFiles);
  });
});
