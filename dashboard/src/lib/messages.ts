/**
 * Centralized UI strings for BoardClaude dashboard.
 *
 * All user-facing text lives here so it can be swapped with a proper i18n
 * library (e.g. next-intl) when the project grows beyond English.
 */

export const messages = {
  // ─── Site-wide ──────────────────────────────────────────────────────
  site: {
    title: "BoardClaude - Multi-Perspective Project Evaluation",
    description:
      "Assemble a board of AI agents that evaluate your project from multiple expert perspectives.",
  },

  // ─── Landing page ──────────────────────────────────────────────────
  hero: {
    heading: "BoardClaude",
    tagline: "Your AI Jury",
    description:
      "Assemble a board of AI agents that evaluate your project from every perspective that matters. Six calibrated judges. One comprehensive verdict.",
    installCta: "Install Plugin",
    demoCta: "Watch Demo",
    resultsCta: "View Results",
  },

  install: {
    heading: "Get Started",
    description:
      "Install the BoardClaude plugin for Claude Code with the install script.",
    terminalLabel: "Terminal",
    command:
      "git clone https://github.com/ojallington/boardclaude.git && ./boardclaude/install.sh .",
    hint: "Then run {command} in any project to start your first evaluation.",
    hintCommand: "/bc:audit",
  },

  howItWorks: {
    heading: "How It Works",
    steps: [
      {
        number: "01",
        title: "Configure Your Panel",
        description:
          "Pick a template or build custom. Define agents, weights, and criteria in YAML.",
      },
      {
        number: "02",
        title: "Run the Audit",
        description:
          "Six AI agents evaluate in parallel. Each scores independently with extended thinking.",
      },
      {
        number: "03",
        title: "Get Actionable Results",
        description:
          "Composite scores, radar charts, strengths, weaknesses, and prioritized fixes.",
      },
    ],
  },

  panel: {
    heading: "The Panel",
    description: "Six calibrated perspectives. One comprehensive evaluation.",
    agents: [
      { name: "Boris", role: "Architecture & Type Safety", key: "boris" },
      { name: "Cat", role: "Product & UX Design", key: "cat" },
      { name: "Thariq", role: "Innovation & Simplicity", key: "thariq" },
      { name: "Lydia", role: "DX & Documentation", key: "lydia" },
      { name: "Ado", role: "Community & Integration", key: "ado" },
      { name: "Jason", role: "Community Impact", key: "jason" },
    ],
  },

  features: {
    heading: "Features",
    items: [
      {
        title: "Multi-Agent Evaluation",
        description:
          "6 specialized agents run in parallel, each with calibrated criteria and weights.",
      },
      {
        title: "Closed-Loop Fix Pipeline",
        description:
          "Audit \u2192 Fix \u2192 Re-audit until scores improve. Tracked action items across iterations.",
      },
      {
        title: "Real Validation Data",
        description:
          "TypeScript errors, test results, lint output, and performance metrics fed directly to agents.",
      },
      {
        title: "Configurable Panels",
        description:
          "YAML configs for any evaluation scenario \u2014 code review, startup pitch, hackathon judging.",
      },
      {
        title: "Dual Runtime",
        description:
          "CLI plugin and web dashboard share the same config format and evaluation engine.",
      },
      {
        title: "Score Progression",
        description:
          "Track improvement across iterations with delta scoring and regression detection.",
      },
    ],
  },

  footer: {
    builtFor: "Built for the",
    hackathonName: "\u201cBuilt with Opus 4.6\u201d",
    hackathonSuffix: "Hackathon",
    github: "GitHub",
  },

  // ─── Results page ──────────────────────────────────────────────────
  results: {
    title: "Audit Results - BoardClaude",
    description: "Browse all BoardClaude audit results and score progressions.",
    heading: "Audit Results",
    backHome: "\u2190 Home",
    viewDetails: "View details",
    emptyState: "No audits yet. Run your first audit with {command}",
    emptyCommand: "/bc:review",
    iterationLabel: "Iteration",
  },

  // ─── Audit detail page ─────────────────────────────────────────────
  auditDetail: {
    title: "Audit Detail - BoardClaude",
    description: "Detailed audit report with per-agent scores and analysis.",
    backToResults: "\u2190 Back to Results",
    comingSoon: "Audit detail coming soon",
    detailedViewFor: "Detailed view for",
    comingSoonDescription:
      "This page will display per-agent scores, radar chart, divergent opinions, action items, and the full synthesis report.",
  },

  // ─── Error Boundaries ──────────────────────────────────────────────
  errors: {
    global: {
      heading: "Something went wrong",
      description: "An unexpected error occurred. Please try again.",
      retry: "Try again",
    },
    results: {
      heading: "Failed to load audit results",
      description:
        "Could not read audit data. Make sure .boardclaude/ exists and contains valid audit files.",
      retry: "Try again",
      goHome: "Go home",
    },
    auditDetail: {
      heading: "Failed to load audit detail",
      description:
        "Could not read this audit report. The file may be missing or contain invalid data.",
      retry: "Try again",
      backToResults: "Back to results",
    },
    notFound: {
      heading: "Page not found",
      description: "The page you are looking for does not exist.",
      goHome: "Go home",
    },
    auditNotFound: {
      heading: "Audit not found",
      description: "The requested audit does not exist or could not be loaded.",
      backToResults: "Back to results",
    },
  },

  // ─── Agent Card ──────────────────────────────────────────────────────
  agentCard: {
    verdicts: {
      STRONG_PASS: "STRONG PASS",
      PASS: "PASS",
      MARGINAL: "MARGINAL",
      FAIL: "FAIL",
    },
    sections: {
      strengths: "Strengths",
      weaknesses: "Weaknesses",
      criticalIssues: "Critical Issues",
    },
  },

  // ─── Shared ────────────────────────────────────────────────────────
  video: {
    fallback: "Your browser does not support the video tag.",
  },
} as const;
