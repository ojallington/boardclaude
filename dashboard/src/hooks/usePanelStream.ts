"use client";

import { useState, useCallback, useRef } from "react";
import type {
  TryPanelResult,
  TryPanelStreamPhase,
  TryAgentProgress,
  TryAgentResult,
} from "@/lib/types";
import { validateTryPanelResult } from "@/lib/validate";

const AGENT_NAMES = ["boris", "cat", "thariq", "lydia", "ado", "jason"];

function initialAgents(): TryAgentProgress[] {
  return AGENT_NAMES.map((name) => ({ agent: name, status: "pending" }));
}

interface UsePanelStreamReturn {
  phase: TryPanelStreamPhase;
  result: TryPanelResult | null;
  error: string | null;
  repoInfo: { owner: string; name: string } | null;
  tier: "free" | "byok" | null;
  agents: TryAgentProgress[];
  completedCount: number;
  startReview: (url: string, apiKey: string | null) => void;
  reset: () => void;
}

export function usePanelStream(): UsePanelStreamReturn {
  const [phase, setPhase] = useState<TryPanelStreamPhase>("idle");
  const [result, setResult] = useState<TryPanelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<{
    owner: string;
    name: string;
  } | null>(null);
  const [tier, setTier] = useState<"free" | "byok" | null>(null);
  const [agents, setAgents] = useState<TryAgentProgress[]>(initialAgents);
  const [completedCount, setCompletedCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setPhase("idle");
    setResult(null);
    setError(null);
    setRepoInfo(null);
    setTier(null);
    setAgents(initialAgents());
    setCompletedCount(0);
  }, []);

  const startReview = useCallback((url: string, apiKey: string | null) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("validating");
    setResult(null);
    setError(null);
    setRepoInfo(null);
    setTier(apiKey ? "byok" : "free");
    setAgents(initialAgents());
    setCompletedCount(0);

    (async () => {
      try {
        const body: Record<string, string> = { url };
        if (apiKey) body.apiKey = apiKey;

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

    function handleSSEEvent(event: string, data: Record<string, unknown>) {
      switch (event) {
        case "status": {
          const statusPhase = data.phase as string;
          if (statusPhase === "fetching") {
            setPhase("fetching");
            if (data.repo) {
              setRepoInfo(data.repo as { owner: string; name: string });
            }
          } else if (statusPhase === "reviewing") {
            setPhase("reviewing");
            if (data.tier) setTier(data.tier as "free" | "byok");
          } else if (statusPhase === "debating") {
            setPhase("debating");
          } else if (statusPhase === "synthesizing") {
            setPhase("synthesizing");
          }
          break;
        }
        case "agent_start": {
          const name = data.agent as string;
          setAgents((prev) =>
            prev.map((a) =>
              a.agent === name ? { ...a, status: "running" } : a,
            ),
          );
          break;
        }
        case "agent_complete": {
          const name = data.agent as string;
          const agentResult = data.result as TryAgentResult;
          setAgents((prev) =>
            prev.map((a) =>
              a.agent === name
                ? { ...a, status: "complete", result: agentResult }
                : a,
            ),
          );
          setCompletedCount((c) => c + 1);
          break;
        }
        case "agent_error": {
          const name = data.agent as string;
          setAgents((prev) =>
            prev.map((a) => (a.agent === name ? { ...a, status: "error" } : a)),
          );
          break;
        }
        case "complete": {
          const validation = validateTryPanelResult(data);
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
          setError(data.message as string);
          setPhase("error");
          break;
        }
      }
    }
  }, []);

  return {
    phase,
    result,
    error,
    repoInfo,
    tier,
    agents,
    completedCount,
    startReview,
    reset,
  };
}
