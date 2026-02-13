/**
 * Static data for the /story page.
 *
 * Score data sourced from .boardclaude/state.json (18 data points).
 * Research doc catalog sourced from context/ directory (24 docs).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoryPhase {
  title: string;
  iterationRange: [number, number];
  scoreRange: [number, number];
  summary: string;
  keyEvents: Array<{
    label: string;
    description: string;
    type: "milestone" | "regression" | "feature" | "fix";
    scoreBadge?: string;
  }>;
  insight: string;
}

export interface ResearchDoc {
  category: "judges" | "features" | "architecture" | "stack" | "strategy";
  title: string;
  description: string;
}

export interface StoryAgent {
  key: string;
  fullName: string;
  role: string;
  model: "Opus" | "Sonnet";
  capability: string;
}

export interface ScoreEntry {
  iteration: number;
  score: number;
  grade: string;
  verdict: string;
}

// ─── Score Data (from state.json) ────────────────────────────────────────────

export const SCORE_DATA: ScoreEntry[] = [
  { iteration: 0, score: 68.4, grade: "C+", verdict: "MARGINAL" },
  { iteration: 1, score: 80.7, grade: "B+", verdict: "PASS" },
  { iteration: 2, score: 83.5, grade: "B+", verdict: "PASS" },
  { iteration: 3, score: 86.2, grade: "A-", verdict: "STRONG_PASS" },
  { iteration: 4, score: 87.37, grade: "A-", verdict: "STRONG_PASS" },
  { iteration: 5, score: 90.02, grade: "A", verdict: "STRONG_PASS" },
  { iteration: 6, score: 90.8, grade: "A", verdict: "STRONG_PASS" },
  { iteration: 7, score: 83.87, grade: "B", verdict: "PASS" },
  { iteration: 8, score: 83.51, grade: "B", verdict: "PASS" },
  { iteration: 9, score: 83.51, grade: "B", verdict: "PASS" },
  { iteration: 10, score: 83.45, grade: "B", verdict: "PASS" },
  { iteration: 11, score: 83.91, grade: "B+", verdict: "PASS" },
  { iteration: 12, score: 85.46, grade: "A-", verdict: "STRONG_PASS" },
  { iteration: 13, score: 86.72, grade: "A-", verdict: "STRONG_PASS" },
  { iteration: 14, score: 88.83, grade: "B+", verdict: "PASS" },
  { iteration: 15, score: 90.13, grade: "A", verdict: "STRONG_PASS" },
  { iteration: 16, score: 89.82, grade: "A-", verdict: "PASS" },
  { iteration: 17, score: 91.24, grade: "A", verdict: "STRONG_PASS" },
];

// ─── Stats ───────────────────────────────────────────────────────────────────

export const STORY_STATS = {
  iterations: 18,
  commits: 55,
  actionItems: 148,
  tests: 269,
  locales: 7,
  rewrites: 3,
} as const;

// ─── Phases ──────────────────────────────────────────────────────────────────

export const STORY_PHASES: StoryPhase[] = [
  {
    title: "Foundation",
    iterationRange: [0, 1],
    scoreRange: [68.4, 80.7],
    summary:
      "First audit of the scaffold. Basic plugin structure, initial agent personas, and the dashboard skeleton.",
    keyEvents: [
      {
        label: "First audit ever",
        description:
          "Six agents score the raw scaffold. Composite: 68.4 (MARGINAL).",
        type: "milestone",
        scoreBadge: "68.4",
      },
      {
        label: "First fix cycle",
        description:
          "Addressed critical issues from iteration 0. Score jumps +12.3 points.",
        type: "fix",
        scoreBadge: "80.7",
      },
    ],
    insight:
      "The biggest single-iteration gain in the entire project. Low-hanging fruit makes the first cycle the most impactful.",
  },
  {
    title: "The Climb",
    iterationRange: [2, 5],
    scoreRange: [83.5, 90.02],
    summary:
      "Steady iteration. Each cycle addressed the top action items, added tests, improved type safety, and refined agent prompts.",
    keyEvents: [
      {
        label: "Crossed 85 threshold",
        description:
          'Iteration 3 hit 86.2 \u2014 the first "STRONG_PASS" verdict.',
        type: "milestone",
        scoreBadge: "86.2",
      },
      {
        label: "First 90+ score",
        description:
          "Iteration 5 reached 90.02. Dashboard, i18n, and accessibility improvements.",
        type: "milestone",
        scoreBadge: "90.02",
      },
    ],
    insight:
      "Diminishing returns set in above 85. Each point requires more targeted fixes.",
  },
  {
    title: "The Feature Drop",
    iterationRange: [6, 10],
    scoreRange: [83.45, 90.8],
    summary:
      "Peak score of 90.80, then a major regression. New features (web review, board builder, try-it) destabilized the codebase.",
    keyEvents: [
      {
        label: "Peak before regression",
        description:
          "Iteration 6 hit 90.80 \u2014 the highest score before the drop.",
        type: "milestone",
        scoreBadge: "90.80",
      },
      {
        label: "Regression: -6.93 points",
        description:
          "Iteration 7 dropped to 83.87. New features introduced type errors, missing tests, and UI inconsistencies.",
        type: "regression",
        scoreBadge: "83.87",
      },
      {
        label: "Plateau at 83.5",
        description:
          "Iterations 8-10 stabilized but couldn't recover. The fix pipeline was overwhelmed by new action items.",
        type: "fix",
        scoreBadge: "83.45",
      },
    ],
    insight:
      "Features and quality compete for attention. Shipping too fast without re-auditing creates debt that compounds.",
  },
  {
    title: "Orchestration Evolution",
    iterationRange: [11, 14],
    scoreRange: [83.91, 88.83],
    summary:
      "Systematic recovery. Improved agent orchestration, fixed type safety issues, added comprehensive test coverage.",
    keyEvents: [
      {
        label: "Recovery begins",
        description:
          "Iteration 11 stabilized at 83.91. Focused purely on fixing, no new features.",
        type: "fix",
        scoreBadge: "83.91",
      },
      {
        label: "Back above 85",
        description:
          "Iteration 12 crossed the threshold again at 85.46 with type safety and test fixes.",
        type: "milestone",
        scoreBadge: "85.46",
      },
      {
        label: "Approaching 89",
        description:
          "Iteration 14 reached 88.83 with i18n, accessibility, and contrast improvements.",
        type: "feature",
        scoreBadge: "88.83",
      },
    ],
    insight:
      "Recovery took 4 iterations. Discipline matters more than speed \u2014 fix before you ship.",
  },
  {
    title: "Final Push",
    iterationRange: [15, 17],
    scoreRange: [90.13, 91.24],
    summary:
      "Polish phase. Minor regressions from scoring variance, but the trend held. Final score: 91.24 (STRONG_PASS).",
    keyEvents: [
      {
        label: "90+ restored",
        description:
          "Iteration 15 hit 90.13 with README improvements and cache headers.",
        type: "milestone",
        scoreBadge: "90.13",
      },
      {
        label: "Minor dip",
        description:
          "Iteration 16 dipped to 89.82 \u2014 scoring variance, not a real regression.",
        type: "regression",
        scoreBadge: "89.82",
      },
      {
        label: "Final score: 91.24",
        description:
          "Iteration 17 resolved remaining action items. Grade: A, Verdict: STRONG_PASS.",
        type: "milestone",
        scoreBadge: "91.24",
      },
    ],
    insight:
      "The last 2 points (89\u219291) required the most precision. At this level, every agent's feedback matters.",
  },
];

// ─── Agents ──────────────────────────────────────────────────────────────────

export const STORY_AGENTS: StoryAgent[] = [
  {
    key: "boris",
    fullName: "Boris Cherny",
    role: "Architecture & Verification",
    model: "Opus",
    capability: "Type systems, correctness proofs, compound learning",
  },
  {
    key: "cat",
    fullName: "Cat Wu",
    role: "Product & User Impact",
    model: "Opus",
    capability: "User value, adoption path, market fit",
  },
  {
    key: "thariq",
    fullName: "Thariq Shihipar",
    role: "AI Innovation & Systems",
    model: "Opus",
    capability: "Model capabilities, emergent behavior, AI efficiency",
  },
  {
    key: "lydia",
    fullName: "Lydia Hallie",
    role: "Frontend & Developer Experience",
    model: "Opus",
    capability: "React patterns, TypeScript, web performance",
  },
  {
    key: "ado",
    fullName: "Ado Kukic",
    role: "Documentation & DevRel",
    model: "Sonnet",
    capability: "README quality, onboarding, accessibility",
  },
  {
    key: "jason",
    fullName: "Jason",
    role: "Community & Integration",
    model: "Sonnet",
    capability: "Community impact, i18n, production readiness",
  },
];

// ─── Research Documents ──────────────────────────────────────────────────────

export const RESEARCH_DOCS: ResearchDoc[] = [
  // Judges (6)
  {
    category: "judges",
    title: "Boris Cherny",
    description: "Architecture philosophy, type safety, verification patterns",
  },
  {
    category: "judges",
    title: "Cat Wu",
    description: "Product management, user research, Claude Code PM",
  },
  {
    category: "judges",
    title: "Thariq Shihipar",
    description: "AI systems, novel applications, model capabilities",
  },
  {
    category: "judges",
    title: "Lydia Hallie",
    description:
      "React patterns, TypeScript, web performance from patterns.dev",
  },
  {
    category: "judges",
    title: "Ado Kukic",
    description: "Developer relations, documentation, accessibility advocacy",
  },
  {
    category: "judges",
    title: "Jason Bigman",
    description: "Community building, international awareness, integration",
  },
  // Features (6)
  {
    category: "features",
    title: "Agent Teams",
    description: "Parallel multi-agent orchestration with debate capability",
  },
  {
    category: "features",
    title: "Extended Thinking",
    description: "Chain-of-thought reasoning with thinking budget allocation",
  },
  {
    category: "features",
    title: "Million-Token Context",
    description: "Large context windows for full codebase analysis",
  },
  {
    category: "features",
    title: "Tool Use Strategy",
    description: "MCP tools, validation runners, graceful degradation",
  },
  {
    category: "features",
    title: "Output & Compaction",
    description: "Structured output, context compression, token efficiency",
  },
  {
    category: "features",
    title: "Error Handling Patterns",
    description: "Graceful failures, retry logic, fallback strategies",
  },
  // Architecture (4)
  {
    category: "architecture",
    title: "Data Flow",
    description: "Audit, fork, merge flows and state management",
  },
  {
    category: "architecture",
    title: "Decisions",
    description: "Key architectural decisions and trade-offs",
  },
  {
    category: "architecture",
    title: "Implementation Loop",
    description: "Fix pipeline, action item tracking, validation gates",
  },
  {
    category: "architecture",
    title: "Schemas",
    description: "TypeScript types, JSON schemas, data contracts",
  },
  // Stack (3)
  {
    category: "stack",
    title: "Next.js 15 Patterns",
    description: "App Router, Server Components, streaming patterns",
  },
  {
    category: "stack",
    title: "Tailwind + Recharts + Framer",
    description: "UI library stack, chart patterns, animation system",
  },
  {
    category: "stack",
    title: "TypeScript Strict",
    description: "Strict mode conventions, no-any policy, type utilities",
  },
  // Strategy (4)
  {
    category: "strategy",
    title: "Competitive Landscape",
    description: "Analysis of similar tools and differentiation",
  },
  {
    category: "strategy",
    title: "Prize Targeting",
    description: "Hackathon prize categories and alignment strategy",
  },
  {
    category: "strategy",
    title: "Proof Layer",
    description: "Evidence-based claims, score progression as proof",
  },
  {
    category: "strategy",
    title: "Web Frontend Vision",
    description: "Dashboard roadmap, board builder, public-facing features",
  },
];

// ─── Grouped research docs for display ───────────────────────────────────────

export const RESEARCH_CATEGORIES = [
  { key: "judges" as const, label: "Judge Profiles", count: 6 },
  { key: "features" as const, label: "Opus 4.6 Features", count: 6 },
  { key: "architecture" as const, label: "System Design", count: 4 },
  { key: "stack" as const, label: "Tech Stack", count: 3 },
  { key: "strategy" as const, label: "Strategy", count: 4 },
] as const;
