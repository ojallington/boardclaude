import type { Metadata } from "next";
import Link from "next/link";

import { getAgentColor } from "@/lib/types";
import { messages } from "@/lib/messages";
import { getProjectState } from "@/lib/audit-loader";
import {
  SCORE_DATA,
  STORY_STATS,
  STORY_PHASES,
  STORY_AGENTS,
} from "@/lib/story-data";
import { StoryScoreChart } from "@/components/story/StoryScoreChart";
import { StoryPhaseSection } from "@/components/story/StoryPhaseSection";
import { ResearchGrid } from "@/components/story/ResearchGrid";

const { storyPage: t } = messages;

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
};

export default async function StoryPage() {
  const projectState = await getProjectState();

  const scoreData =
    projectState && projectState.score_history.length > 0
      ? projectState.score_history.map((s) => ({
          iteration: s.iteration,
          score: s.score,
          grade: s.grade ?? "",
          verdict: s.verdict ?? "",
        }))
      : SCORE_DATA;

  const stats = [
    { label: "Iterations", value: STORY_STATS.iterations },
    { label: "Commits", value: STORY_STATS.commits },
    { label: "Action Items", value: STORY_STATS.actionItems },
    { label: "Tests", value: STORY_STATS.tests },
    { label: "Locales", value: STORY_STATS.locales },
    { label: "Rewrites", value: STORY_STATS.rewrites },
  ];

  return (
    <main id="main-content" className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          {t.heading}
        </h1>
        <p className="mt-4 text-xl text-gray-300 max-w-2xl">{t.subheading}</p>
      </section>

      {/* Stats */}
      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-indigo-400 tabular-nums">
                {s.value}
              </p>
              <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Score Chart */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          {t.chartHeading}
        </h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
          <StoryScoreChart data={scoreData} />
        </div>
      </section>

      {/* Research Stage */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-3">
          {t.researchHeading}
        </h2>
        <p className="text-gray-300 text-center max-w-2xl mx-auto mb-10">
          {t.researchDescription}
        </p>
        <ResearchGrid />
      </section>

      {/* Five Phases */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">
          {t.phasesHeading}
        </h2>
        <div className="space-y-10">
          {STORY_PHASES.map((phase, i) => (
            <StoryPhaseSection key={phase.title} phase={phase} index={i} />
          ))}
        </div>
      </section>

      {/* Agents */}
      <section className="px-6 pb-20 max-w-5xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-8">{t.agentsHeading}</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {STORY_AGENTS.map((agent) => (
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
              <span
                className={`text-xs rounded px-1.5 py-0.5 font-medium ${
                  agent.model === "Opus"
                    ? "bg-indigo-900/50 text-indigo-300"
                    : "bg-gray-800 text-gray-300"
                }`}
              >
                {agent.model}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Finale */}
      <section className="px-6 pb-24 max-w-3xl mx-auto text-center">
        <p className="text-5xl sm:text-6xl font-bold text-indigo-400 mb-4">
          {t.finaleScore}
        </p>
        <p className="text-lg text-gray-300 mb-8">{t.finaleText}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/try"
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            Try It Now
          </Link>
          <Link
            href="/results"
            className="rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            View Results
          </Link>
          <a
            href="https://github.com/ojallington/boardclaude"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            GitHub
          </a>
        </div>
      </section>
    </main>
  );
}
