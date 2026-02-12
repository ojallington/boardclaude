#!/usr/bin/env node

import { cpSync, existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, "..");

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const DIRS = [
  ".claude-plugin",
  "agents",
  "commands",
  "skills",
  "panels",
  "hooks",
];

function getVersion() {
  const pkg = JSON.parse(
    readFileSync(join(PKG_ROOT, "package.json"), "utf-8"),
  );
  return pkg.version;
}

function printHelp() {
  console.log(`
${bold("boardclaude")} - Multi-perspective AI evaluation panels for Claude Code

${bold("USAGE")}
  boardclaude install [target-dir]    Install plugin files into a project
  boardclaude --help                  Show this help message
  boardclaude --version               Show version

${bold("EXAMPLES")}
  ${dim("# Install into current directory")}
  npx @boardclaude/cli install .

  ${dim("# Install into a specific project")}
  npx @boardclaude/cli install ./my-project

${bold("AFTER INSTALL")}
  Run ${bold("/bc:init")} in any Claude Code session to get started.
`);
}

function install(targetArg) {
  const targetDir = resolve(targetArg || ".");

  if (!existsSync(targetDir)) {
    console.error(red(`Error: Target directory '${targetDir}' does not exist.`));
    process.exit(1);
  }

  const stat = statSync(targetDir);
  if (!stat.isDirectory()) {
    console.error(red(`Error: '${targetDir}' is not a directory.`));
    process.exit(1);
  }

  console.log("");
  console.log(bold("BoardClaude Installer"));
  console.log(dim("─".repeat(40)));
  console.log("");

  let copied = 0;

  for (const dir of DIRS) {
    const src = join(PKG_ROOT, dir);
    const dest = join(targetDir, dir);

    if (!existsSync(src)) {
      console.log(dim(`  - ${dir}/ (skipped, not found in package)`));
      continue;
    }

    cpSync(src, dest, { recursive: true });
    console.log(green(`  \u2713 ${dir}/`));
    copied++;
  }

  console.log("");

  if (copied === 0) {
    console.error(
      red("Error: No plugin directories found. Is the package intact?"),
    );
    process.exit(1);
  }

  console.log(green(bold(`BoardClaude installed to ${targetDir}`)));
  console.log("");
  console.log(bold("Next steps:"));
  console.log(`  1. Open the project in Claude Code`);
  console.log(`  2. Run ${bold("/bc:init")} to choose a panel template`);
  console.log(`  3. Run ${bold("/bc:audit")} to run your first evaluation`);
  console.log("");
}

// --- CLI entry point ---

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  printHelp();
  process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  console.log(getVersion());
  process.exit(0);
}

const command = args[0];

if (command === "install") {
  install(args[1]);
} else {
  console.error(red(`Unknown command: ${command}`));
  console.error(`Run ${bold("boardclaude --help")} for usage information.`);
  process.exit(1);
}
