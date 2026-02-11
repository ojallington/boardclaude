// BoardClaude Canonical TypeScript Interfaces
// Source: prep-kit/context/architecture/schemas.md

// ─── Verdicts & Grades ───────────────────────────────────────────────

export type Verdict = "STRONG_PASS" | "PASS" | "MARGINAL" | "FAIL";

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

export type ActionItemStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "wont_fix"
  | "chronic"
  | "blocked";

export type AgentModel = "opus" | "sonnet" | "haiku" | "inherit";

export type EffortLevel = "low" | "medium" | "high" | "max";

// ─── Panel Configuration ─────────────────────────────────────────────

export interface PanelCriterion {
  name: string;
  weight: number;
  description?: string;
}

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

export interface PanelScoring {
  scale: number;
  passing_threshold: number;
  iteration_target: number;
}

export interface PanelDebate {
  rounds: number;
  format: "sequential" | "parallel";
  verdict_options: string[];
  final_output: string;
}

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

export interface AgentActionItem {
  priority: number;
  action: string;
  impact: string;
}

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

export interface RadarData {
  architecture: number;
  product: number;
  innovation: number;
  code_quality: number;
  documentation: number;
  integration: number;
}

export interface CompositeScore {
  score: number;
  radar: RadarData;
  grade: Grade;
  verdict: Verdict;
}

export interface DivergentOpinion {
  topic: string;
  agent_a: { agent: string; position: string };
  agent_b: { agent: string; position: string };
  analysis: string;
}

export interface Highlights {
  top_strengths: string[];
  top_weaknesses: string[];
  divergent_opinions: DivergentOpinion[];
}

export interface SynthesisActionItem {
  priority: number;
  action: string;
  source_agents: string[];
  impact: string;
  effort: EffortLevel;
}

export interface IterationDelta {
  previous_score: number | null;
  current_score: number;
  delta: number | null;
  improvements: string[];
  regressions: string[];
}

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

export interface AuditSummary {
  audit_id: string;
  timestamp: string;
  panel: string;
  iteration: number;
  composite: { score: number; grade: Grade; verdict: Verdict };
}

// ─── Project State ───────────────────────────────────────────────────

export interface ScoreHistoryEntry {
  audit_id: string;
  iteration: number;
  score: number;
  grade: Grade;
  verdict: Verdict;
  timestamp: string;
}

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

export interface TimelineEventBase {
  id: string;
  type: "audit" | "fork" | "merge" | "rollback";
  timestamp: string;
  parent: string | null;
  status: "completed" | "in-progress";
}

export interface AuditTimelineEvent extends TimelineEventBase {
  type: "audit";
  branch: string;
  panel: string;
  composite_score: number;
  agent_scores: Record<string, number>;
  audit_file: string;
}

export interface ForkTimelineEvent extends TimelineEventBase {
  type: "fork";
  branch: string;
  new_branches: string[];
  reason: string;
}

export interface MergeTimelineEvent extends TimelineEventBase {
  type: "merge";
  winning_branch: string;
  losing_branches: string[];
  reason: string;
}

export interface RollbackTimelineEvent extends TimelineEventBase {
  type: "rollback";
  branch: string;
  target_audit_id: string;
  reason: string;
}

export type TimelineEvent =
  | AuditTimelineEvent
  | ForkTimelineEvent
  | MergeTimelineEvent
  | RollbackTimelineEvent;

export interface Timeline {
  events: TimelineEvent[];
}

// ─── Timeline Display (matches actual timeline.json shape) ──────────

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

export interface TimelineDisplay {
  events: TimelineDisplayEvent[];
}

// ─── Action Items Ledger ─────────────────────────────────────────────

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

export interface ValidationTests {
  skipped: boolean;
  total: number;
  passed: number;
  failed: number;
  coverage: number | null;
  failing_tests?: string[];
}

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

export interface ValidationFormat {
  skipped: boolean;
  compliant_pct: number;
  files_checked?: number;
  files_failing?: number;
}

export interface ValidationLighthouse {
  performance: number | null;
  accessibility: number | null;
  best_practices: number | null;
  seo: number | null;
}

export interface ValidationDelta {
  previous_timestamp: string | null;
  typescript_errors: number;
  tests_passed: number;
  tests_failed: number;
  lint_errors: number;
  lint_warnings: number;
  format_compliant_pct: number;
}

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

export interface TryRepoMeta {
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
}

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

export type TryStreamPhase =
  | "idle"
  | "validating"
  | "fetching"
  | "reviewing"
  | "complete"
  | "error";

// ─── Try Panel (Full 6-Agent) Types ─────────────────────────────────────

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

export interface FileDetail {
  path: string;
  size: number;
  category: "priority" | "source";
}

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
}

export type TryPanelStreamPhase =
  | "idle"
  | "validating"
  | "fetching"
  | "reviewing"
  | "debating"
  | "synthesizing"
  | "complete"
  | "error";

export interface TryAgentProgress {
  agent: string;
  status: "pending" | "running" | "complete" | "error";
  result?: TryAgentResult;
}

export interface TryResultSummary {
  audit_id: string;
  repo: { owner: string; name: string };
  composite: { score: number; grade: Grade; verdict: Verdict };
  tier: "free" | "byok";
  timestamp: string;
}

// ─── Design System Constants ─────────────────────────────────────────

export const AGENT_COLORS = {
  boris: "#3b82f6",
  cat: "#8b5cf6",
  thariq: "#06b6d4",
  lydia: "#f59e0b",
  ado: "#10b981",
  jason: "#ef4444",
  synthesis: "#6366f1",
} as const satisfies Record<string, string>;

export type AgentColorKey = keyof typeof AGENT_COLORS;

/** Get agent color by name, with fallback for unknown agents */
export function getAgentColor(agent: string): string {
  if (agent in AGENT_COLORS) {
    return AGENT_COLORS[agent as AgentColorKey];
  }
  return "#6b7280";
}

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

export function getVerdict(score: number): Verdict {
  if (score >= 85) return "STRONG_PASS";
  if (score >= 70) return "PASS";
  if (score >= 55) return "MARGINAL";
  return "FAIL";
}
