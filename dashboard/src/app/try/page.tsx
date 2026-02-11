import { Suspense } from "react";
import type { Metadata } from "next";
import { messages } from "@/lib/messages";
import { TryPageClient } from "@/components/TryPageClient";

export const metadata: Metadata = {
  title: "Try It Now - BoardClaude",
  description: messages.tryIt.description,
};

export default function TryPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-100">
          {messages.tryIt.heading}
        </h1>
        <p className="mt-3 text-lg text-gray-400">
          {messages.tryIt.description}
        </p>
      </div>
      <Suspense>
        <TryPageClient />
      </Suspense>
    </main>
  );
}
