"use client";

import { useState } from "react";
import { messages } from "@/lib/messages";

const GITHUB_URL_RE = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?/i;

interface TryFormProps {
  onSubmit: (url: string, apiKey: string | null) => void;
  isLoading: boolean;
  compact?: boolean;
}

export function TryForm({ onSubmit, isLoading, compact }: TryFormProps) {
  const [url, setUrl] = useState("");
  const [showByok, setShowByok] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!GITHUB_URL_RE.test(trimmed)) {
      setUrlError(messages.tryIt.errors.invalidUrl);
      return;
    }
    setUrlError(null);
    onSubmit(trimmed, showByok && apiKey ? apiKey : null);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 min-w-0">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) setUrlError(null);
            }}
            placeholder={messages.tryIt.inputPlaceholder}
            className={`w-full rounded-lg border bg-gray-900 px-4 py-3 text-base text-gray-100 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              urlError ? "border-red-600" : "border-gray-700"
            }`}
            disabled={isLoading}
            aria-label="GitHub repository URL"
            aria-invalid={urlError ? "true" : undefined}
          />
          {urlError && (
            <p className="mt-1.5 text-sm text-red-400" role="alert">
              {urlError}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="shrink-0 rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          {isLoading
            ? messages.tryIt.submitButtonLoading
            : messages.tryIt.submitButton}
        </button>
      </div>

      {/* BYOK section */}
      {!compact && (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowByok(!showByok)}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {showByok ? "Hide API key" : messages.tryIt.byokToggle}
            </button>
            {/* Tier badge */}
            <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-0.5 text-xs text-gray-300">
              {showByok && apiKey
                ? `${messages.tryIt.byokModeLabel}: ${messages.tryIt.byokModeDescription}`
                : `${messages.tryIt.demoModeLabel}: ${messages.tryIt.demoModeDescription}`}
            </span>
          </div>

          {showByok && (
            <div className="mt-3 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="byok-key"
                  className="mb-1.5 block text-xs font-medium text-gray-300"
                >
                  Anthropic API Key
                </label>
                <input
                  id="byok-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={messages.tryIt.byokPlaceholder}
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {messages.tryIt.byokHint}
                </p>
                <p className="mt-1.5 text-xs text-gray-500">
                  {messages.tryIt.byokCostEstimate}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {messages.tryIt.byokGetKey}{" "}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded"
                  >
                    {messages.tryIt.byokGetKeyLink}
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
