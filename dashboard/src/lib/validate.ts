import type {
  AgentEvaluation,
  Verdict,
  SynthesisReport,
  Grade,
  ProjectState,
  Timeline,
  ActionItemsLedger,
  TryPanelResult,
  TryResult,
} from "./types";
import { isRecord } from "@/lib/type-guards";

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

// Type guard functions to avoid unsafe type assertions
function isVerdict(value: unknown): value is Verdict {
  return (
    typeof value === "string" &&
    (VALID_VERDICTS as readonly string[]).includes(value)
  );
}

function isGrade(value: unknown): value is Grade {
  return (
    typeof value === "string" &&
    (VALID_GRADES as readonly string[]).includes(value)
  );
}

export function validateAgentEvaluation(
  data: unknown,
): ValidationResult<AgentEvaluation> {
  const raw = data;
  const errors: ValidationError[] = [];

  if (!isRecord(data)) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data;

  // Required string fields
  if (typeof obj.agent !== "string" || obj.agent.length === 0) {
    errors.push({ field: "agent", message: "Must be a non-empty string" });
  }

  if (typeof obj.one_line !== "string" || obj.one_line.length === 0) {
    errors.push({ field: "one_line", message: "Must be a non-empty string" });
  }

  // Scores
  if (!isRecord(obj.scores)) {
    errors.push({ field: "scores", message: "Must be an object" });
  } else {
    for (const [key, value] of Object.entries(obj.scores)) {
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
      const rawItem: unknown = obj.action_items[i];
      if (!isRecord(rawItem)) {
        errors.push({
          field: `action_items[${i}]`,
          message: "Must be an object",
        });
        continue;
      }
      if (typeof rawItem.priority !== "number") {
        errors.push({
          field: `action_items[${i}].priority`,
          message: "Must be a number",
        });
      }
      if (typeof rawItem.action !== "string") {
        errors.push({
          field: `action_items[${i}].action`,
          message: "Must be a string",
        });
      }
      if (typeof rawItem.impact !== "string") {
        errors.push({
          field: `action_items[${i}].impact`,
          message: "Must be a string",
        });
      }
    }
  }

  // Verdict
  if (!isVerdict(obj.verdict)) {
    errors.push({
      field: "verdict",
      message: `Must be one of: ${VALID_VERDICTS.join(", ")}`,
    });
  }

  return {
    valid: errors.length === 0,
    // Safe cast: all fields validated above, TypeScript can't infer structural match
    data: errors.length === 0 ? (raw as AgentEvaluation) : null,
    errors,
  };
}

// ─── Synthesis Report Validator ──────────────────────────────────────

export function validateSynthesisReport(
  data: unknown,
): ValidationResult<SynthesisReport> {
  const raw = data;
  const errors: ValidationError[] = [];

  if (!isRecord(data)) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data;

  // Required string fields
  for (const field of ["audit_id", "panel", "target", "timestamp"] as const) {
    const value = obj[field];
    if (typeof value !== "string" || value.length === 0) {
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

  // Agents array -- validate each entry
  if (!Array.isArray(obj.agents)) {
    errors.push({ field: "agents", message: "Must be an array" });
  } else if (obj.agents.length === 0) {
    errors.push({ field: "agents", message: "Must have at least one agent" });
  } else {
    for (let i = 0; i < obj.agents.length; i++) {
      const rawAgent: unknown = obj.agents[i];
      if (!isRecord(rawAgent)) {
        errors.push({
          field: `agents[${i}]`,
          message: "Must be an object",
        });
        continue;
      }
      if (typeof rawAgent.agent !== "string" || rawAgent.agent.length === 0) {
        errors.push({
          field: `agents[${i}].agent`,
          message: "Must be a non-empty string",
        });
      }
      if (!isRecord(rawAgent.scores)) {
        errors.push({
          field: `agents[${i}].scores`,
          message: "Must be an object",
        });
      } else {
        for (const [key, value] of Object.entries(rawAgent.scores)) {
          if (typeof value !== "number" || value < 0 || value > 100) {
            errors.push({
              field: `agents[${i}].scores.${key}`,
              message: `Must be a number between 0 and 100, got ${value}`,
            });
          }
        }
      }
      if (
        typeof rawAgent.composite !== "number" ||
        rawAgent.composite < 0 ||
        rawAgent.composite > 100
      ) {
        errors.push({
          field: `agents[${i}].composite`,
          message: "Must be a number between 0 and 100",
        });
      }
      if (!isVerdict(rawAgent.verdict)) {
        errors.push({
          field: `agents[${i}].verdict`,
          message: `Must be one of: ${VALID_VERDICTS.join(", ")}`,
        });
      }
    }
  }

  // Composite
  if (!isRecord(obj.composite)) {
    errors.push({ field: "composite", message: "Must be an object" });
  } else {
    const comp = obj.composite;
    if (typeof comp.score !== "number" || comp.score < 0 || comp.score > 100) {
      errors.push({
        field: "composite.score",
        message: "Must be a number between 0 and 100",
      });
    }
    if (!isGrade(comp.grade)) {
      errors.push({
        field: "composite.grade",
        message: `Must be one of: ${VALID_GRADES.join(", ")}`,
      });
    }
    if (!isVerdict(comp.verdict)) {
      errors.push({
        field: "composite.verdict",
        message: `Must be one of: ${VALID_VERDICTS.join(", ")}`,
      });
    }
    if (!isRecord(comp.radar)) {
      errors.push({ field: "composite.radar", message: "Must be an object" });
    }
  }

  // Highlights
  if (!isRecord(obj.highlights)) {
    errors.push({ field: "highlights", message: "Must be an object" });
  }

  // Action items
  if (!Array.isArray(obj.action_items)) {
    errors.push({ field: "action_items", message: "Must be an array" });
  }

  // Iteration delta
  if (!isRecord(obj.iteration_delta)) {
    errors.push({
      field: "iteration_delta",
      message: "Must be an object",
    });
  }

  return {
    valid: errors.length === 0,
    // Safe cast: all fields validated above, TypeScript can't infer structural match
    data: errors.length === 0 ? (raw as SynthesisReport) : null,
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

// ─── Project State Validator ─────────────────────────────────────────

const VALID_PROJECT_STATUSES = ["idle", "active", "auditing"] as const;

export function validateProjectState(
  data: unknown,
): ValidationResult<ProjectState> {
  const raw = data;
  const errors: ValidationError[] = [];

  if (!isRecord(data)) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data;

  for (const field of ["project", "panel", "branch"] as const) {
    if (typeof obj[field] !== "string") {
      errors.push({ field, message: "Must be a string" });
    }
  }

  if (typeof obj.audit_count !== "number" || obj.audit_count < 0) {
    errors.push({
      field: "audit_count",
      message: "Must be a non-negative number",
    });
  }

  if (!Array.isArray(obj.score_history)) {
    errors.push({ field: "score_history", message: "Must be an array" });
  }

  if (!Array.isArray(obj.worktrees)) {
    errors.push({ field: "worktrees", message: "Must be an array" });
  }

  if (
    typeof obj.status !== "string" ||
    !(VALID_PROJECT_STATUSES as readonly string[]).includes(obj.status)
  ) {
    errors.push({
      field: "status",
      message: `Must be one of: ${VALID_PROJECT_STATUSES.join(", ")}`,
    });
  }

  return {
    valid: errors.length === 0,
    // Safe cast: all fields validated above, TypeScript can't infer structural match
    data: errors.length === 0 ? (raw as ProjectState) : null,
    errors,
  };
}

export function parseProjectState(raw: string): ValidationResult<ProjectState> {
  try {
    const data = JSON.parse(raw);
    return validateProjectState(data);
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

// ─── Timeline Validator ──────────────────────────────────────────────

const VALID_EVENT_TYPES = ["audit", "fork", "merge", "rollback"] as const;

export function validateTimeline(data: unknown): ValidationResult<Timeline> {
  const raw = data;
  const errors: ValidationError[] = [];

  if (!isRecord(data)) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data;

  if (!Array.isArray(obj.events)) {
    errors.push({ field: "events", message: "Must be an array" });
  } else {
    for (let i = 0; i < obj.events.length; i++) {
      const rawEvent: unknown = obj.events[i];
      if (!isRecord(rawEvent)) {
        errors.push({ field: `events[${i}]`, message: "Must be an object" });
        continue;
      }
      if (typeof rawEvent.id !== "string") {
        errors.push({ field: `events[${i}].id`, message: "Must be a string" });
      }
      if (
        typeof rawEvent.type !== "string" ||
        !(VALID_EVENT_TYPES as readonly string[]).includes(rawEvent.type)
      ) {
        errors.push({
          field: `events[${i}].type`,
          message: `Must be one of: ${VALID_EVENT_TYPES.join(", ")}`,
        });
      }
      if (typeof rawEvent.timestamp !== "string") {
        errors.push({
          field: `events[${i}].timestamp`,
          message: "Must be a string",
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    // Safe cast: all fields validated above, TypeScript can't infer structural match
    data: errors.length === 0 ? (raw as Timeline) : null,
    errors,
  };
}

export function parseTimeline(raw: string): ValidationResult<Timeline> {
  try {
    const data = JSON.parse(raw);
    return validateTimeline(data);
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

// ─── Action Items Ledger Validator ───────────────────────────────────

export function validateActionItemsLedger(
  data: unknown,
): ValidationResult<ActionItemsLedger> {
  const raw = data;
  const errors: ValidationError[] = [];

  if (!isRecord(data)) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data;

  if (!Array.isArray(obj.items)) {
    errors.push({ field: "items", message: "Must be an array" });
  } else {
    for (let i = 0; i < obj.items.length; i++) {
      const rawItem: unknown = obj.items[i];
      if (!isRecord(rawItem)) {
        errors.push({ field: `items[${i}]`, message: "Must be an object" });
        continue;
      }
      if (typeof rawItem.id !== "string") {
        errors.push({
          field: `items[${i}].id`,
          message: "Must be a string",
        });
      }
      if (typeof rawItem.action !== "string") {
        errors.push({
          field: `items[${i}].action`,
          message: "Must be a string",
        });
      }
    }
  }

  if (!isRecord(obj.metadata)) {
    errors.push({ field: "metadata", message: "Must be an object" });
  }

  return {
    valid: errors.length === 0,
    // Safe cast: all fields validated above, TypeScript can't infer structural match
    data: errors.length === 0 ? (raw as ActionItemsLedger) : null,
    errors,
  };
}

export function parseActionItemsLedger(
  raw: string,
): ValidationResult<ActionItemsLedger> {
  try {
    const data = JSON.parse(raw);
    return validateActionItemsLedger(data);
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

// ─── TryPanelResult Validator ────────────────────────────────────────

const VALID_TIERS = ["free", "byok"] as const;

export function validateTryPanelResult(
  data: unknown,
): ValidationResult<TryPanelResult> {
  const raw = data;
  const errors: ValidationError[] = [];

  if (!isRecord(data)) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data;

  // Required string fields
  if (typeof obj.audit_id !== "string" || obj.audit_id.length === 0) {
    errors.push({ field: "audit_id", message: "Must be a non-empty string" });
  }

  if (typeof obj.timestamp !== "string" || obj.timestamp.length === 0) {
    errors.push({ field: "timestamp", message: "Must be a non-empty string" });
  }

  // Panel must be "web-judges"
  if (obj.panel !== "web-judges") {
    errors.push({ field: "panel", message: 'Must be "web-judges"' });
  }

  // Repo
  if (!isRecord(obj.repo)) {
    errors.push({ field: "repo", message: "Must be an object" });
  } else {
    if (typeof obj.repo.owner !== "string") {
      errors.push({ field: "repo.owner", message: "Must be a string" });
    }
    if (typeof obj.repo.name !== "string") {
      errors.push({ field: "repo.name", message: "Must be a string" });
    }
  }

  // Agents array
  if (!Array.isArray(obj.agents)) {
    errors.push({ field: "agents", message: "Must be an array" });
  }

  // Composite
  if (!isRecord(obj.composite)) {
    errors.push({ field: "composite", message: "Must be an object" });
  } else {
    const comp = obj.composite;
    if (typeof comp.score !== "number" || comp.score < 0 || comp.score > 100) {
      errors.push({
        field: "composite.score",
        message: "Must be a number between 0 and 100",
      });
    }
    if (!isGrade(comp.grade)) {
      errors.push({
        field: "composite.grade",
        message: `Must be one of: ${VALID_GRADES.join(", ")}`,
      });
    }
    if (!isVerdict(comp.verdict)) {
      errors.push({
        field: "composite.verdict",
        message: `Must be one of: ${VALID_VERDICTS.join(", ")}`,
      });
    }
    if (!isRecord(comp.radar)) {
      errors.push({ field: "composite.radar", message: "Must be an object" });
    }
  }

  // Highlights
  if (!isRecord(obj.highlights)) {
    errors.push({ field: "highlights", message: "Must be an object" });
  }

  // Action items
  if (!Array.isArray(obj.action_items)) {
    errors.push({ field: "action_items", message: "Must be an array" });
  }

  // files_analyzed
  if (typeof obj.files_analyzed !== "number" || obj.files_analyzed < 0) {
    errors.push({
      field: "files_analyzed",
      message: "Must be a non-negative number",
    });
  }

  // files_detail (optional)
  if (obj.files_detail !== undefined) {
    if (!Array.isArray(obj.files_detail)) {
      errors.push({
        field: "files_detail",
        message: "Must be an array if present",
      });
    } else {
      for (let i = 0; i < obj.files_detail.length; i++) {
        const fd = obj.files_detail[i];
        if (!isRecord(fd)) {
          errors.push({
            field: `files_detail[${i}]`,
            message: "Must be an object",
          });
        } else {
          if (typeof fd.path !== "string") {
            errors.push({
              field: `files_detail[${i}].path`,
              message: "Must be a string",
            });
          }
          if (typeof fd.size !== "number") {
            errors.push({
              field: `files_detail[${i}].size`,
              message: "Must be a number",
            });
          }
          if (fd.category !== "priority" && fd.category !== "source") {
            errors.push({
              field: `files_detail[${i}].category`,
              message: 'Must be "priority" or "source"',
            });
          }
        }
      }
    }
  }

  // Tier
  if (
    typeof obj.tier !== "string" ||
    !(VALID_TIERS as readonly string[]).includes(obj.tier)
  ) {
    errors.push({
      field: "tier",
      message: `Must be one of: ${VALID_TIERS.join(", ")}`,
    });
  }

  return {
    valid: errors.length === 0,
    // Safe cast: all fields validated above, TypeScript can't infer structural match
    data: errors.length === 0 ? (raw as TryPanelResult) : null,
    errors,
  };
}

export function parseTryPanelResult(
  raw: string,
): ValidationResult<TryPanelResult> {
  try {
    const data = JSON.parse(raw);
    return validateTryPanelResult(data);
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

// ─── TryResult (Single-Agent Review) Validation ──────────────────────

export function validateTryResult(data: unknown): ValidationResult<TryResult> {
  const raw = data;
  const errors: ValidationError[] = [];

  if (!isRecord(data)) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data;

  if (!isRecord(obj.repo)) {
    errors.push({ field: "repo", message: "Must be an object" });
  }

  if (typeof obj.agent !== "string") {
    errors.push({ field: "agent", message: "Must be a string" });
  }

  if (!isRecord(obj.scores)) {
    errors.push({ field: "scores", message: "Must be an object" });
  }

  if (typeof obj.composite !== "number") {
    errors.push({ field: "composite", message: "Must be a number" });
  }

  if (!isGrade(obj.grade)) {
    errors.push({
      field: "grade",
      message: `Must be one of: ${VALID_GRADES.join(", ")}`,
    });
  }

  if (!isVerdict(obj.verdict)) {
    errors.push({
      field: "verdict",
      message: `Must be one of: ${VALID_VERDICTS.join(", ")}`,
    });
  }

  if (!Array.isArray(obj.strengths)) {
    errors.push({ field: "strengths", message: "Must be an array" });
  }

  if (!Array.isArray(obj.weaknesses)) {
    errors.push({ field: "weaknesses", message: "Must be an array" });
  }

  if (typeof obj.one_line !== "string") {
    errors.push({ field: "one_line", message: "Must be a string" });
  }

  if (typeof obj.files_analyzed !== "number") {
    errors.push({ field: "files_analyzed", message: "Must be a number" });
  }

  if (typeof obj.timestamp !== "string") {
    errors.push({ field: "timestamp", message: "Must be a string" });
  }

  if (typeof obj.model_used !== "string") {
    errors.push({ field: "model_used", message: "Must be a string" });
  }

  return {
    valid: errors.length === 0,
    // Safe cast: all fields validated above, TypeScript can't infer structural match
    data: errors.length === 0 ? (raw as TryResult) : null,
    errors,
  };
}
