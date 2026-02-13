import type { Metadata } from "next";
import Link from "next/link";
import { TEMPLATES } from "@/lib/templates";
import { messages } from "@/lib/messages";
import { getAgentColor, getAgentColorByIndex } from "@/lib/types";

export const metadata: Metadata = {
  title: messages.boards.title,
  description: messages.boards.description,
};

function getAgentDotColor(name: string, index: number): string {
  const named = getAgentColor(name.toLowerCase());
  return named !== "#6b7280" ? named : getAgentColorByIndex(index);
}

export default function BoardsPage() {
  const featured = TEMPLATES[0];
  if (!featured) return null;
  const rest = TEMPLATES.slice(1);

  return (
    <main
      id="main-content"
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">{messages.boards.heading}</h1>
        <p className="mt-2 text-gray-300">{messages.boards.subheading}</p>
      </div>

      {/* Featured template */}
      <div className="mb-8">
        <TemplateCard template={featured} featured />
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {rest.map((t) => (
          <TemplateCard key={t.slug} template={t} />
        ))}
      </div>

      {/* Build custom CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/boards/build"
          className="inline-block rounded-lg bg-indigo-600 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          {messages.boards.buildCustom}
        </Link>
      </div>

      {/* CLI usage */}
      <section className="mt-16">
        <h2 className="mb-4 text-xl font-semibold">{messages.boards.useCli}</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <p className="mb-4 text-sm text-gray-300">
            Install BoardClaude and run any template from the CLI:
          </p>
          <div className="space-y-3 font-mono text-sm">
            <p className="text-gray-300">
              <span className="text-gray-500">$</span>{" "}
              <span className="text-indigo-300">
                git clone https://github.com/ojallington/boardclaude.git &&
                ./boardclaude/install.sh .
              </span>
            </p>
            {TEMPLATES.map((t) => (
              <p key={t.slug} className="text-gray-300">
                <span className="text-gray-500">$</span>{" "}
                <span className="text-indigo-300">
                  /bc:audit --panel {t.slug}
                </span>
                <span className="ml-4 text-gray-600">
                  # {t.agents.length} agents
                </span>
              </p>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function TemplateCard({
  template,
  featured = false,
}: {
  template: (typeof TEMPLATES)[number];
  featured?: boolean;
}) {
  const typeBadgeClass =
    template.type === "professional"
      ? "bg-blue-900/40 text-blue-400 border-blue-700/50"
      : "bg-violet-900/40 text-violet-400 border-violet-700/50";

  return (
    <div
      className={`group rounded-xl border border-gray-800 bg-gray-900/50 transition-colors hover:border-gray-700 ${
        featured ? "p-8" : "p-6"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {featured && (
              <span className="rounded-md bg-indigo-900/40 px-2 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-700/50">
                {messages.boards.featured}
              </span>
            )}
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-medium ${typeBadgeClass}`}
            >
              {template.type === "professional"
                ? messages.boards.professional
                : messages.boards.personal}
            </span>
          </div>
          <h3
            className={`mt-2 font-semibold ${featured ? "text-2xl" : "text-lg"}`}
          >
            {template.name}
          </h3>
          <p
            className={`mt-1 leading-relaxed ${featured ? "text-base text-gray-300" : "text-sm text-gray-300"}`}
          >
            {template.description}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300">
          {template.agents.length} {messages.boards.agents}
        </span>
      </div>

      {/* Agent pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {template.agents.map((agent, i) => (
          <span
            key={agent.name}
            className="flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-900/80 px-3 py-1 text-xs font-medium text-gray-300"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: getAgentDotColor(agent.name, i) }}
            />
            {agent.name}
            <span className="text-gray-500">
              {(agent.weight * 100).toFixed(0)}%
            </span>
          </span>
        ))}
      </div>

      {/* Features row */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {template.hasDebate && (
          <span className="rounded bg-gray-800/60 px-2 py-0.5">Debate</span>
        )}
        {template.hasContext && (
          <span className="rounded bg-gray-800/60 px-2 py-0.5">
            Custom Context
          </span>
        )}
        <span className="rounded bg-gray-800/60 px-2 py-0.5">
          Target: {template.scoring.iteration_target}+
        </span>
      </div>

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        <Link
          href={`/boards/build?template=${template.slug}`}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          {messages.boards.customize}
        </Link>
      </div>
    </div>
  );
}
