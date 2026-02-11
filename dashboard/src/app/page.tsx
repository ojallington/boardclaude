import Link from "next/link";
import { getAgentColor } from "@/lib/types";
import { messages } from "@/lib/messages";

export default function HomePage() {
  const { hero, install, howItWorks, panel, features, footer, video } =
    messages;

  return (
    <main id="main-content" className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight">
          Board<span className="text-indigo-400">Claude</span>
        </h1>
        <p className="mt-4 text-2xl sm:text-3xl font-medium text-indigo-300">
          {hero.tagline}
        </p>
        <p className="mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed">
          {hero.description}
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <a
            href="#install"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            {hero.installCta}
          </a>
          <a
            href="#demo"
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition-colors text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            {hero.demoCta}
          </a>
          <Link
            href="/results"
            className="px-8 py-3 text-gray-400 hover:text-gray-200 font-medium transition-colors text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-lg"
          >
            {hero.resultsCta}
          </Link>
        </div>
      </section>

      {/* Video */}
      <section id="demo" className="px-6 pb-24 max-w-5xl mx-auto scroll-mt-8">
        <div className="rounded-2xl overflow-hidden border border-gray-800 shadow-[0_0_60px_-15px_rgba(99,102,241,0.3)]">
          <video
            controls
            preload="metadata"
            poster="/demo-poster.jpg"
            className="w-full"
          >
            <source src="/demo.mp4" type="video/mp4" />
            {video.fallback}
          </video>
        </div>
      </section>

      {/* Install */}
      <section
        id="install"
        className="px-6 pb-24 max-w-3xl mx-auto text-center"
      >
        <h2 className="text-3xl font-bold mb-4">{install.heading}</h2>
        <p className="text-gray-400 mb-8 text-lg">{install.description}</p>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-left">
          <p className="text-xs font-mono text-gray-400 mb-3">
            {install.terminalLabel}
          </p>
          <code className="block text-base sm:text-lg font-mono text-indigo-300 break-all">
            {install.command}
          </code>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          Then run{" "}
          <code className="text-gray-300 bg-gray-800 px-2 py-0.5 rounded text-sm">
            {install.hintCommand}
          </code>{" "}
          in any project to start your first evaluation.
        </p>
      </section>

      {/* How It Works */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">
          {howItWorks.heading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {howItWorks.steps.map((step) => (
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
        <h2 className="text-3xl font-bold mb-4">{panel.heading}</h2>
        <p className="text-gray-400 mb-12 text-lg">{panel.description}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {panel.agents.map((agent) => (
            <div
              key={agent.key}
              className="flex items-center gap-3 rounded-full border border-gray-800 bg-gray-900/50 px-5 py-2.5"
            >
              <span
                className="inline-block h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: getAgentColor(agent.key) }}
              />
              <span className="font-medium">{agent.name}</span>
              <span className="text-sm text-gray-400">{agent.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">
          {features.heading}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.items.map((feature) => (
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
      <footer className="border-t border-gray-800 py-12 text-center text-gray-400 text-sm">
        <p>
          {footer.builtFor}{" "}
          <span className="text-gray-300">{footer.hackathonName}</span>{" "}
          {footer.hackathonSuffix}
        </p>
        <a
          href="https://github.com/ojallington/boardclaude"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded"
        >
          {footer.github}
        </a>
      </footer>
    </main>
  );
}
