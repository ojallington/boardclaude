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
    tagline: "Assemble Your Own Board of AI Judges",
    description:
      "A configurable panel of AI agents that evaluate your project from multiple expert perspectives. Six agents run in parallel with extended thinking, cross-examine divergent scores, and produce prioritized action items.",
    installCta: "Install Plugin",
    demoCta: "Try It Now",
    resultsCta: "View Results",
    trySubtext: "or install the CLI for full panel audits",
  },

  story: {
    heading: "How It Was Built",
    paragraphs: [
      "BoardClaude was built for Anthropic\u2019s \u201cBuilt with Opus 4.6\u201d hackathon. We studied six industry experts \u2014 their public talks, writing, and professional backgrounds \u2014 and built AI representations of each evaluation perspective: architecture, product, AI innovation, frontend, documentation, and community.",
      "We then pointed BoardClaude at itself. Over 18 iterations and 55 commits, the tool audited its own code, generated action items, and drove its composite score from 68.4 to 91.24. The same closed-loop that improved BoardClaude works on any project.",
      "We didn\u2019t get a hackathon spot \u2014 but we built the tool anyway. The result is an open-source evaluation framework you can try right now: paste a GitHub URL, or install the CLI for the full six-agent experience.",
    ],
  },

  install: {
    heading: "Get Started",
    description:
      "Install the BoardClaude plugin for Claude Code with a single command.",
    terminalLabel: "Terminal",
    command: "npx boardclaude install .",
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
    description:
      "Six AI agents, each inspired by the public work and expertise of a real hackathon judge.",
    disclaimer:
      "AI representations inspired by the public work and expertise of the real judges. Not affiliated with or endorsed by them.",
    agents: [
      {
        name: "Boris",
        fullName: "Boris Cherny",
        role: "Architecture & Verification",
        key: "boris",
      },
      {
        name: "Cat",
        fullName: "Cat Wu",
        role: "Product & User Impact",
        key: "cat",
      },
      {
        name: "Thariq",
        fullName: "Thariq Shihipar",
        role: "AI Innovation & Systems",
        key: "thariq",
      },
      {
        name: "Lydia",
        fullName: "Lydia Hallie",
        role: "Frontend & Developer Experience",
        key: "lydia",
      },
      {
        name: "Ado",
        fullName: "Ado Kukic",
        role: "Documentation & Developer Relations",
        key: "ado",
      },
      {
        name: "Jason",
        fullName: "Jason",
        role: "Community Impact & Integration",
        key: "jason",
      },
    ],
  },

  loop: {
    heading: "The Self-Improvement Loop",
    description:
      "BoardClaude doesn\u2019t just evaluate\u2014it drives iterative improvement. Audit your project, fix the top issues, and re-audit to measure progress.",
    steps: [
      { label: "Audit", icon: "scan" },
      { label: "Fix", icon: "wrench" },
      { label: "Re-audit", icon: "repeat" },
    ],
    progression: {
      label: "Real score progression from this project:",
      scores: [
        { iteration: 0, score: 68.4 },
        { iteration: 3, score: 86.2 },
        { iteration: 6, score: 90.8 },
        { iteration: 9, score: 83.51 },
        { iteration: 11, score: 83.91 },
        { iteration: 14, score: 88.83 },
        { iteration: 17, score: 91.24 },
      ],
    },
    cta: "Each cycle finds new issues, fixes them, and proves the improvement with data.",
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
          "Paste a GitHub URL for a full 6-agent panel review. No install needed.",
      },
      {
        title: "Score Progression",
        description:
          "Track improvement across iterations with delta scoring and regression detection.",
      },
    ],
  },

  differentiation: {
    heading: "Why BoardClaude?",
    description:
      "See how structured multi-agent evaluation compares to asking a single AI for feedback.",
    columnDirect: "Asking Claude Directly",
    columnBoard: "Using BoardClaude",
    rows: [
      {
        direct: "One generic perspective",
        board: "Multiple specialized perspectives",
      },
      {
        direct: "Prose-only feedback",
        board: "Weighted composite scoring",
      },
      {
        direct: "No history or tracking",
        board: "Score tracking across iterations",
      },
      {
        direct: "Ad-hoc suggestions",
        board: "Prioritized, tracked action items",
      },
      {
        direct: "Fixed evaluation criteria",
        board: "Configurable evaluation panels",
      },
      {
        direct: "Different results each time",
        board: "Reproducible, structured output",
      },
    ],
  },

  footer: {
    builtFor: "Built for the",
    hackathonName: "\u201cBuilt with Opus 4.6\u201d",
    hackathonSuffix: "Hackathon",
    github: "GitHub",
  },

  // ─── Story page ──────────────────────────────────────────────────────
  storyPage: {
    title: "The Build Story - BoardClaude",
    description:
      "How BoardClaude was built: 18 iterations, 5 phases, 68.4 to 91.24.",
    heading: "The Build Story",
    subheading: "18 iterations of self-improvement, scored by our own judges.",
    statsHeading: "By the Numbers",
    phasesHeading: "Five Phases",
    researchHeading: "The Research Stage",
    researchDescription:
      "Before writing code, we built 24 reference documents covering judge profiles, Opus 4.6 capabilities, system architecture, tech stack patterns, and competitive strategy.",
    agentsHeading: "The Agents",
    chartHeading: "Score Progression",
    finaleScore: "68.4 \u2192 91.24",
    finaleText: "From scaffold to strong pass. The data tells the story.",
  },

  // ─── Results page ──────────────────────────────────────────────────
  results: {
    title: "Audit Results - BoardClaude",
    description: "Browse all BoardClaude audit results and score progressions.",
    heading: "Audit Results",
    backHome: "\u2190 Home",
    viewDetails: "View details",
    emptyState: "No audits yet. Run your first audit with {command}",
    emptyCommand: "/bc:audit",
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
        "Could not read audit data. Run an audit first or check that audit files are valid.",
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
        "Could not read timeline data. Run an audit first to generate timeline events.",
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
    story: "Story",
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
      "Paste a public GitHub repo URL for a full 6-agent panel review. No install required.",
    inputPlaceholder: "https://github.com/owner/repo",
    submitButton: "Run Panel Review",
    submitButtonLoading: "Panel reviewing...",
    orInstall: "or install the CLI for full panel audits",
    byokToggle: "Use your own API key",
    byokPlaceholder: "sk-ant-...",
    byokHint:
      "Your key is sent over HTTPS for this request only. Never stored.",
    byokCostEstimate:
      "Estimated cost: ~$0.15\u20130.40 per review (Opus + Sonnet models)",
    byokGetKey: "Don\u2019t have a key?",
    byokGetKeyLink: "Get one from Anthropic Console",
    exampleRepos: "Try an example",
    rateLimitFree: "3 free reviews per hour",
    rateLimitByok: "30 reviews per hour with your key",
    demoModeLabel: "Demo Mode",
    demoModeDescription: "All agents use Haiku",
    byokModeLabel: "Full Panel",
    byokModeDescription:
      "Opus for Boris/Cat/Thariq/Lydia, Sonnet for Ado/Jason",
    resultCtas: {
      tryAnother: "Review Another Repo",
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
      idle: "",
      validating: "Validating repository URL...",
      fetching: "Fetching repository contents...",
      reviewing: "Evaluating with 6 agents...",
      debating: "Agents cross-examining divergent scores...",
      synthesizing: "Synthesizing panel consensus...",
      complete: "Panel review complete!",
      error: "Something went wrong.",
    },
    agentProgress: {
      pending: "Waiting...",
      running: "Analyzing...",
      complete: "Complete",
      error: "Skipped",
      synthesizing: "Synthesizing results...",
      panelProgress: "{completed} of {total} agents complete",
    },
  },

  // ─── Results sub-nav ──────────────────────────────────────────────
  resultsSubNav: {
    list: "List",
    timeline: "Timeline",
    web: "Web Reviews",
  },

  // ─── Shared ────────────────────────────────────────────────────────
  video: {
    fallback: "Your browser does not support the video tag.",
  },
} as const;
