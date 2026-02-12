"use client";

import { useState, useCallback, useRef } from "react";
import type { TryResult, TryStreamPhase } from "@/lib/types";
import { validateTryResult } from "@/lib/validate";
import { isRecord, isRepoInfo } from "@/lib/type-guards";

interface UseReviewStreamReturn {
  phase: TryStreamPhase;
  result: Partial<TryResult> | null;
  error: string | null;
  repoInfo: { owner: string; name: string } | null;
  modelInfo: string | null;
  startReview: (url: string, apiKey: string | null, model: string) => void;
  reset: () => void;
}

export function useReviewStream(): UseReviewStreamReturn {
  const [phase, setPhase] = useState<TryStreamPhase>("idle");
  const [result, setResult] = useState<Partial<TryResult> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<{
    owner: string;
    name: string;
  } | null>(null);
  const [modelInfo, setModelInfo] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setPhase("idle");
    setResult(null);
    setError(null);
    setRepoInfo(null);
    setModelInfo(null);
  }, []);

  const startReview = useCallback(
    (url: string, apiKey: string | null, model: string) => {
      // Abort any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setPhase("validating");
      setResult(null);
      setError(null);
      setRepoInfo(null);
      setModelInfo(null);

      (async () => {
        try {
          const body: Record<string, string> = { url };
          if (apiKey) {
            body.apiKey = apiKey;
            body.model = model;
          }

          const res = await fetch("/api/try", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          if (!res.ok || !res.body) {
            setError("Failed to connect to review service.");
            setPhase("error");
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            let currentEvent = "";
            for (const line of lines) {
              if (line.startsWith("event: ")) {
                currentEvent = line.slice(7);
              } else if (line.startsWith("data: ")) {
                const dataStr = line.slice(6);
                try {
                  const data = JSON.parse(dataStr);
                  handleSSEEvent(currentEvent, data);
                } catch {
                  // Skip malformed data
                }
              }
            }
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError("Review failed. Please try again.");
          setPhase("error");
        }
      })();

      function handleSSEEvent(event: string, data: unknown) {
        if (!isRecord(data)) return;
        switch (event) {
          case "status": {
            if (typeof data.phase !== "string") break;
            if (data.phase === "fetching") {
              setPhase("fetching");
              if (isRepoInfo(data.repo)) {
                setRepoInfo(data.repo);
              }
            } else if (data.phase === "reviewing") {
              setPhase("reviewing");
              if (typeof data.model === "string") setModelInfo(data.model);
            }
            break;
          }
          case "partial": {
            if (typeof data.field !== "string") break;
            setResult((prev) => ({
              ...prev,
              [data.field as string]: data.value,
            }));
            break;
          }
          case "complete": {
            const validation = validateTryResult(data);
            if (validation.valid && validation.data) {
              setResult(validation.data);
              setPhase("complete");
            } else {
              setError("Invalid review data received.");
              setPhase("error");
            }
            break;
          }
          case "error": {
            const message =
              typeof data.message === "string"
                ? data.message
                : "Unknown error occurred.";
            setError(message);
            setPhase("error");
            break;
          }
        }
      }
    },
    [],
  );

  return { phase, result, error, repoInfo, modelInfo, startReview, reset };
}
