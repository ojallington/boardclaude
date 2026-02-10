import type { AgentEvaluation, Verdict, SynthesisReport, Grade } from "./types";

// ─── Validation Errors ───────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  data: T | null;
  errors: ValidationError[];
}

// ─── Agent Evaluation Validator ──────────────────────────────────────

const VALID_VERDICTS: Verdict[] = ["STRONG_PASS", "PASS", "MARGINAL", "FAIL"];

const VALID_GRADES: Grade[] = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D",
  "F",
];

export function validateAgentEvaluation(
  data: unknown,
): ValidationResult<AgentEvaluation> {
  const errors: ValidationError[] = [];

  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data as Record<string, unknown>;

  // Required string fields
  if (typeof obj.agent !== "string" || obj.agent.length === 0) {
    errors.push({ field: "agent", message: "Must be a non-empty string" });
  }

  if (typeof obj.one_line !== "string" || obj.one_line.length === 0) {
    errors.push({ field: "one_line", message: "Must be a non-empty string" });
  }

  // Scores
  if (typeof obj.scores !== "object" || obj.scores === null) {
    errors.push({ field: "scores", message: "Must be an object" });
  } else {
    const scores = obj.scores as Record<string, unknown>;
    for (const [key, value] of Object.entries(scores)) {
      if (typeof value !== "number" || value < 0 || value > 100) {
        errors.push({
          field: `scores.${key}`,
          message: `Must be a number between 0 and 100, got ${value}`,
        });
      }
    }
  }

  // Composite
  if (
    typeof obj.composite !== "number" ||
    obj.composite < 0 ||
    obj.composite > 100
  ) {
    errors.push({
      field: "composite",
      message: "Must be a number between 0 and 100",
    });
  }

  // Strengths & weaknesses (arrays of 3 strings)
  for (const field of ["strengths", "weaknesses"] as const) {
    if (!Array.isArray(obj[field])) {
      errors.push({ field, message: "Must be an array" });
    } else if (obj[field].length !== 3) {
      errors.push({
        field,
        message: `Must have exactly 3 items, got ${obj[field].length}`,
      });
    } else {
      for (let i = 0; i < obj[field].length; i++) {
        if (typeof obj[field][i] !== "string") {
          errors.push({ field: `${field}[${i}]`, message: "Must be a string" });
        }
      }
    }
  }

  // Critical issues (array of strings, can be empty)
  if (!Array.isArray(obj.critical_issues)) {
    errors.push({
      field: "critical_issues",
      message: "Must be an array",
    });
  }

  // Action items
  if (!Array.isArray(obj.action_items)) {
    errors.push({ field: "action_items", message: "Must be an array" });
  } else {
    for (let i = 0; i < obj.action_items.length; i++) {
      const item = obj.action_items[i] as Record<string, unknown>;
      if (typeof item.priority !== "number") {
        errors.push({
          field: `action_items[${i}].priority`,
          message: "Must be a number",
        });
      }
      if (typeof item.action !== "string") {
        errors.push({
          field: `action_items[${i}].action`,
          message: "Must be a string",
        });
      }
      if (typeof item.impact !== "string") {
        errors.push({
          field: `action_items[${i}].impact`,
          message: "Must be a string",
        });
      }
    }
  }

  // Verdict
  if (!VALID_VERDICTS.includes(obj.verdict as Verdict)) {
    errors.push({
      field: "verdict",
      message: `Must be one of: ${VALID_VERDICTS.join(", ")}`,
    });
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? (data as AgentEvaluation) : null,
    errors,
  };
}

// ─── Synthesis Report Validator ──────────────────────────────────────

export function validateSynthesisReport(
  data: unknown,
): ValidationResult<SynthesisReport> {
  const errors: ValidationError[] = [];

  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data as Record<string, unknown>;

  // Required string fields
  for (const field of ["audit_id", "panel", "target", "timestamp"] as const) {
    if (typeof obj[field] !== "string" || (obj[field] as string).length === 0) {
      errors.push({ field, message: "Must be a non-empty string" });
    }
  }

  // Iteration
  if (typeof obj.iteration !== "number" || obj.iteration < 0) {
    errors.push({
      field: "iteration",
      message: "Must be a non-negative number",
    });
  }

  // Agents array
  if (!Array.isArray(obj.agents)) {
    errors.push({ field: "agents", message: "Must be an array" });
  } else if (obj.agents.length === 0) {
    errors.push({ field: "agents", message: "Must have at least one agent" });
  }

  // Composite
  if (typeof obj.composite !== "object" || obj.composite === null) {
    errors.push({ field: "composite", message: "Must be an object" });
  } else {
    const comp = obj.composite as Record<string, unknown>;
    if (typeof comp.score !== "number" || comp.score < 0 || comp.score > 100) {
      errors.push({
        field: "composite.score",
        message: "Must be a number between 0 and 100",
      });
    }
    if (!VALID_GRADES.includes(comp.grade as Grade)) {
      errors.push({
        field: "composite.grade",
        message: `Must be one of: ${VALID_GRADES.join(", ")}`,
      });
    }
    if (!VALID_VERDICTS.includes(comp.verdict as Verdict)) {
      errors.push({
        field: "composite.verdict",
        message: `Must be one of: ${VALID_VERDICTS.join(", ")}`,
      });
    }
    if (typeof comp.radar !== "object" || comp.radar === null) {
      errors.push({ field: "composite.radar", message: "Must be an object" });
    }
  }

  // Highlights
  if (typeof obj.highlights !== "object" || obj.highlights === null) {
    errors.push({ field: "highlights", message: "Must be an object" });
  }

  // Action items
  if (!Array.isArray(obj.action_items)) {
    errors.push({ field: "action_items", message: "Must be an array" });
  }

  // Iteration delta
  if (typeof obj.iteration_delta !== "object" || obj.iteration_delta === null) {
    errors.push({
      field: "iteration_delta",
      message: "Must be an object",
    });
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? (data as SynthesisReport) : null,
    errors,
  };
}

// ─── JSON Parse with Validation ──────────────────────────────────────

export function parseAgentEvaluation(
  raw: string,
): ValidationResult<AgentEvaluation> {
  try {
    const data = JSON.parse(raw);
    return validateAgentEvaluation(data);
  } catch (e) {
    return {
      valid: false,
      data: null,
      errors: [
        {
          field: "root",
          message: `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`,
        },
      ],
    };
  }
}

export function parseSynthesisReport(
  raw: string,
): ValidationResult<SynthesisReport> {
  try {
    const data = JSON.parse(raw);
    return validateSynthesisReport(data);
  } catch (e) {
    return {
      valid: false,
      data: null,
      errors: [
        {
          field: "root",
          message: `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`,
        },
      ],
    };
  }
}
