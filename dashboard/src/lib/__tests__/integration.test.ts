import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { parseSynthesisReport } from "../validate";

/**
 * Integration test: reads real audit JSON from data/audits/,
 * runs it through parseSynthesisReport (the same validator used
 * by getAudit() in audit-loader.ts), and asserts key content.
 *
 * This covers the full data path: raw JSON -> validation -> typed output.
 */

const DATA_DIR = path.join(__dirname, "..", "..", "..", "data", "audits");

describe("audit data pipeline integration", () => {
  it("parses a real audit JSON through the full validation pipeline", async () => {
    const files = await fs.readdir(DATA_DIR);
    const auditFiles = files.filter((f) => f.endsWith(".json")).sort();
    expect(auditFiles.length).toBeGreaterThan(0);

    // Use the most recent committed audit
    const latestFile = auditFiles[auditFiles.length - 1]!;
    const raw = await fs.readFile(path.join(DATA_DIR, latestFile), "utf-8");

    const result = parseSynthesisReport(raw);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data).not.toBeNull();

    const report = result.data!;

    // Core structure
    expect(report.audit_id).toBeTruthy();
    expect(report.panel).toBeTruthy();
    expect(report.timestamp).toBeTruthy();
    expect(typeof report.iteration).toBe("number");

    // Agents array
    expect(report.agents.length).toBeGreaterThanOrEqual(1);
    for (const agent of report.agents) {
      expect(agent.agent).toBeTruthy();
      expect(typeof agent.composite).toBe("number");
      expect(agent.composite).toBeGreaterThanOrEqual(0);
      expect(agent.composite).toBeLessThanOrEqual(100);
      expect(["STRONG_PASS", "PASS", "MARGINAL", "FAIL"]).toContain(
        agent.verdict,
      );
      expect(agent.strengths.length).toBeGreaterThanOrEqual(1);
    }

    // Composite
    expect(typeof report.composite.score).toBe("number");
    expect(report.composite.score).toBeGreaterThanOrEqual(0);
    expect(report.composite.score).toBeLessThanOrEqual(100);
    expect(report.composite.grade).toBeTruthy();
    expect(["STRONG_PASS", "PASS", "MARGINAL", "FAIL"]).toContain(
      report.composite.verdict,
    );

    // Radar data
    expect(typeof report.composite.radar.architecture).toBe("number");
    expect(typeof report.composite.radar.product).toBe("number");
    expect(typeof report.composite.radar.innovation).toBe("number");
    expect(typeof report.composite.radar.code_quality).toBe("number");
    expect(typeof report.composite.radar.documentation).toBe("number");
    expect(typeof report.composite.radar.integration).toBe("number");

    // Highlights
    expect(report.highlights.top_strengths.length).toBeGreaterThanOrEqual(1);
    expect(report.highlights.top_weaknesses.length).toBeGreaterThanOrEqual(1);

    // Action items
    expect(report.action_items.length).toBeGreaterThanOrEqual(1);
    for (const item of report.action_items) {
      expect(typeof item.priority).toBe("number");
      expect(item.action).toBeTruthy();
    }
  });

  it("validates all committed audit files without errors", async () => {
    const files = await fs.readdir(DATA_DIR);
    const auditFiles = files.filter((f) => f.endsWith(".json")).sort();

    for (const file of auditFiles) {
      const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
      const result = parseSynthesisReport(raw);
      expect(
        result.valid,
        `${file} failed validation: ${result.errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
      ).toBe(true);
    }
  });
});
