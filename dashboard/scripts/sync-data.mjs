#!/usr/bin/env node

/**
 * Syncs .boardclaude/ (source of truth) into dashboard/data/ for Vercel builds.
 *
 * Run manually: node scripts/sync-data.mjs
 * Runs automatically before: npm run build
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASHBOARD_DIR = path.resolve(__dirname, "..");
const SOURCE_DIR = path.resolve(DASHBOARD_DIR, "..", ".boardclaude");
const TARGET_DIR = path.join(DASHBOARD_DIR, "data");

const ROOT_FILES = ["state.json", "timeline.json", "action-items.json"];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function cleanDir(dir) {
  try {
    const entries = await fs.readdir(dir);
    await Promise.all(
      entries.map((entry) => fs.rm(path.join(dir, entry), { recursive: true })),
    );
  } catch {
    // Directory doesn't exist yet, that's fine
  }
}

async function copyFile(src, dest) {
  await fs.copyFile(src, dest);
}

async function sync() {
  const sourceExists = await fs
    .access(SOURCE_DIR)
    .then(() => true)
    .catch(() => false);

  if (!sourceExists) {
    console.log(
      "[sync-data] .boardclaude/ not found -- creating empty data dirs",
    );
    await ensureDir(path.join(TARGET_DIR, "audits"));
    await ensureDir(path.join(TARGET_DIR, "try-results"));
    return;
  }

  // Clean target audits dir to prevent stale files
  await ensureDir(TARGET_DIR);
  await cleanDir(path.join(TARGET_DIR, "audits"));
  await ensureDir(path.join(TARGET_DIR, "audits"));
  await ensureDir(path.join(TARGET_DIR, "try-results"));

  // Copy root-level JSON files
  let rootCopied = 0;
  for (const file of ROOT_FILES) {
    const src = path.join(SOURCE_DIR, file);
    try {
      await fs.access(src);
      await copyFile(src, path.join(TARGET_DIR, file));
      rootCopied++;
    } catch {
      // File doesn't exist in source, skip
    }
  }

  // Copy audit JSON files (skip .md files)
  let auditsCopied = 0;
  const auditsDir = path.join(SOURCE_DIR, "audits");
  try {
    const files = await fs.readdir(auditsDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    await Promise.all(
      jsonFiles.map(async (file) => {
        await copyFile(
          path.join(auditsDir, file),
          path.join(TARGET_DIR, "audits", file),
        );
        auditsCopied++;
      }),
    );
  } catch {
    // No audits directory
  }

  console.log(
    `[sync-data] Synced ${rootCopied} root files, ${auditsCopied} audits from .boardclaude/ to dashboard/data/`,
  );
}

sync().catch((err) => {
  console.error("[sync-data] Failed:", err);
  process.exit(1);
});
