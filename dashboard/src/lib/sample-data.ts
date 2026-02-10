// Sample audit data for development and demo purposes
// This will be replaced by real audit data from .boardclaude/audits/

import type { SynthesisReport, ProjectState, Timeline } from "./types";

export const SAMPLE_AUDIT: SynthesisReport = {
  audit_id: "audit-20260210-180000",
  panel: "hackathon-judges",
  target: "boardclaude",
  iteration: 0,
  timestamp: "2026-02-10T18:00:00Z",
  agents: [
    {
      agent: "boris",
      scores: {
        architecture: 72,
        verification: 58,
        compound_learning: 65,
        simplicity: 78,
      },
      composite: 68,
      strengths: [
        "Clean plugin architecture with well-separated concerns",
        "YAML-based panel configs enable easy extensibility",
        "TypeScript types are comprehensive and well-structured",
      ],
      weaknesses: [
        "No verification loops implemented yet — audit pipeline is prompt-only",
        "No automated quality gates (tsc/jest/lint integration missing)",
        "CLAUDE.md exists but compound learning not demonstrated through iterations",
      ],
      critical_issues: [
        "Audit pipeline exists only as SKILL.md instructions, not as executable code",
      ],
      verdict: "MARGINAL",
    },
    {
      agent: "cat",
      scores: {
        user_value: 75,
        adoption_path: 60,
        narrative: 70,
        market_fit: 68,
      },
      composite: 69,
      strengths: [
        "Clear value proposition — multi-perspective evaluation fills a real gap",
        "README tells a compelling story with good structure",
        "Panel templates lower the barrier to entry for new users",
      ],
      weaknesses: [
        "Time to first value is too long — requires understanding plugin system",
        "No working demo or screenshots yet to prove the concept",
        "Competitive landscape is crowded with code review tools",
      ],
      critical_issues: [],
      verdict: "MARGINAL",
    },
    {
      agent: "thariq",
      scores: {
        ai_innovation: 78,
        opus_usage: 70,
        emergent_behavior: 62,
        efficiency: 65,
      },
      composite: 71,
      strengths: [
        "Multi-agent debate architecture is genuinely novel for code review",
        "Agent Teams usage for parallel evaluation is creative",
        "Model routing (Opus/Sonnet) shows cost-aware design thinking",
      ],
      weaknesses: [
        "No evidence of emergent behavior yet — agents haven't run",
        "Extended thinking budget set but not validated in practice",
        "Million-token context not leveraged — could ingest full codebases",
      ],
      critical_issues: [],
      verdict: "PASS",
    },
    {
      agent: "lydia",
      scores: {
        code_quality: 74,
        developer_experience: 62,
        performance: 55,
        patterns: 70,
      },
      composite: 66,
      strengths: [
        "TypeScript strict mode enforced from day 1",
        "Clean component architecture with proper separation",
        "Tailwind v4 with proper PostCSS configuration",
      ],
      weaknesses: [
        "Dashboard has minimal components — only placeholder pages",
        "No error boundaries or loading states implemented",
        "No Lighthouse audit has been run — performance unknown",
      ],
      critical_issues: [],
      verdict: "MARGINAL",
    },
    {
      agent: "ado",
      scores: {
        documentation: 72,
        accessibility: 45,
        examples: 55,
        community: 50,
      },
      composite: 58,
      strengths: [
        "README has clear quickstart and architecture sections",
        "Panel YAML examples make the config format easy to understand",
        "Command table provides quick reference for all available commands",
      ],
      weaknesses: [
        "No screenshots or GIFs showing the tool in action",
        "No CONTRIBUTING.md, issue templates, or code of conduct",
        "Accessibility completely untested — no WCAG compliance verified",
      ],
      critical_issues: [],
      verdict: "MARGINAL",
    },
    {
      agent: "jason",
      scores: {
        community_impact: 65,
        narrative: 68,
        integration: 58,
        internationalization: 40,
      },
      composite: 59,
      strengths: [
        "Configurable panels make the tool broadly applicable beyond code review",
        "Plugin architecture follows Claude Code conventions",
        "Open source from day 1 — public GitHub repo",
      ],
      weaknesses: [
        "No CI/CD pipeline — no automated testing or deployment",
        "No internationalization support — all strings hardcoded in English",
        "Error handling exists in SKILL.md but not in actual code paths",
      ],
      critical_issues: [],
      verdict: "MARGINAL",
    },
  ],
  composite: {
    score: 65,
    radar: {
      architecture: 72,
      product: 69,
      innovation: 71,
      code_quality: 66,
      documentation: 58,
      integration: 59,
    },
    grade: "C+",
    verdict: "MARGINAL",
  },
  highlights: {
    top_strengths: [
      "Multi-agent evaluation architecture is genuinely novel (Thariq)",
      "Clean plugin structure with comprehensive TypeScript types (Boris)",
      "Clear value proposition with configurable panel system (Cat)",
    ],
    top_weaknesses: [
      "Audit pipeline is prompt-only — no executable implementation yet (Boris)",
      "No automated testing, CI/CD, or quality gates (Jason)",
      "Dashboard is a skeleton — no working visualizations (Lydia)",
    ],
    divergent_opinions: [
      {
        topic: "Readiness for users",
        agent_a: {
          agent: "cat",
          position:
            "The concept is strong and the README tells the story well enough to attract early adopters",
        },
        agent_b: {
          agent: "ado",
          position:
            "Without screenshots, working examples, or community docs, users will bounce immediately",
        },
        analysis:
          "Both are right at different stages. Cat is evaluating potential, Ado is evaluating current state. Priority should be getting a working demo to bridge the gap.",
      },
    ],
  },
  action_items: [
    {
      priority: 1,
      action:
        "Complete dashboard components (AgentCard, RadarChart, ScoreProgression) to render audit data visually",
      source_agent: "lydia",
      impact: "code_quality +8, performance +5",
      effort: "medium",
    },
    {
      priority: 2,
      action:
        "Run first real audit cycle to generate actual data and validate the pipeline",
      source_agent: "boris",
      impact: "verification +15, compound_learning +10",
      effort: "medium",
    },
    {
      priority: 3,
      action:
        "Add CI/CD with GitHub Actions (typecheck, lint, build) and create CONTRIBUTING.md",
      source_agent: "jason",
      impact: "integration +12, community +8",
      effort: "low",
    },
    {
      priority: 4,
      action:
        "Add screenshots and GIF demos to README showing the dashboard and audit flow",
      source_agent: "ado",
      impact: "documentation +10, examples +8",
      effort: "low",
    },
    {
      priority: 5,
      action:
        "Implement error boundaries and loading states in dashboard components",
      source_agent: "lydia",
      impact: "code_quality +5, patterns +5",
      effort: "low",
    },
  ],
  iteration_delta: {
    previous_score: null,
    current_score: 65,
    delta: null,
    improvements: [],
    regressions: [],
  },
};

export const SAMPLE_STATE: ProjectState = {
  project: "boardclaude",
  panel: "hackathon-judges",
  branch: "main",
  audit_count: 1,
  latest_audit: "audit-20260210-180000",
  latest_score: 65,
  score_history: [65],
  worktrees: [],
  status: "active",
};

export const SAMPLE_TIMELINE: Timeline = {
  events: [
    {
      id: "audit-20260210-180000",
      type: "audit",
      timestamp: "2026-02-10T18:00:00Z",
      branch: "main",
      panel: "hackathon-judges",
      composite_score: 65,
      agent_scores: {
        boris: 68,
        cat: 69,
        thariq: 71,
        lydia: 66,
        ado: 58,
        jason: 59,
      },
      parent: null,
      status: "completed",
      audit_file: "audits/audit-20260210-180000.json",
    },
  ],
};
