// BoardClaude Canonical TypeScript Interfaces
// Source: prep-kit/context/architecture/schemas.md

// ─── Verdicts & Grades ───────────────────────────────────────────────

/** Overall pass/fail outcome of an agent or composite evaluation. */
export type Verdict = "STRONG_PASS" | "PASS" | "MARGINAL" | "FAIL";

/** Letter grade mapped from a numeric composite score (0-100). */
export type Grade =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D"
  | "F";

/** Lifecycle status of an action item in the persistent ledger. */
export type ActionItemStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "wont_fix"
  | "chronic"
  | "blocked";

/** Claude model tier assigned to an agent. `"inherit"` uses the panel default. */
export type AgentModel = "opus" | "sonnet" | "haiku" | "inherit";

/** Estimated implementation effort for an action item or agent evaluation depth. */
export type EffortLevel = "low" | "medium" | "high" | "max";

// ─── Panel Configuration ─────────────────────────────────────────────

/**
 * A single evaluation criterion within a panel agent's scoring rubric.
 *
 * @example
 * ```json
 * { "name": "architecture", "weight": 0.3, "description": "System design quality" }
 * ```
 */
export interface PanelCriterion {
  name: string;
  weight: number;
  description?: string;
}

/**
 * An individual agent within a panel, including its persona, scoring weight, and evaluation criteria.
 *
 * Agent weights across a panel must sum to 1.0. The `prompt_file` points to
 * the agent's persona markdown (e.g., `agents/boris.md`).
 */
export interface PanelAgent {
  name: string;
  role: string;
  weight: number;
  model?: AgentModel;
  effort?: EffortLevel;
  veto_power?: boolean;
  prompt_file: string;
  criteria: PanelCriterion[];
}

/**
 * Scoring parameters for a panel: the numeric scale, minimum passing score,
 * and the target score that signals the project is "done".
 *
 * @example
 * ```json
 * { "scale": 100, "passing_threshold": 70, "iteration_target": 85 }
 * ```
 */
export interface PanelScoring {
  scale: number;
  passing_threshold: number;
  iteration_target: number;
}

/**
 * Configuration for the optional inter-agent debate phase, where agents
 * challenge each other's scores before synthesis.
 *
 * @example
 * ```json
 * { "rounds": 2, "format": "parallel", "verdict_options": ["STRONG_PASS", "PASS", "MARGINAL", "FAIL"], "final_output": "synthesis" }
 * ```
 */
export interface PanelDebate {
  rounds: number;
  format: "sequential" | "parallel";
  verdict_options: string[];
  final_output: string;
}

/**
 * Contextual guidance that shapes how a panel evaluates its target, including
 * project goals, known constraints, recurring patterns, and exit criteria.
 */
export interface PanelContext {
  goals: string[];
  constraints: string[];
  patterns: {
    strengths: string[];
    weaknesses: string[];
    triggers: string[];
  };
  definition_of_done: string[];
}

/**
 * Top-level configuration for an evaluation panel, loaded from a YAML file in `panels/`.
 *
 * Defines the agent roster, scoring parameters, optional debate rules, and
 * contextual information that shapes how the panel evaluates a target.
 *
 * @example
 * ```json
 * {
 *   "name": "hackathon-judges",
 *   "type": "professional",
 *   "version": "1.0.0",
 *   "description": "Six-judge hackathon evaluation panel",
 *   "agents": [{ "name": "boris", "role": "Tech Lead", "weight": 0.2, "prompt_file": "agents/boris.md", "criteria": [] }],
 *   "scoring": { "scale": 100, "passing_threshold": 70, "iteration_target": 85 }
 * }
 * ```
 */
export interface PanelConfig {
  name: string;
  type: "professional" | "personal";
  version: string;
  description: string;
  context?: PanelContext;
  agents: PanelAgent[];
  debate?: PanelDebate;
  scoring: PanelScoring;
}

// ─── Agent Evaluation (Per-Agent Output) ─────────────────────────────

/**
 * A single prioritized recommendation from an agent's evaluation.
 *
 * @example
 * ```json
 * { "priority": 1, "action": "Add unit tests for auth module", "impact": "Prevents regression in critical path" }
 * ```
 */
export interface AgentActionItem {
  priority: number;
  action: string;
  impact: string;
}

/**
 * Output from a single agent's evaluation of the target project.
 *
 * Contains per-criterion scores, a composite score, exactly three strengths
 * and weaknesses, and prioritized action items. Used as input to synthesis.
 *
 * @example
 * ```json
 * {
 *   "agent": "boris",
 *   "scores": { "architecture": 82, "code_quality": 78 },
 *   "composite": 80,
 *   "strengths": ["Clean module boundaries", "Good error handling", "Typed API layer"],
 *   "weaknesses": ["Missing tests", "No CI pipeline", "Inconsistent naming"],
 *   "critical_issues": [],
 *   "action_items": [{ "priority": 1, "action": "Add unit tests", "impact": "Prevents regressions" }],
 *   "verdict": "PASS",
 *   "one_line": "Solid architecture with testing gaps"
 * }
 * ```
 */
export interface AgentEvaluation {
  agent: string;
  scores: Record<string, number>;
  composite: number;
  strengths: [string, string, string];
  weaknesses: [string, string, string];
  critical_issues: string[];
  action_items: AgentActionItem[];
  verdict: Verdict;
  one_line: string;
}

// ─── Synthesis Output (Full Audit Report) ────────────────────────────

/**
 * Six-axis radar chart data representing the project's score breakdown
 * across architecture, product, innovation, code quality, documentation, and integration.
 *
 * @example
 * ```json
 * { "architecture": 85, "product": 78, "innovation": 80, "code_quality": 82, "documentation": 75, "integration": 83 }
 * ```
 */
export interface RadarData {
  architecture: number;
  product: number;
  innovation: number;
  code_quality: number;
  documentation: number;
  integration: number;
}

/**
 * Weighted composite score combining all agent evaluations into a single
 * numeric score, letter grade, pass/fail verdict, and six-axis radar breakdown.
 */
export interface CompositeScore {
  score: number;
  radar: RadarData;
  grade: Grade;
  verdict: Verdict;
}

/**
 * Divergent opinion with named agent positions and analysis.
 *
 * @example
 * ```json
 * {
 *   "topic": "Test coverage necessity",
 *   "agent_a": { "agent": "boris", "position": "Unit tests are essential" },
 *   "agent_b": { "agent": "jason", "position": "Integration tests suffice" },
 *   "analysis": "Both agents agree testing matters but disagree on granularity"
 * }
 * ```
 */
export interface DivergentOpinionV1 {
  topic: string;
  agent_a: { agent: string; position: string };
  agent_b: { agent: string; position: string };
  analysis: string;
}

/**
 * Divergent opinion with agent list, numeric delta, and summary.
 * Used by some audit iterations (e.g., iter 9-10).
 *
 * @example
 * ```json
 * {
 *   "topic": "AI system maturity",
 *   "agents": ["thariq", "lydia"],
 *   "delta": 13.6,
 *   "summary": "Thariq scores 74.35; Lydia scores 87.95..."
 * }
 * ```
 */
export interface DivergentOpinionV2 {
  topic: string;
  agents: string[];
  delta: number;
  summary: string;
}

/** Discriminated union of both divergent opinion schemas. */
export type DivergentOpinion = DivergentOpinionV1 | DivergentOpinionV2;

/**
 * Aggregated highlights from synthesis: the most impactful strengths, weaknesses,
 * and points of disagreement between agents.
 */
export interface Highlights {
  top_strengths: string[];
  top_weaknesses: string[];
  divergent_opinions: DivergentOpinion[];
}

/**
 * A prioritized action item produced during synthesis, merging overlapping
 * recommendations from multiple agents into a single deduplicated entry.
 */
export interface SynthesisActionItem {
  priority: number;
  action: string;
  source_agents: string[];
  impact: string;
  effort: EffortLevel;
}

/**
 * Score change between the current and previous audit iteration, including
 * specific improvements and regressions. `null` values indicate the first iteration.
 *
 * @example
 * ```json
 * { "previous_score": 74, "current_score": 81, "delta": 7, "improvements": ["Added unit tests"], "regressions": [] }
 * ```
 */
export interface IterationDelta {
  previous_score: number | null;
  current_score: number;
  delta: number | null;
  improvements: string[];
  regressions: string[];
}

/**
 * The complete output of a `/bc:audit` run, combining all agent evaluations
 * into a single report with composite scoring, highlights, and action items.
 *
 * This is the canonical audit format stored in `.boardclaude/audits/` and
 * consumed by the dashboard. Agent entries omit `action_items` and `one_line`
 * because those are merged into the top-level `action_items` array.
 *
 * @example
 * ```json
 * {
 *   "audit_id": "audit-20260212-143000",
 *   "panel": "hackathon-judges",
 *   "target": "dashboard/",
 *   "iteration": 3,
 *   "timestamp": "2026-02-12T14:30:00.000Z",
 *   "agents": [{ "agent": "boris", "scores": { "architecture": 85 }, "composite": 82, "strengths": ["...", "...", "..."], "weaknesses": ["...", "...", "..."], "critical_issues": [], "verdict": "PASS" }],
 *   "composite": { "score": 81, "radar": { "architecture": 85, "product": 78, "innovation": 80, "code_quality": 82, "documentation": 75, "integration": 83 }, "grade": "B+", "verdict": "PASS" },
 *   "highlights": { "top_strengths": [], "top_weaknesses": [], "divergent_opinions": [] },
 *   "action_items": [],
 *   "iteration_delta": { "previous_score": 74, "current_score": 81, "delta": 7, "improvements": [], "regressions": [] }
 * }
 * ```
 */
export interface SynthesisReport {
  audit_id: string;
  panel: string;
  target: string;
  iteration: number;
  timestamp: string;
  agents: Omit<AgentEvaluation, "action_items" | "one_line">[];
  composite: CompositeScore;
  highlights: Highlights;
  action_items: SynthesisActionItem[];
  iteration_delta: IterationDelta;
}

// ─── Audit Summary (for listing) ────────────────────────────────────

/**
 * Lightweight summary of an audit used for listing and navigation,
 * containing only the composite score without full agent details.
 *
 * @example
 * ```json
 * { "audit_id": "audit-20260212-143000", "timestamp": "2026-02-12T14:30:00Z", "panel": "hackathon-judges", "iteration": 3, "composite": { "score": 81, "grade": "B+", "verdict": "PASS" } }
 * ```
 */
export interface AuditSummary {
  audit_id: string;
  timestamp: string;
  panel: string;
  iteration: number;
  composite: { score: number; grade: Grade; verdict: Verdict };
}

// ─── Project State ───────────────────────────────────────────────────

/**
 * A single data point in the project's score history, used to render
 * the score progression chart on the dashboard.
 */
export interface ScoreHistoryEntry {
  audit_id: string;
  iteration: number;
  score: number;
  grade: Grade;
  verdict: Verdict;
  timestamp: string;
}

/**
 * Top-level state for a BoardClaude-managed project, stored in `.boardclaude/state.json`.
 * Tracks the active panel, current branch, audit history, and worktree branches.
 *
 * @example
 * ```json
 * {
 *   "project": "boardclaude",
 *   "panel": "hackathon-judges",
 *   "branch": "main",
 *   "audit_count": 3,
 *   "latest_audit": "audit-20260212-143000",
 *   "latest_score": 81,
 *   "score_history": [],
 *   "worktrees": [],
 *   "status": "idle"
 * }
 * ```
 */
export interface ProjectState {
  project: string;
  panel: string;
  branch: string;
  audit_count: number;
  latest_audit: string | null;
  latest_score: number | null;
  score_history: ScoreHistoryEntry[];
  worktrees: string[];
  status: "idle" | "active" | "auditing";
}

// ─── Timeline ────────────────────────────────────────────────────────

/** Base fields shared by all timeline event types. */
export interface TimelineEventBase {
  id: string;
  type: "audit" | "fork" | "merge" | "rollback";
  timestamp: string;
  parent: string | null;
  status: "completed" | "in-progress";
}

/** Timeline event recording an audit run, including per-agent scores and a link to the full audit file. */
export interface AuditTimelineEvent extends TimelineEventBase {
  type: "audit";
  branch: string;
  panel: string;
  composite_score: number;
  agent_scores: Record<string, number>;
  audit_file: string;
}

/** Timeline event recording a `/bc:fork` that created strategy worktree branches. */
export interface ForkTimelineEvent extends TimelineEventBase {
  type: "fork";
  branch: string;
  new_branches: string[];
  reason: string;
}

/** Timeline event recording a `/bc:merge` that integrated the winning branch and archived losers. */
export interface MergeTimelineEvent extends TimelineEventBase {
  type: "merge";
  winning_branch: string;
  losing_branches: string[];
  reason: string;
}

/** Timeline event recording a rollback to a previous audit state. */
export interface RollbackTimelineEvent extends TimelineEventBase {
  type: "rollback";
  branch: string;
  target_audit_id: string;
  reason: string;
}

/** Discriminated union of all timeline event types, keyed by the `type` field. */
export type TimelineEvent =
  | AuditTimelineEvent
  | ForkTimelineEvent
  | MergeTimelineEvent
  | RollbackTimelineEvent;

/** Container for the full project timeline, stored in `.boardclaude/timeline.json`. */
export interface Timeline {
  events: TimelineEvent[];
}

// ─── Timeline Display (matches actual timeline.json shape) ──────────

/**
 * Simplified timeline event shape matching the actual `timeline.json` format,
 * optimized for rendering in the dashboard timeline view.
 */
export interface TimelineDisplayEvent {
  id: string;
  type: "audit";
  timestamp: string;
  branch: string;
  composite: number;
  iteration: number;
  panel: string;
  agents: number;
  verdict: string;
  description: string;
}

/** Container for the display-optimized timeline events array. */
export interface TimelineDisplay {
  events: TimelineDisplayEvent[];
}

// ─── Action Items Ledger ─────────────────────────────────────────────

/**
 * A tracked action item in the persistent ledger, created from audit findings
 * and updated across iterations. Items that remain unresolved for multiple
 * iterations are flagged as `"chronic"`.
 */
export interface ActionItem {
  id: string;
  source_audit: string;
  source_agent: string;
  action: string;
  file_refs: string[];
  priority: number;
  effort: EffortLevel;
  status: ActionItemStatus;
  resolved_in_audit: string | null;
  iterations_open: number;
  created_at: string;
  updated_at: string;
}

/**
 * Persistent ledger of all action items across audit iterations,
 * stored in `.boardclaude/action-items.json` with summary metadata.
 */
export interface ActionItemsLedger {
  items: ActionItem[];
  metadata: {
    total_items: number;
    open: number;
    resolved: number;
    chronic: number;
  };
}

// ─── Validation Results ──────────────────────────────────────────────

/** TypeScript compiler check results from the validation runner. */
export interface ValidationTypeScript {
  skipped: boolean;
  errors: number;
  warnings: number;
  details: Array<{
    file: string;
    line: number;
    code?: string;
    message: string;
  }>;
}

/** Test suite execution results, including pass/fail counts and optional coverage percentage. */
export interface ValidationTests {
  skipped: boolean;
  total: number;
  passed: number;
  failed: number;
  coverage: number | null;
  failing_tests?: string[];
}

/** ESLint analysis results from the validation runner. */
export interface ValidationLint {
  skipped: boolean;
  errors: number;
  warnings: number;
  details: Array<{
    file: string;
    line: number;
    rule: string;
    severity: "error" | "warning";
  }>;
}

/** Prettier formatting compliance results from the validation runner. */
export interface ValidationFormat {
  skipped: boolean;
  compliant_pct: number;
  files_checked?: number;
  files_failing?: number;
}

/** Lighthouse audit scores (0-100) for performance, accessibility, best practices, and SEO. */
export interface ValidationLighthouse {
  performance: number | null;
  accessibility: number | null;
  best_practices: number | null;
  seo: number | null;
}

/** Change in validation metrics between the current and previous validation run. */
export interface ValidationDelta {
  previous_timestamp: string | null;
  typescript_errors: number;
  tests_passed: number;
  tests_failed: number;
  lint_errors: number;
  lint_warnings: number;
  format_compliant_pct: number;
}

/**
 * Complete validation runner output combining TypeScript, test, lint, format,
 * and Lighthouse results with an optional delta from the previous run.
 *
 * Stored in `.boardclaude/validation.json` and provided to agents as context.
 */
export interface ValidationResult {
  timestamp: string;
  stack: {
    framework: string;
    language: string;
    test_runner?: string;
    linter?: string;
    formatter?: string;
  };
  typescript: ValidationTypeScript;
  tests: ValidationTests;
  lint: ValidationLint;
  format: ValidationFormat;
  lighthouse: ValidationLighthouse;
  delta?: ValidationDelta;
  summary: string;
}

// ─── Try-It-Now Types ───────────────────────────────────────────

/** GitHub repository metadata fetched for the "Try It Now" web evaluation flow. */
export interface TryRepoMeta {
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
}

/**
 * Single-agent "Try It Now" evaluation result for the legacy single-agent flow.
 * Includes full scores, radar data, and repository metadata.
 */
export interface TryResult {
  repo: TryRepoMeta;
  agent: string;
  scores: Record<string, number>;
  composite: number;
  grade: Grade;
  verdict: Verdict;
  strengths: [string, string, string];
  weaknesses: [string, string, string];
  critical_issues: string[];
  action_items: AgentActionItem[];
  one_line: string;
  radar: RadarData;
  files_analyzed: number;
  timestamp: string;
  model_used: string;
}

/** Streaming phase for the single-agent "Try It Now" flow. */
export type TryStreamPhase =
  | "idle"
  | "validating"
  | "fetching"
  | "reviewing"
  | "complete"
  | "error";

// ─── Try Panel (Full 6-Agent) Types ─────────────────────────────────────

/**
 * Result from a single agent in the web "Try It Now" pipeline.
 *
 * Similar to {@link AgentEvaluation} but includes `role` and `model_used`
 * metadata for display in the web UI.
 */
export interface TryAgentResult {
  agent: string;
  role: string;
  scores: Record<string, number>;
  composite: number;
  grade: Grade;
  verdict: Verdict;
  strengths: [string, string, string];
  weaknesses: [string, string, string];
  critical_issues: string[];
  action_items: AgentActionItem[];
  one_line: string;
  model_used: string;
}

/** Metadata for a file included in a "Try It Now" evaluation, with its size and priority category. */
export interface FileDetail {
  path: string;
  size: number;
  category: "priority" | "source";
}

/**
 * Full panel result from the web "Try It Now" pipeline, analogous to
 * {@link SynthesisReport} but scoped to the web evaluation flow.
 *
 * Includes all agent results, composite score, highlights, and repo metadata.
 * The `tier` field indicates whether the evaluation used the free tier or
 * a user-provided API key (`"byok"`).
 */
export interface TryPanelResult {
  audit_id: string;
  repo: TryRepoMeta;
  panel: "web-judges";
  timestamp: string;
  agents: TryAgentResult[];
  composite: CompositeScore;
  highlights: Highlights;
  action_items: SynthesisActionItem[];
  files_analyzed: number;
  files_detail?: FileDetail[];
  tier: "free" | "byok";
  metrics?: import("@/lib/try-metrics").AuditMetrics;
  debate?: {
    triggered: boolean;
    transcript?: Array<{
      agent_a: string;
      agent_b: string;
      topic: string;
      exchange: string[];
    }>;
    revisions?: ScoreRevision[];
  };
}

/** Streaming phase for the full 6-agent "Try It Now" panel flow. */
export type TryPanelStreamPhase =
  | "idle"
  | "validating"
  | "fetching"
  | "reviewing"
  | "debating"
  | "synthesizing"
  | "complete"
  | "error";

/** Real-time progress tracker for an individual agent during a "Try It Now" panel evaluation. */
export interface TryAgentProgress {
  agent: string;
  status: "pending" | "running" | "complete" | "error";
  result?: TryAgentResult;
  /** Number of tool calls made (only for tool-enabled agents like Boris). */
  toolUseCount?: number;
}

/** Lightweight summary of a "Try It Now" result for listing in recent evaluations. */
export interface TryResultSummary {
  audit_id: string;
  repo: { owner: string; name: string };
  composite: { score: number; grade: Grade; verdict: Verdict };
  tier: "free" | "byok";
  timestamp: string;
}

// ─── Debate Types (Web Pipeline) ─────────────────────────────────────

/** A single score adjustment made by an agent after a debate exchange. */
export interface ScoreRevision {
  agent: string;
  criterion: string;
  original: number;
  revised: number;
  delta: number;
}

/**
 * A single debate exchange between two agents who disagreed on scoring,
 * including their arguments and any resulting score revisions.
 */
export interface DebateExchange {
  agent_a: string;
  agent_b: string;
  criterion_a: string;
  criterion_b: string;
  score_a: number;
  score_b: number;
  response_a: string;
  response_b: string;
  revisions: ScoreRevision[];
}

/**
 * Complete result of the inter-agent debate phase, including all exchanges,
 * aggregated score revisions, and a human-readable transcript.
 */
export interface DebateResult {
  exchanges: DebateExchange[];
  revisions: ScoreRevision[];
  transcript: string;
  pairs_debated: number;
  scores_revised: number;
}

// ─── SSE Types ──────────────────────────────────────────────────────

/** Callback for sending Server-Sent Events during "Try It Now" evaluation pipeline. */
export type SSESender = (event: string, data: unknown) => Promise<void>;

// ─── Design System Constants ─────────────────────────────────────────

/** Hex color values for each agent, used consistently across the dashboard UI. */
export const AGENT_COLORS = {
  boris: "#3b82f6",
  cat: "#8b5cf6",
  thariq: "#06b6d4",
  lydia: "#f59e0b",
  ado: "#10b981",
  jason: "#ef4444",
  synthesis: "#6366f1",
} as const satisfies Record<string, string>;

/** Valid agent name keys for the {@link AGENT_COLORS} map. */
export type AgentColorKey = keyof typeof AGENT_COLORS;

/** Get agent color by name, with fallback for unknown agents */
export function getAgentColor(agent: string): string {
  if (agent in AGENT_COLORS) {
    return AGENT_COLORS[agent as AgentColorKey];
  }
  return "#6b7280";
}

/** Convert a numeric score (0-100) to a letter grade. */
export function getGrade(score: number): Grade {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D";
  return "F";
}

/** Convert a numeric score (0-100) to a pass/fail verdict. */
export function getVerdict(score: number): Verdict {
  if (score >= 85) return "STRONG_PASS";
  if (score >= 70) return "PASS";
  if (score >= 55) return "MARGINAL";
  return "FAIL";
}
