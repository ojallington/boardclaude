import Link from "next/link";
import { getAgentColor } from "@/lib/types";
import { messages } from "@/lib/messages";
import { HeroTrySection } from "@/components/HeroTrySection";

export default function HomePage() {
  const { hero, story, install, howItWorks, panel, features, footer } =
    messages;

  return (
    <main id="main-content" className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight">
          Board<span className="text-indigo-400">Claude</span>
        </h1>
        <p className="mt-4 text-2xl sm:text-3xl font-medium text-indigo-300">
          {hero.tagline}
        </p>
        <p className="mt-6 max-w-2xl text-lg text-gray-300 leading-relaxed">
          {hero.description}
        </p>
      </section>

      {/* The Story */}
      <section className="px-6 pb-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">{story.heading}</h2>
        <div className="space-y-5">
          {story.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 40)}
              className="text-gray-300 leading-relaxed text-lg"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* The Panel */}
      <section className="px-6 pb-20 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">{panel.heading}</h2>
        <p className="text-gray-300 mb-10 text-lg max-w-2xl mx-auto">
          {panel.description}
        </p>
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
              <span className="font-medium">{agent.fullName}</span>
              <span className="text-sm text-gray-300">{agent.role}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-gray-500 max-w-xl mx-auto italic">
          {panel.disclaimer}
        </p>
      </section>

      {/* Try It Now */}
      <section className="px-6 pb-20 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Try It Now</h2>
        <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
          Paste a public GitHub repo URL and get an instant AI code review. No
          install required.
        </p>
        <HeroTrySection />
      </section>

      {/* How It Works */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
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
              <p className="mt-3 text-gray-300 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Self-Improvement Loop */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          {messages.loop.heading}
        </h2>
        <p className="text-gray-300 text-lg text-center max-w-2xl mx-auto mb-12">
          {messages.loop.description}
        </p>

        {/* Loop diagram */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-12">
          {messages.loop.steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-4 sm:gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-indigo-500/50 bg-indigo-500/10 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">
                    {step.icon === "scan" && "\uD83D\uDD0D"}
                    {step.icon === "wrench" && "\uD83D\uDD27"}
                    {step.icon === "repeat" && "\uD83D\uDD01"}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-300">
                  {step.label}
                </span>
              </div>
              {i < messages.loop.steps.length - 1 && (
                <svg
                  className="w-6 h-6 text-indigo-500/50 shrink-0 -mt-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Score progression bar chart */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <p className="text-sm text-gray-300 mb-4">
            {messages.loop.progression.label}
          </p>
          <div className="flex items-end gap-3 sm:gap-5 h-40">
            {messages.loop.progression.scores.map((s) => (
              <div
                key={s.iteration}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <span className="text-sm font-bold tabular-nums text-indigo-300">
                  {s.score}
                </span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all"
                  style={{ height: `${(s.score / 100) * 100}%` }}
                />
                <span className="text-xs text-gray-500">#{s.iteration}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500 italic text-center">
            {messages.loop.cta}
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          {features.heading}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.items.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
            >
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Install */}
      <section
        id="install"
        className="px-6 pb-20 max-w-3xl mx-auto text-center"
      >
        <h2 className="text-3xl font-bold mb-4">{install.heading}</h2>
        <p className="text-gray-300 mb-8 text-lg">{install.description}</p>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-left">
          <p className="text-xs font-mono text-gray-300 mb-3">
            {install.terminalLabel}
          </p>
          <code className="block text-base sm:text-lg font-mono text-indigo-300 break-all">
            {install.command}
          </code>
        </div>
        <p className="mt-6 text-sm text-gray-300">
          Then run{" "}
          <code className="text-gray-300 bg-gray-800 px-2 py-0.5 rounded text-sm">
            {install.hintCommand}
          </code>{" "}
          in any project to start your first evaluation.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 text-center text-gray-300 text-sm">
        <p>
          {footer.builtFor}{" "}
          <span className="text-gray-300">{footer.hackathonName}</span>{" "}
          {footer.hackathonSuffix}
        </p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <a
            href="https://github.com/ojallington/boardclaude"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded"
          >
            {footer.github}
          </a>
          <Link
            href="/results"
            className="text-gray-400 hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded"
          >
            Results
          </Link>
        </div>
      </footer>
    </main>
  );
}
