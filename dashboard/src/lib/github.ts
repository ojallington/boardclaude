import type { TryRepoMeta, FileDetail } from "./types";

// ─── URL Parsing ────────────────────────────────────────────────────────────

const GITHUB_RE =
  /^https?:\/\/(www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/tree\/[^/]+)?(?:\/)?$/i;

export function parseGitHubUrl(
  url: string,
): { owner: string; repo: string } | null {
  const match = url.match(GITHUB_RE);
  if (!match || !match[2] || !match[3]) return null;
  return { owner: match[2], repo: match[3] };
}

// ─── GitHub API Fetching ────────────────────────────────────────────────────

interface GitHubRepoResponse {
  description: string | null;
  language: string | null;
  stargazers_count: number;
  default_branch: string;
}

interface GitHubTreeEntry {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

interface GitHubTreeResponse {
  tree: GitHubTreeEntry[];
  truncated: boolean;
}

export async function fetchRepoMeta(
  owner: string,
  repo: string,
): Promise<{ meta: TryRepoMeta; defaultBranch: string }> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Accept: "application/vnd.github.v3+json" },
    next: { revalidate: 300 },
  });
  if (res.status === 404) throw new Error("REPO_NOT_FOUND");
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

  const data = (await res.json()) as GitHubRepoResponse;
  return {
    meta: {
      owner,
      name: repo,
      description: data.description,
      language: data.language,
      stars: data.stargazers_count,
    },
    defaultBranch: data.default_branch,
  };
}

async function fetchTree(
  owner: string,
  repo: string,
  branch: string,
): Promise<GitHubTreeEntry[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: { Accept: "application/vnd.github.v3+json" },
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) throw new Error(`GitHub tree API error: ${res.status}`);
  const data = (await res.json()) as GitHubTreeResponse;
  return data.tree.filter((e) => e.type === "blob");
}

async function fetchFileContent(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string | null> {
  try {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    // Cap at 500 lines
    const lines = text.split("\n");
    if (lines.length > 500) {
      return lines.slice(0, 500).join("\n") + "\n... (truncated at 500 lines)";
    }
    return text;
  } catch {
    return null;
  }
}

// ─── File Selection ─────────────────────────────────────────────────────────

const PRIORITY_FILES = [
  "README.md",
  "readme.md",
  "README",
  "package.json",
  "Cargo.toml",
  "pyproject.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "Gemfile",
  "CLAUDE.md",
  ".cursorrules",
  "tsconfig.json",
  "Dockerfile",
  "docker-compose.yml",
  ".github/workflows/ci.yml",
  "LICENSE",
  "CONTRIBUTING.md",
];

const EXCLUDED_DIRS = [
  "node_modules/",
  "__pycache__/",
  "vendor/",
  "dist/",
  "build/",
  ".next/",
  ".git/",
  "coverage/",
  ".cache/",
];

const ENTRY_NAMES = new Set([
  "index",
  "main",
  "app",
  "server",
  "route",
  "page",
  "layout",
  "mod",
  "lib",
]);

const SOURCE_EXTS = /\.(ts|tsx|js|jsx|py|rs|go|java|rb|c|cpp|cs)$/;

function scoreFile(e: GitHubTreeEntry): number {
  let s = 0;
  const basename =
    e.path
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, "") ?? "";
  if (ENTRY_NAMES.has(basename)) s += 10;
  const depth = e.path.split("/").length;
  if (depth <= 2) s += 5;
  else if (depth <= 3) s += 3;
  const size = e.size ?? 0;
  if (size >= 500 && size <= 15000) s += 3;
  if (/test|spec/.test(e.path)) s += 2;
  return s;
}

function selectFiles(tree: GitHubTreeEntry[]): string[] {
  const selected: string[] = [];
  const paths = new Set(tree.map((e) => e.path));

  // Priority files first
  for (const pf of PRIORITY_FILES) {
    if (paths.has(pf)) {
      selected.push(pf);
    }
  }

  // Source files: pick up to 10, scored by relevance
  const sourceFiles = tree.filter(
    (e) =>
      !EXCLUDED_DIRS.some((d) => e.path.includes(d)) &&
      !e.path.includes(".min.") &&
      (e.size ?? 0) < 50000 &&
      (e.size ?? 0) > 100 &&
      SOURCE_EXTS.test(e.path),
  );

  sourceFiles.sort(
    (a, b) => scoreFile(b) - scoreFile(a) || (a.size ?? 0) - (b.size ?? 0),
  );

  let count = 0;
  for (const sf of sourceFiles) {
    if (count >= 10) break;
    if (!selected.includes(sf.path)) {
      selected.push(sf.path);
      count++;
    }
  }

  return selected;
}

// ─── Main Fetch Function ────────────────────────────────────────────────────

const MAX_TOTAL_CHARS = 80000;

export interface FetchedRepo {
  meta: TryRepoMeta;
  files: Array<{ path: string; content: string }>;
  filesDetail: FileDetail[];
  totalFiles: number;
  treeSize: number;
}

export async function fetchRepoContents(
  owner: string,
  repo: string,
): Promise<FetchedRepo> {
  const { meta, defaultBranch } = await fetchRepoMeta(owner, repo);
  const tree = await fetchTree(owner, repo, defaultBranch);
  const filePaths = selectFiles(tree);
  const prioritySet = new Set(PRIORITY_FILES);

  const files: Array<{ path: string; content: string }> = [];
  const filesDetail: FileDetail[] = [];
  let totalChars = 0;

  for (const filePath of filePaths) {
    if (totalChars >= MAX_TOTAL_CHARS) break;
    const content = await fetchFileContent(
      owner,
      repo,
      defaultBranch,
      filePath,
    );
    if (content) {
      const trimmed =
        totalChars + content.length > MAX_TOTAL_CHARS
          ? content.slice(0, MAX_TOTAL_CHARS - totalChars)
          : content;
      files.push({ path: filePath, content: trimmed });
      filesDetail.push({
        path: filePath,
        size: trimmed.length,
        category: prioritySet.has(filePath) ? "priority" : "source",
      });
      totalChars += trimmed.length;
    }
  }

  return {
    meta,
    files,
    filesDetail,
    totalFiles: files.length,
    treeSize: tree.length,
  };
}
