import type {
  AgentEvaluation,
  Verdict,
  SynthesisReport,
  Grade,
  ProjectState,
  Timeline,
  ActionItemsLedger,
} from "./types";

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

  // Agents array -- validate each entry
  if (!Array.isArray(obj.agents)) {
    errors.push({ field: "agents", message: "Must be an array" });
  } else if (obj.agents.length === 0) {
    errors.push({ field: "agents", message: "Must have at least one agent" });
  } else {
    for (let i = 0; i < obj.agents.length; i++) {
      const agent = obj.agents[i] as Record<string, unknown>;
      if (typeof agent !== "object" || agent === null) {
        errors.push({
          field: `agents[${i}]`,
          message: "Must be an object",
        });
        continue;
      }
      if (typeof agent.agent !== "string" || agent.agent.length === 0) {
        errors.push({
          field: `agents[${i}].agent`,
          message: "Must be a non-empty string",
        });
      }
      if (typeof agent.scores !== "object" || agent.scores === null) {
        errors.push({
          field: `agents[${i}].scores`,
          message: "Must be an object",
        });
      } else {
        for (const [key, value] of Object.entries(
          agent.scores as Record<string, unknown>,
        )) {
          if (typeof value !== "number" || value < 0 || value > 100) {
            errors.push({
              field: `agents[${i}].scores.${key}`,
              message: `Must be a number between 0 and 100, got ${value}`,
            });
          }
        }
      }
      if (
        typeof agent.composite !== "number" ||
        agent.composite < 0 ||
        agent.composite > 100
      ) {
        errors.push({
          field: `agents[${i}].composite`,
          message: "Must be a number between 0 and 100",
        });
      }
      if (!VALID_VERDICTS.includes(agent.verdict as Verdict)) {
        errors.push({
          field: `agents[${i}].verdict`,
          message: `Must be one of: ${VALID_VERDICTS.join(", ")}`,
        });
      }
    }
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

// ─── Project State Validator ─────────────────────────────────────────

const VALID_PROJECT_STATUSES = ["idle", "active", "auditing"] as const;

export function validateProjectState(
  data: unknown,
): ValidationResult<ProjectState> {
  const errors: ValidationError[] = [];

  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data as Record<string, unknown>;

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
    data: errors.length === 0 ? (data as ProjectState) : null,
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
  const errors: ValidationError[] = [];

  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.events)) {
    errors.push({ field: "events", message: "Must be an array" });
  } else {
    for (let i = 0; i < obj.events.length; i++) {
      const event = obj.events[i] as Record<string, unknown>;
      if (typeof event !== "object" || event === null) {
        errors.push({ field: `events[${i}]`, message: "Must be an object" });
        continue;
      }
      if (typeof event.id !== "string") {
        errors.push({ field: `events[${i}].id`, message: "Must be a string" });
      }
      if (
        typeof event.type !== "string" ||
        !(VALID_EVENT_TYPES as readonly string[]).includes(event.type)
      ) {
        errors.push({
          field: `events[${i}].type`,
          message: `Must be one of: ${VALID_EVENT_TYPES.join(", ")}`,
        });
      }
      if (typeof event.timestamp !== "string") {
        errors.push({
          field: `events[${i}].timestamp`,
          message: "Must be a string",
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? (data as Timeline) : null,
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
  const errors: ValidationError[] = [];

  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      data: null,
      errors: [{ field: "root", message: "Expected an object" }],
    };
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.items)) {
    errors.push({ field: "items", message: "Must be an array" });
  } else {
    for (let i = 0; i < obj.items.length; i++) {
      const item = obj.items[i] as Record<string, unknown>;
      if (typeof item !== "object" || item === null) {
        errors.push({ field: `items[${i}]`, message: "Must be an object" });
        continue;
      }
      if (typeof item.id !== "string") {
        errors.push({
          field: `items[${i}].id`,
          message: "Must be a string",
        });
      }
      if (typeof item.action !== "string") {
        errors.push({
          field: `items[${i}].action`,
          message: "Must be a string",
        });
      }
    }
  }

  if (typeof obj.metadata !== "object" || obj.metadata === null) {
    errors.push({ field: "metadata", message: "Must be an object" });
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? (data as ActionItemsLedger) : null,
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
