---
name: accessibility-auditor
description: >
  Run Playwright-based accessibility, visual, and performance audits on
  the dashboard. Produces Lighthouse scores and axe-core results.
  Triggers on "accessibility", "a11y", "lighthouse", "visual test", "screenshot".
allowed-tools: Bash, Read, Write, Glob, mcp__playwright__*
context: fork
agent: general-purpose
---

# Accessibility Auditor — ultrathink

## Overview

Execute a comprehensive accessibility, visual regression, and performance audit on the BoardClaude dashboard using Playwright MCP. Captures screenshots at multiple viewports, runs axe-core violation checks, validates color contrast for all agent colors, tests keyboard navigation, and produces Lighthouse scores. Results feed into Lydia and Ado agent evaluations as structured context.

## Prerequisites

Before running, verify:
- Playwright MCP available: !`echo "Check mcp__playwright tools are registered"`
- Dev server running: !`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "NOT RUNNING"`
- Node modules: !`ls node_modules/.package-lock.json 2>/dev/null || echo "NOT FOUND — run npm install"`
- Validation directory: !`ls .boardclaude/validation/ 2>/dev/null || echo "NOT FOUND — will create"`

## Steps

1. **Ensure dev server is running**: Check `curl -s http://localhost:3000`. If not responding, start it with `npm run dev &` and wait up to 15 seconds for it to become available. If it still fails, abort Lighthouse steps and note in report.

2. **Prepare output directory**: Ensure `.boardclaude/validation/screenshots/` exists. Create it if missing.

3. **Use Playwright MCP to navigate to key pages**: `/`, `/audit/latest`, `/dashboard`. For each page:

   a. **Take screenshot** at default viewport (1440px wide). Save to `.boardclaude/validation/screenshots/{page}-{timestamp}.png`.

   b. **Run axe-core accessibility audit** via `browser_evaluate`. Inject axe-core from CDN, run `axe.run()`, and collect violations. Record each violation with its impact level (critical, serious, moderate, minor), affected nodes, and WCAG criteria.

   c. **Check color contrast ratios** against the agent color palette:
      - Boris=#3b82f6, Cat=#8b5cf6, Thariq=#06b6d4, Lydia=#f59e0b, Ado=#10b981, Jason=#ef4444, Synthesis=#6366f1
      - Verify each agent color meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text) against both the dark background and any card backgrounds.

   d. **Verify keyboard navigation**: Use Playwright to tab through all interactive elements. Check that focus indicators are visible, tab order is logical, and no focus traps exist.

   e. **Check responsive layout** at three viewports: 1440px, 768px, 375px. Take a screenshot at each breakpoint. Flag layout overflow, overlapping elements, or unreadable text.

4. **Run Lighthouse audit** via Playwright: Navigate to each page and collect scores for performance, accessibility, best practices, and SEO categories. Average scores across all pages.

5. **Save results** to `.boardclaude/validation/accessibility.json` in the output format below.

6. **Feed results to agents**: Format the accessibility report as structured context and make it available to the Lydia agent (code quality / patterns) and the Ado agent (documentation / integration) for their next evaluation cycle.

## Output Format

```json
{
  "timestamp": "<ISO 8601>",
  "pages_audited": ["/", "/audit/latest", "/dashboard"],
  "lighthouse": {
    "performance": null,
    "accessibility": null,
    "best_practices": null,
    "seo": null
  },
  "axe_violations": [],
  "color_contrast": { "pass": 0, "fail": 0, "details": [] },
  "keyboard_nav": { "pass": true, "issues": [] },
  "responsive": {
    "1440": { "pass": true, "issues": [] },
    "768": { "pass": true, "issues": [] },
    "375": { "pass": true, "issues": [] }
  },
  "screenshots": []
}
```

## Error Handling

- **Playwright MCP unavailable**: Skip all visual testing (screenshots, keyboard nav, responsive checks). Note `"playwright_available": false` in the report. Fall back to static analysis of component source files for accessibility patterns (e.g., missing alt text, missing aria labels).
- **Dev server won't start**: Skip Lighthouse and all browser-based checks. Use static analysis only. Note `"dev_server": false` in the report.
- **Dashboard not built yet**: Report `"dashboard_status": "not_available"` and exit gracefully with a skeleton report. This is expected during early hackathon days.
- **axe-core CDN unreachable**: Bundle a local copy as fallback. If both fail, skip axe audit and note in report.
- **Page navigation fails**: Record the page as `"status": "error"` in the report and continue with remaining pages. Do not abort the entire audit for a single page failure.
