---
name: validation-runner
description: >
  Run project validation suite (types, tests, lint, format) and produce
  structured results for agent evaluation context. Triggers on "validate",
  "check", "verify", "test", "lint".
allowed-tools: Bash, Read, Write, Glob, Grep
context: fork
agent: general-purpose
---

# Validation Runner — ultrathink

## Overview

Execute the full project validation suite — TypeScript compilation, test runner, linter, formatter — and produce a structured JSON report. This feeds REAL DATA into agent evaluations instead of opinion-based assessment. Run before an audit (baseline) and after fixes (delta) to close the proof loop.

## Prerequisites

Before running, verify:
- Project root: !`ls package.json 2>/dev/null || echo "NO package.json — cannot detect stack"`
- TypeScript config: !`ls tsconfig.json 2>/dev/null || echo "NO tsconfig.json — skip type checking"`
- Node modules: !`ls node_modules/.package-lock.json 2>/dev/null || echo "NO node_modules — run npm install first"`
- BoardClaude state dir: !`ls .boardclaude/ 2>/dev/null || echo "NOT FOUND — will create"`
- Previous validation: !`ls .boardclaude/validation/latest.json 2>/dev/null || echo "None — this is the first run"`

## Steps

1. **Detect project stack** by reading `package.json`:
   - Check `dependencies` and `devDependencies` for framework (next, react, express, etc.)
   - Check for TypeScript (`typescript` in devDependencies, `tsconfig.json` exists)
   - Check for test runner (`jest`, `vitest`, `mocha`, etc.)
   - Check for linter (`eslint`, `next lint` script)
   - Check for formatter (`prettier`)
   - Record detected stack in results

2. **Ensure `.boardclaude/validation/` directory exists**. Create it if missing.

3. **If a previous `latest.json` exists**, archive it to `.boardclaude/validation/run-{timestamp}.json` before overwriting. This preserves history for delta tracking.

4. **Run TypeScript compilation check**:
   ```bash
   npx tsc --noEmit 2>&1
   ```
   - Parse output: count lines matching `error TS\d+` for error count
   - Count lines matching `warning` for warning count
   - Capture up to 10 specific error messages with file paths and line numbers
   - If `tsconfig.json` is missing, record `"skipped": true` and move on

5. **Run test suite**:
   ```bash
   npm test -- --reporter=json 2>&1
   ```
   - If Jest: parse JSON output for `numPassedTests`, `numFailedTests`, `numTotalTests`
   - If Vitest: parse JSON reporter output similarly
   - Extract coverage percentage if available (`--coverage` flag or existing config)
   - If no test script configured in `package.json`, record `"skipped": true`
   - Capture names of failing tests (up to 10)

6. **Run linter**:
   ```bash
   npx next lint --format=json 2>&1
   ```
   - If not a Next.js project, fall back to `npx eslint . --format=json 2>&1`
   - Parse JSON output: count errors and warnings
   - Capture up to 10 specific lint issues with file paths
   - If no eslint config found, record `"skipped": true`

7. **Run formatter check**:
   ```bash
   npx prettier --check . 2>&1
   ```
   - Count total files checked vs files needing formatting
   - Calculate compliance percentage: `(checked - failing) / checked * 100`
   - If prettier is not installed, record `"skipped": true`

8. **Run Lighthouse audit** (optional, only if available):
   ```bash
   npx lighthouse http://localhost:3000 --output=json --chrome-flags="--headless" 2>&1
   ```
   - Only attempt if a dev server is running (check port 3000)
   - Extract performance, accessibility, best-practices, SEO scores
   - If unavailable or dev server not running, record `null` for all fields

9. **Assemble results** into the structured JSON format (see Output Format below).

10. **Save results** to `.boardclaude/validation/latest.json`.

11. **Calculate delta** if a previous run exists:
    - Compare error counts, test counts, lint counts, format compliance
    - Produce a `delta` object showing changes: `{ "typescript_errors": -3, "tests_passed": +2, ... }`
    - Include delta in the saved results

12. **Report summary** to the user:
    - One-line verdict: "12 type errors, 45/47 tests passing, lint score 94%, format 100%"
    - If delta exists: "Delta: -3 type errors, +2 tests passing, lint +1%"
    - Path to full results file

## Output Format

Save to `.boardclaude/validation/latest.json`:

```json
{
  "timestamp": "<ISO 8601>",
  "stack": {
    "framework": "next",
    "language": "typescript",
    "test_runner": "jest",
    "linter": "eslint",
    "formatter": "prettier"
  },
  "typescript": {
    "skipped": false,
    "errors": 0,
    "warnings": 0,
    "details": [
      { "file": "src/app/page.tsx", "line": 12, "code": "TS2345", "message": "..." }
    ]
  },
  "tests": {
    "skipped": false,
    "total": 47,
    "passed": 45,
    "failed": 2,
    "coverage": 78.5,
    "failing_tests": ["test name 1", "test name 2"]
  },
  "lint": {
    "skipped": false,
    "errors": 1,
    "warnings": 5,
    "details": [
      { "file": "src/lib/utils.ts", "line": 8, "rule": "no-unused-vars", "severity": "error" }
    ]
  },
  "format": {
    "skipped": false,
    "compliant_pct": 100,
    "files_checked": 42,
    "files_failing": 0
  },
  "lighthouse": {
    "performance": null,
    "accessibility": null,
    "best_practices": null,
    "seo": null
  },
  "delta": {
    "previous_timestamp": "<ISO 8601 or null>",
    "typescript_errors": 0,
    "tests_passed": 0,
    "tests_failed": 0,
    "lint_errors": 0,
    "lint_warnings": 0,
    "format_compliant_pct": 0
  },
  "summary": "12 type errors, 45/47 tests passing, 1 lint error, format 100%"
}
```

## Integration with Audit Pipeline

When audit-runner invokes validation-runner before spawning agents:

1. Run validation-runner to produce `latest.json`
2. Read `latest.json` and inject summary into each agent's evaluation prompt:
   > "Validation context: 12 type errors (details: ...), 45/47 tests passing (2 failing: ...), 1 lint error, format compliant."
3. Agents now have real data to cite — Boris can reference actual type errors, Lydia can verify patterns against real lint output
4. After audit and fix cycle, re-run validation-runner to measure improvement

## Error Handling

- **`package.json` missing**: Abort with clear message — "No package.json found. Run from project root."
- **`node_modules` missing**: Warn and suggest `npm install`, then attempt to continue (tools may fail)
- **TypeScript not installed**: Skip type checking, set `typescript.skipped = true`
- **No test script**: Skip tests, set `tests.skipped = true` — do NOT fail the whole run
- **Test suite fails (exit code 1)**: This is expected when tests fail. Parse the output normally — a non-zero exit code means there are failing tests, not that the runner broke.
- **Linter not configured**: Skip linting, set `lint.skipped = true`
- **Prettier not installed**: Skip format check, set `format.skipped = true`
- **Command timeout**: Set 60-second timeout per command. If exceeded, record `"timeout": true` for that check.
- **JSON parse failure**: If a tool outputs non-JSON, fall back to regex parsing of plain text output
- **Lighthouse unavailable**: Always optional. Record `null` values silently.
