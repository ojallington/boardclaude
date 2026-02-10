import Link from "next/link";
import { AGENT_COLORS } from "@/lib/types";

const AGENTS = [
  { name: "Boris", role: "Architecture & Type Safety", key: "boris" },
  { name: "Cat", role: "Product & UX Design", key: "cat" },
  { name: "Thariq", role: "Innovation & Simplicity", key: "thariq" },
  { name: "Lydia", role: "DX & Documentation", key: "lydia" },
  { name: "Ado", role: "Community & Integration", key: "ado" },
  { name: "Jason", role: "Community Impact", key: "jason" },
];

const STEPS = [
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
];

const FEATURES = [
  {
    title: "Multi-Agent Evaluation",
    description: "6 specialized agents run in parallel, each with calibrated criteria and weights.",
  },
  {
    title: "Closed-Loop Fix Pipeline",
    description: "Audit \u2192 Fix \u2192 Re-audit until scores improve. Tracked action items across iterations.",
  },
  {
    title: "Real Validation Data",
    description: "TypeScript errors, test results, lint output, and performance metrics fed directly to agents.",
  },
  {
    title: "Configurable Panels",
    description: "YAML configs for any evaluation scenario \u2014 code review, startup pitch, hackathon judging.",
  },
  {
    title: "Dual Runtime",
    description: "CLI plugin and web dashboard share the same config format and evaluation engine.",
  },
  {
    title: "Score Progression",
    description: "Track improvement across iterations with delta scoring and regression detection.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight">
          Board<span className="text-indigo-400">Claude</span>
        </h1>
        <p className="mt-4 text-2xl sm:text-3xl font-medium text-indigo-300">
          Your AI Jury
        </p>
        <p className="mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed">
          Assemble a board of AI agents that evaluate your project from every
          perspective that matters. Six calibrated judges. One comprehensive
          verdict.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <a
            href="#install"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors text-lg"
          >
            Install Plugin
          </a>
          <a
            href="#demo"
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition-colors text-lg"
          >
            Watch Demo
          </a>
          <Link
            href="/results"
            className="px-8 py-3 text-gray-400 hover:text-gray-200 font-medium transition-colors text-lg"
          >
            View Results
          </Link>
        </div>
      </section>

      {/* Video */}
      <section id="demo" className="px-6 pb-24 max-w-5xl mx-auto scroll-mt-8">
        <div className="rounded-2xl overflow-hidden border border-gray-800 shadow-[0_0_60px_-15px_rgba(99,102,241,0.3)]">
          <video
            controls
            preload="metadata"
            className="w-full"
          >
            <source src="/demo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      {/* Install */}
      <section id="install" className="px-6 pb-24 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Get Started</h2>
        <p className="text-gray-400 mb-8 text-lg">
          Install the BoardClaude plugin for Claude Code in one command.
        </p>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-left">
          <p className="text-xs font-mono text-gray-500 mb-3">Terminal</p>
          <code className="block text-base sm:text-lg font-mono text-indigo-300 break-all">
            claude plugin add boardclaude
          </code>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          Then run{" "}
          <code className="text-gray-300 bg-gray-800 px-2 py-0.5 rounded text-sm">
            /bc:audit
          </code>{" "}
          in any project to start your first evaluation.
        </p>
      </section>

      {/* How It Works */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-8"
            >
              <span className="text-sm font-mono text-indigo-400">
                {step.number}
              </span>
              <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Agent Showcase */}
      <section className="px-6 pb-24 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">The Panel</h2>
        <p className="text-gray-400 mb-12 text-lg">
          Six calibrated perspectives. One comprehensive evaluation.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {AGENTS.map((agent) => (
            <div
              key={agent.key}
              className="flex items-center gap-3 rounded-full border border-gray-800 bg-gray-900/50 px-5 py-2.5"
            >
              <span
                className="inline-block h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: AGENT_COLORS[agent.key] }}
              />
              <span className="font-medium">{agent.name}</span>
              <span className="text-sm text-gray-500">{agent.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
            >
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 text-center text-gray-500 text-sm">
        <p>
          Built for the{" "}
          <span className="text-gray-300">&ldquo;Built with Opus 4.6&rdquo;</span>{" "}
          Hackathon
        </p>
        <a
          href="https://github.com/ojallington/boardclaude"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
