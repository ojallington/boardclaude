"use client";

import { useRouter } from "next/navigation";
import { messages } from "@/lib/messages";
import { TryForm } from "./TryForm";

const EXAMPLE_REPOS = [
  {
    name: "EveryInc/compound-engineering-plugin",
    url: "https://github.com/EveryInc/compound-engineering-plugin",
    desc: "4,700+ stars",
  },
  {
    name: "ojallington/boardclaude",
    url: "https://github.com/ojallington/boardclaude",
    desc: "This project",
  },
  {
    name: "shadcn-ui/ui",
    url: "https://github.com/shadcn-ui/ui",
    desc: "UI components",
  },
];

export function HeroTrySection() {
  const router = useRouter();

  function handleSubmit(url: string) {
    const params = new URLSearchParams({ url });
    router.push(`/try?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <TryForm onSubmit={handleSubmit} isLoading={false} compact />

      <div className="mt-6 flex flex-col items-center gap-4">
        <p className="text-sm text-gray-500">{messages.tryIt.exampleRepos}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLE_REPOS.map((repo) => (
            <button
              key={repo.url}
              onClick={() => handleSubmit(repo.url)}
              className="rounded-full border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-indigo-600/50 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              <span className="font-medium">{repo.name}</span>
              <span className="ml-2 text-gray-500">{repo.desc}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">{messages.tryIt.rateLimitFree}</p>
      </div>
    </div>
  );
}
