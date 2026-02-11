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
      "Paste a GitHub URL and get an instant AI code review. Or install the CLI for six calibrated judges and one comprehensive verdict.",
    installCta: "Install Plugin",
    demoCta: "Watch Demo",
    resultsCta: "View Results",
    trySubtext: "or install the CLI for full panel audits",
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
        title: "Paste a GitHub URL",
        description:
          "Try it online with one agent, or install the CLI and configure a full panel of judges.",
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
        title: "Try Online",
        description:
          "Paste a GitHub URL for an instant single-agent review. No install needed.",
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
    timeline: {
      heading: "Failed to load timeline",
      description:
        "Could not read timeline data. Make sure .boardclaude/timeline.json exists.",
      retry: "Try again",
      goHome: "Go home",
    },
    boards: {
      heading: "Failed to load templates",
      description: "Could not load panel templates.",
      retry: "Try again",
      goHome: "Go home",
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

  // ─── Navigation ────────────────────────────────────────────────────
  nav: {
    home: "BoardClaude",
    tryIt: "Try It",
    results: "Results",
    timeline: "Timeline",
    boards: "Boards",
  },

  // ─── Timeline page ───────────────────────────────────────────────
  timeline: {
    title: "Audit Timeline - BoardClaude",
    description: "Track the self-improvement journey across audit iterations.",
    heading: "Audit Timeline",
    subheading: "Self-improvement journey from first audit to current score.",
    iteration: "Iteration",
    delta: "Delta",
    noEvents: "No timeline events yet. Run your first audit with /bc:audit.",
    viewAudit: "View audit",
    agentProgression: "Agent Score Progression",
    agentProgressionDesc: "Individual agent scores across audit iterations.",
    itemsCreated: "items created",
    itemsResolved: "items resolved",
    actionItems: "Action Items",
  },

  // ─── Boards / Template Gallery ────────────────────────────────────
  boards: {
    title: "Panel Templates - BoardClaude",
    description:
      "Browse and customize evaluation panel templates for multi-agent evaluation.",
    heading: "Panel Templates",
    subheading:
      "Pre-built evaluation panels for common use cases. Customize any template or build your own.",
    featured: "Featured",
    professional: "Professional",
    personal: "Personal",
    agents: "agents",
    customize: "Customize",
    useCli: "Use via CLI",
    buildCustom: "Build Custom Panel",
  },

  // ─── Board Builder ────────────────────────────────────────────────
  builder: {
    title: "Board Builder - BoardClaude",
    description:
      "Create a custom evaluation panel with configurable agents and criteria.",
    heading: "Board Builder",
    addAgent: "Add Agent",
    removeAgent: "Remove",
    agentName: "Name",
    agentRole: "Role",
    agentWeight: "Weight",
    agentModel: "Model",
    agentPrompt: "Prompt",
    addCriterion: "Add Criterion",
    removeCriterion: "Remove",
    criterionName: "Name",
    criterionWeight: "Weight",
    criterionDescription: "Description",
    exportYaml: "Export YAML",
    saveLocal: "Save Locally",
    saved: "Saved",
    panelName: "Panel Name",
    panelDescription: "Description",
    panelType: "Type",
    weightDistribution: "Weight Distribution",
    startFromTemplate: "Start from Template",
    startBlank: "Start Blank",
    maxAgents: "Maximum 8 agents",
    minAgents: "Minimum 2 agents",
    passingThreshold: "Passing Threshold",
    iterationTarget: "Iteration Target",
    backToTemplates: "Templates",
  },

  // ─── Try It ────────────────────────────────────────────────────────
  tryIt: {
    heading: "Try It Now",
    description:
      "Paste a public GitHub repo URL and get an instant AI code review. No install required.",
    inputPlaceholder: "https://github.com/owner/repo",
    submitButton: "Review My Repo",
    submitButtonLoading: "Reviewing...",
    orInstall: "or install the CLI for full panel audits",
    byokToggle: "Use your own API key",
    byokPlaceholder: "sk-ant-...",
    byokHint:
      "Your key is used for one request over HTTPS. Never stored or logged.",
    modelSelect: "Model",
    exampleRepos: "Try an example",
    rateLimitFree: "3 free reviews per hour",
    rateLimitByok: "30 reviews per hour with your key",
    resultCtas: {
      tryAnother: "Try Another Repo",
      installCli: "Install CLI for Full Panel",
      buildBoard: "Build a Custom Board",
    },
    errors: {
      invalidUrl: "Please enter a valid GitHub repository URL.",
      rateLimited:
        "Rate limit reached. Try again later or use your own API key.",
      repoNotFound: "Repository not found. Make sure it exists and is public.",
      fetchFailed: "Failed to fetch repository contents.",
      reviewFailed: "Review failed. Please try again.",
      invalidApiKey: "Invalid API key. Keys should start with sk-ant-.",
    },
    phases: {
      validating: "Validating repository URL...",
      fetching: "Fetching repository contents...",
      reviewing: "AI is reviewing your code...",
      complete: "Review complete!",
      error: "Something went wrong.",
    },
  },

  // ─── Results sub-nav ──────────────────────────────────────────────
  resultsSubNav: {
    list: "List",
    timeline: "Timeline",
  },

  // ─── Shared ────────────────────────────────────────────────────────
  video: {
    fallback: "Your browser does not support the video tag.",
  },
} as const;
