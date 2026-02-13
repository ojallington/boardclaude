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
    slug: "customer-archetypes",
    name: "Customer Archetype Testing",
    type: "professional",
    version: "1.0.0",
    description:
      "Four simulated customer archetypes stress-test your product from radically different perspectives: enterprise buyer, indie developer, non-technical PM, and security-first CTO.",
    agents: [
      {
        name: "Maya",
        role: "Enterprise IT Director",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "enterprise_readiness",
            weight: 0.3,
            description: "SSO, audit logs, SLAs, compliance certifications",
          },
          {
            name: "integration",
            weight: 0.3,
            description:
              "API quality, webhook support, fits existing tool stack",
          },
          {
            name: "scalability",
            weight: 0.2,
            description: "Handles 500+ users, multi-team, multi-region",
          },
          {
            name: "vendor_risk",
            weight: 0.2,
            description: "Company stability, data portability, exit strategy",
          },
        ],
      },
      {
        name: "Dev",
        role: "Solo Indie Developer",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "time_to_value",
            weight: 0.35,
            description: "Working in <5 minutes, minimal config, clear docs",
          },
          {
            name: "pricing",
            weight: 0.25,
            description: "Free tier, pay-as-you-grow, no enterprise tax",
          },
          {
            name: "extensibility",
            weight: 0.2,
            description: "Open source, plugin system, hackable",
          },
          {
            name: "community",
            weight: 0.2,
            description:
              "Active community, good examples, responsive maintainers",
          },
        ],
      },
      {
        name: "Jordan",
        role: "Non-technical PM",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "usability",
            weight: 0.35,
            description: "Intuitive UI, no jargon, self-explanatory workflows",
          },
          {
            name: "reporting",
            weight: 0.25,
            description:
              "Dashboards, export to slides, stakeholder-ready output",
          },
          {
            name: "collaboration",
            weight: 0.2,
            description: "Team sharing, comments, notifications, permissions",
          },
          {
            name: "onboarding",
            weight: 0.2,
            description: "Guided setup, templates, interactive tutorials",
          },
        ],
      },
      {
        name: "Kenji",
        role: "Security-first CTO",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "security",
            weight: 0.35,
            description:
              "Encryption, auth, vulnerability management, pen-test results",
          },
          {
            name: "compliance",
            weight: 0.25,
            description: "SOC 2, GDPR, HIPAA readiness, data residency",
          },
          {
            name: "architecture",
            weight: 0.2,
            description:
              "Clean design, no single points of failure, disaster recovery",
          },
          {
            name: "transparency",
            weight: 0.2,
            description: "Open roadmap, incident history, honest communication",
          },
        ],
      },
    ],
    scoring: { scale: 100, passing_threshold: 70, iteration_target: 85 },
  },
  {
    slug: "stakeholder-alignment",
    name: "Stakeholder Alignment",
    type: "professional",
    version: "1.0.0",
    description:
      "Four executive perspectives evaluate a proposal before it reaches the real boardroom: CFO on ROI, Engineering Lead on feasibility, Legal on compliance, and Head of UX on user impact.",
    agents: [
      {
        name: "CFO",
        role: "ROI & Budget",
        weight: 0.3,
        model: "sonnet",
        criteria: [
          {
            name: "roi",
            weight: 0.35,
            description: "Expected return vs investment, payback period",
          },
          {
            name: "budget_fit",
            weight: 0.25,
            description: "Fits current budget cycle, no surprise costs",
          },
          {
            name: "revenue_impact",
            weight: 0.2,
            description: "Revenue uplift or cost savings, measurable outcomes",
          },
          {
            name: "financial_risk",
            weight: 0.2,
            description: "Downside exposure, sunk cost risk, contingency plan",
          },
        ],
      },
      {
        name: "Eng Lead",
        role: "Technical Feasibility",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "feasibility",
            weight: 0.3,
            description: "Can we build this with current team and stack?",
          },
          {
            name: "timeline",
            weight: 0.3,
            description: "Realistic delivery estimate, dependency mapping",
          },
          {
            name: "tech_debt",
            weight: 0.2,
            description: "Impact on existing systems, migration complexity",
          },
          {
            name: "maintainability",
            weight: 0.2,
            description: "Long-term ownership cost, operational burden",
          },
        ],
      },
      {
        name: "Legal",
        role: "Compliance & Risk",
        weight: 0.2,
        model: "sonnet",
        criteria: [
          {
            name: "regulatory",
            weight: 0.35,
            description: "GDPR, CCPA, industry-specific regulation compliance",
          },
          {
            name: "liability",
            weight: 0.25,
            description: "Contractual risk, IP exposure, third-party liability",
          },
          {
            name: "data_governance",
            weight: 0.2,
            description: "Data handling, retention policies, user consent",
          },
          {
            name: "reputation_risk",
            weight: 0.2,
            description: "Brand risk, public perception, ethical concerns",
          },
        ],
      },
      {
        name: "Head of UX",
        role: "User Impact",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "user_value",
            weight: 0.3,
            description:
              "Solves a real user pain point, measurable improvement",
          },
          {
            name: "accessibility",
            weight: 0.25,
            description:
              "WCAG compliance, inclusive design, assistive tech support",
          },
          {
            name: "experience_quality",
            weight: 0.25,
            description: "Intuitive flows, consistent patterns, delight factor",
          },
          {
            name: "research_backing",
            weight: 0.2,
            description:
              "User research evidence, validated assumptions, metrics",
          },
        ],
      },
    ],
    scoring: { scale: 100, passing_threshold: 70, iteration_target: 85 },
  },
  {
    slug: "content-review",
    name: "Content Review Board",
    type: "professional",
    version: "1.0.0",
    description:
      "Five editorial perspectives review content before publication: SEO, brand voice, accessibility, factual accuracy, and reader engagement. Works for blog posts, docs, landing pages, or marketing copy.",
    agents: [
      {
        name: "SEO Analyst",
        role: "Search & Discovery",
        weight: 0.2,
        model: "sonnet",
        criteria: [
          {
            name: "keywords",
            weight: 0.3,
            description: "Target keyword usage, density, placement in headings",
          },
          {
            name: "structure",
            weight: 0.3,
            description: "H1/H2 hierarchy, meta description, internal linking",
          },
          {
            name: "search_intent",
            weight: 0.2,
            description: "Matches user search intent, answers the query",
          },
          {
            name: "technical_seo",
            weight: 0.2,
            description: "Schema markup, canonical URLs, page speed impact",
          },
        ],
      },
      {
        name: "Brand Editor",
        role: "Voice & Tone",
        weight: 0.25,
        model: "sonnet",
        criteria: [
          {
            name: "voice_consistency",
            weight: 0.3,
            description: "Matches brand voice guidelines, consistent tone",
          },
          {
            name: "clarity",
            weight: 0.3,
            description:
              "Clear, concise writing, no jargon without explanation",
          },
          {
            name: "grammar",
            weight: 0.2,
            description:
              "Grammar, spelling, punctuation, style guide adherence",
          },
          {
            name: "narrative",
            weight: 0.2,
            description: "Compelling structure, strong lead, clear CTA",
          },
        ],
      },
      {
        name: "A11y Reviewer",
        role: "Accessibility",
        weight: 0.2,
        model: "sonnet",
        criteria: [
          {
            name: "alt_text",
            weight: 0.3,
            description: "Descriptive alt text for all images and media",
          },
          {
            name: "readability",
            weight: 0.3,
            description:
              "Reading level appropriate for audience, plain language",
          },
          {
            name: "color_contrast",
            weight: 0.2,
            description: "Text contrast ratios, not relying on color alone",
          },
          {
            name: "structure",
            weight: 0.2,
            description: "Semantic headings, lists, tables for screen readers",
          },
        ],
      },
      {
        name: "Fact Checker",
        role: "Accuracy & Sources",
        weight: 0.2,
        model: "sonnet",
        criteria: [
          {
            name: "accuracy",
            weight: 0.35,
            description:
              "All claims verifiable, statistics sourced, no hallucination",
          },
          {
            name: "citations",
            weight: 0.25,
            description: "Sources linked, authoritative references, recency",
          },
          {
            name: "bias",
            weight: 0.2,
            description: "Balanced perspective, no misleading framing",
          },
          {
            name: "currency",
            weight: 0.2,
            description: "Information is current, no outdated claims or data",
          },
        ],
      },
      {
        name: "Reader",
        role: "Engagement & Value",
        weight: 0.15,
        model: "sonnet",
        criteria: [
          {
            name: "engagement",
            weight: 0.3,
            description: "Would a reader finish this? Hook, pacing, payoff",
          },
          {
            name: "actionability",
            weight: 0.3,
            description:
              "Reader leaves with something they can use immediately",
          },
          {
            name: "uniqueness",
            weight: 0.2,
            description: "Offers a perspective not found in the top 10 results",
          },
          {
            name: "shareability",
            weight: 0.2,
            description:
              "Would someone share this? Quotable lines, strong visuals",
          },
        ],
      },
    ],
    scoring: { scale: 100, passing_threshold: 70, iteration_target: 85 },
  },
];

export function getTemplate(slug: string): TemplateData | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}
