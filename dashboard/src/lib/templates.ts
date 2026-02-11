/**
 * Static template data extracted from panels/*.yaml files.
 * Avoids runtime YAML parsing -- data is embedded as typed objects.
 */

export interface TemplateAgent {
  name: string;
  role: string;
  weight: number;
  model: string;
  veto_power?: boolean;
  criteria: Array<{ name: string; weight: number; description: string }>;
}

export interface TemplateData {
  slug: string;
  name: string;
  type: "professional" | "personal";
  version: string;
  description: string;
  agents: TemplateAgent[];
  scoring: {
    scale: number;
    passing_threshold: number;
    iteration_target: number;
  };
  hasDebate?: boolean;
  hasContext?: boolean;
}

export const TEMPLATES: TemplateData[] = [
  {
    slug: "hackathon-judges",
    name: "Hackathon Judges",
    type: "professional",
    version: "1.0.0",
    description:
      "Anthropic Build with Claude hackathon evaluation panel. Six agents each embody a specific evaluator perspective sourced from public statements, talks, and professional background.",
    agents: [
      {
        name: "Boris",
        role: "Architecture & Verification",
        weight: 0.2,
        model: "opus",
        criteria: [
          {
            name: "architecture",
            weight: 0.4,
            description:
              "System decomposition, separation of concerns, clean data flow",
          },
          {
            name: "verification",
            weight: 0.3,
            description:
              "Verification loops, automated quality gates, feedback loops",
          },
          {
            name: "compound_learning",
            weight: 0.2,
            description:
              "CLAUDE.md usage, knowledge accumulation, iterative improvement",
          },
          {
            name: "simplicity",
            weight: 0.1,
            description:
              "Appropriate simplicity, no over-engineering, works out of the box",
          },
        ],
      },
      {
        name: "Cat",
        role: "Product & User Impact",
        weight: 0.18,
        model: "opus",
        criteria: [
          {
            name: "user_value",
            weight: 0.35,
            description:
              "Solves a real user problem, clear before/after improvement",
          },
          {
            name: "adoption_path",
            weight: 0.25,
            description:
              "Time to first value, dependency count, learning curve",
          },
          {
            name: "narrative",
            weight: 0.2,
            description: "One-sentence pitch clarity, README storytelling",
          },
          {
            name: "market_fit",
            weight: 0.2,
            description: "Target user base size, must-have vs nice-to-have",
          },
        ],
      },
      {
        name: "Thariq",
        role: "AI Innovation & Intelligence",
        weight: 0.18,
        model: "opus",
        criteria: [
          {
            name: "ai_innovation",
            weight: 0.35,
            description:
              "Genuine novelty in AI usage, creative agent architecture",
          },
          {
            name: "opus_usage",
            weight: 0.3,
            description:
              "Agent Teams, 1M context, adaptive thinking used meaningfully",
          },
          {
            name: "emergent_behavior",
            weight: 0.2,
            description:
              "Multi-agent insights beyond prompts, system surprise factor",
          },
          {
            name: "efficiency",
            weight: 0.15,
            description: "Smart model routing, cost-aware token usage, caching",
          },
        ],
      },
      {
        name: "Lydia",
        role: "Frontend/DX & Code Quality",
        weight: 0.18,
        model: "opus",
        criteria: [
          {
            name: "code_quality",
            weight: 0.3,
            description:
              "TypeScript strict mode, no any types, naming conventions",
          },
          {
            name: "developer_experience",
            weight: 0.25,
            description:
              "Onboarding ease, consistent patterns, good abstractions",
          },
          {
            name: "performance",
            weight: 0.25,
            description:
              "Lighthouse 90+, Core Web Vitals, bundle size, Server Components",
          },
          {
            name: "patterns",
            weight: 0.2,
            description:
              "Modern React patterns (RSC, Suspense, Hooks), design patterns",
          },
        ],
      },
      {
        name: "Ado",
        role: "DevRel/Docs & Accessibility",
        weight: 0.13,
        model: "sonnet",
        criteria: [
          {
            name: "documentation",
            weight: 0.35,
            description: "README quality, inline comments, API docs, changelog",
          },
          {
            name: "accessibility",
            weight: 0.25,
            description:
              "WCAG 2.1 AA, keyboard navigation, screen reader support",
          },
          {
            name: "examples",
            weight: 0.25,
            description:
              "Working demo, example configs, clone-and-run in <5 minutes",
          },
          {
            name: "community",
            weight: 0.15,
            description:
              "LICENSE, CONTRIBUTING.md, issue templates, visible CI/CD",
          },
        ],
      },
      {
        name: "Jason",
        role: "Community Impact & Integration",
        weight: 0.13,
        model: "sonnet",
        criteria: [
          {
            name: "community_impact",
            weight: 0.3,
            description: "Broad accessibility, community adoption potential",
          },
          {
            name: "narrative",
            weight: 0.25,
            description:
              "One-sentence pitch clarity, demo quality, compelling before/after",
          },
          {
            name: "integration",
            weight: 0.25,
            description:
              "Plugin architecture, standard interfaces, CI/CD support",
          },
          {
            name: "internationalization",
            weight: 0.2,
            description:
              "Extracted strings, locale-aware formatting, inclusive design",
          },
        ],
      },
    ],
    scoring: { scale: 100, passing_threshold: 70, iteration_target: 85 },
  },
  {
    slug: "code-review",
    name: "Code Review",
    type: "professional",
    version: "1.0.0",
    description:
      "A general-purpose code review panel with three complementary perspectives: architecture quality, nitpick-level correctness, and end-user experience. Suitable for any codebase.",
    agents: [
      {
        name: "The Architect",
        role: "Design and structure evaluator",
        weight: 0.4,
        model: "sonnet",
        criteria: [
          {
            name: "design",
            weight: 0.35,
            description:
              "Overall system design, module boundaries, separation of concerns",
          },
          {
            name: "maintainability",
            weight: 0.3,
            description:
              "Can another developer understand and extend this codebase?",
          },
          {
            name: "scalability",
            weight: 0.2,
            description: "Will this architecture handle growth?",
          },
          {
            name: "dependencies",
            weight: 0.15,
            description: "Dependency graph cleanliness, no circular imports",
          },
        ],
      },
      {
        name: "The Nitpicker",
        role: "Correctness and code quality auditor",
        weight: 0.35,
        model: "sonnet",
        criteria: [
          {
            name: "correctness",
            weight: 0.35,
            description: "No bugs, proper type safety, edge cases handled",
          },
          {
            name: "consistency",
            weight: 0.25,
            description: "Consistent patterns, naming, and style throughout",
          },
          {
            name: "error_handling",
            weight: 0.25,
            description: "Comprehensive error handling with useful messages",
          },
          {
            name: "naming",
            weight: 0.15,
            description:
              "Clear, descriptive naming for variables and functions",
          },
        ],
      },
      {
        name: "The User Advocate",
        role: "End-user and developer experience evaluator",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "api_design",
            weight: 0.3,
            description: "Intuitive public API, clear function signatures",
          },
          {
            name: "documentation",
            weight: 0.3,
            description: "README, quickstart, API docs",
          },
          {
            name: "onboarding",
            weight: 0.25,
            description: "Steps from clone to running, first-time experience",
          },
          {
            name: "error_experience",
            weight: 0.15,
            description: "Error messages help the user fix the problem",
          },
        ],
      },
    ],
    scoring: { scale: 100, passing_threshold: 70, iteration_target: 85 },
  },
  {
    slug: "startup-pitch",
    name: "Startup Pitch",
    type: "professional",
    version: "1.0.0",
    description:
      "Three simulated investor perspectives evaluate a startup pitch, product README, or project concept. Covers technical feasibility, market opportunity, and operational execution.",
    agents: [
      {
        name: "Technical VC",
        role: "Technical feasibility and moat evaluator",
        weight: 0.35,
        model: "sonnet",
        criteria: [
          {
            name: "technical_moat",
            weight: 0.35,
            description:
              "Defensibility, genuine innovation, hard-to-replicate tech",
          },
          {
            name: "architecture",
            weight: 0.25,
            description: "Appropriate technical approach for the problem",
          },
          {
            name: "scalability",
            weight: 0.25,
            description: "Can the system handle significant growth?",
          },
          {
            name: "technical_risk",
            weight: 0.15,
            description: "Unvalidated assumptions, what could go wrong?",
          },
        ],
      },
      {
        name: "Market VC",
        role: "Market opportunity and positioning evaluator",
        weight: 0.35,
        model: "sonnet",
        criteria: [
          {
            name: "market_size",
            weight: 0.3,
            description: "Total addressable market, painkiller vs vitamin",
          },
          {
            name: "competitive_advantage",
            weight: 0.25,
            description: "What makes this better than alternatives?",
          },
          {
            name: "positioning",
            weight: 0.25,
            description: "Clarity of value proposition, brand communication",
          },
          {
            name: "go_to_market",
            weight: 0.2,
            description: "Distribution strategy, virality potential",
          },
        ],
      },
      {
        name: "Operator VC",
        role: "Execution and operational readiness evaluator",
        weight: 0.3,
        model: "sonnet",
        criteria: [
          {
            name: "execution_evidence",
            weight: 0.35,
            description: "Working product, ship velocity, progress vs time",
          },
          {
            name: "resourcefulness",
            weight: 0.25,
            description: "Progress relative to constraints, scrappy solving",
          },
          {
            name: "operational_readiness",
            weight: 0.25,
            description: "Deployment, CI/CD, monitoring basics",
          },
          {
            name: "roadmap_clarity",
            weight: 0.15,
            description: "Clear next 90 days, concrete milestones",
          },
        ],
      },
    ],
    scoring: { scale: 100, passing_threshold: 70, iteration_target: 85 },
  },
  {
    slug: "personal-shipper",
    name: "Personal Shipper",
    type: "personal",
    version: "1.0.0",
    description:
      "Personal accountability panel with four agents: The Shipper enforces delivery, The Strategist checks business alignment, The Realist audits time and energy, The Visionary ensures long-term value. The Shipper has VETO POWER.",
    agents: [
      {
        name: "The Shipper",
        role: "Anti-scope-creep enforcer",
        weight: 0.35,
        model: "sonnet",
        veto_power: true,
        criteria: [
          {
            name: "completeness",
            weight: 0.4,
            description: "Is the project at definition of done?",
          },
          {
            name: "time_efficiency",
            weight: 0.3,
            description: "Time spent vs progress made",
          },
          {
            name: "scope_discipline",
            weight: 0.3,
            description: "No scope creep, no shiny object chasing",
          },
        ],
      },
      {
        name: "The Strategist",
        role: "Business alignment checker",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "strategic_alignment",
            weight: 0.4,
            description: "Does this serve stated business/career goals?",
          },
          {
            name: "portfolio_value",
            weight: 0.3,
            description: "Would a potential client be impressed?",
          },
          {
            name: "network_potential",
            weight: 0.3,
            description: "Networking and visibility value",
          },
        ],
      },
      {
        name: "The Realist",
        role: "Time and energy auditor",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "realistic_estimation",
            weight: 0.4,
            description: "Are time estimates accurate? (Hint: 2x them)",
          },
          {
            name: "sustainability",
            weight: 0.3,
            description: "Is this pace maintainable? Burnout risk?",
          },
          {
            name: "resource_management",
            weight: 0.3,
            description: "Budget and resource usage tracking",
          },
        ],
      },
      {
        name: "The Visionary",
        role: "Long-term alignment checker",
        weight: 0.15,
        model: "sonnet",
        criteria: [
          {
            name: "pride_test",
            weight: 0.35,
            description: "Would you be proud to show this publicly?",
          },
          {
            name: "learning_value",
            weight: 0.35,
            description: "Teaches skills that compound over time",
          },
          {
            name: "door_opening",
            weight: 0.3,
            description: "Opens doors for future opportunities",
          },
        ],
      },
    ],
    scoring: { scale: 100, passing_threshold: 70, iteration_target: 85 },
    hasDebate: true,
    hasContext: true,
  },
  {
    slug: "personal-oscar",
    name: "Oscar's Shipping Board",
    type: "personal",
    version: "1.0.0",
    description:
      "Personal accountability panel designed for a solo developer's specific goals, constraints, and patterns. Same four-agent structure as Personal Shipper, customized with real context.",
    agents: [
      {
        name: "The Shipper",
        role: "Anti-scope-creep enforcer",
        weight: 0.35,
        model: "sonnet",
        veto_power: true,
        criteria: [
          {
            name: "completeness",
            weight: 0.4,
            description: "Is the project at definition of done?",
          },
          {
            name: "time_efficiency",
            weight: 0.3,
            description: "Time spent vs progress made",
          },
          {
            name: "scope_discipline",
            weight: 0.3,
            description: "No scope creep, no shiny object chasing",
          },
        ],
      },
      {
        name: "The Strategist",
        role: "Business alignment checker",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "strategic_alignment",
            weight: 0.4,
            description: "Does this serve stated goals?",
          },
          {
            name: "portfolio_value",
            weight: 0.3,
            description: "Portfolio and reputation value",
          },
          {
            name: "network_potential",
            weight: 0.3,
            description: "Networking and visibility value",
          },
        ],
      },
      {
        name: "The Realist",
        role: "Time and energy auditor",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "realistic_estimation",
            weight: 0.4,
            description: "Time estimates at 2x actual",
          },
          {
            name: "sustainability",
            weight: 0.3,
            description: "Sustainable pace, burnout risk",
          },
          {
            name: "resource_management",
            weight: 0.3,
            description: "Budget and resource tracking",
          },
        ],
      },
      {
        name: "The Visionary",
        role: "Long-term alignment checker",
        weight: 0.15,
        model: "sonnet",
        criteria: [
          {
            name: "pride_test",
            weight: 0.35,
            description: "Would you show this to Boris Cherny?",
          },
          {
            name: "learning_value",
            weight: 0.35,
            description: "Transferable, compounding skills",
          },
          {
            name: "door_opening",
            weight: 0.3,
            description: "Opens doors for opportunities",
          },
        ],
      },
    ],
    scoring: { scale: 100, passing_threshold: 70, iteration_target: 85 },
    hasDebate: true,
    hasContext: true,
  },
];

export function getTemplate(slug: string): TemplateData | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}
