"use client";

import { useReducer, useCallback, useRef } from "react";
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

// ─── State & Actions ─────────────────────────────────────────────────

interface PanelStreamState {
  phase: TryPanelStreamPhase;
  result: TryPanelResult | null;
  error: string | null;
  repoInfo: { owner: string; name: string } | null;
  tier: "free" | "byok" | null;
  agents: TryAgentProgress[];
  completedCount: number;
}

type PanelStreamAction =
  | { type: "RESET" }
  | { type: "START_REVIEW"; tier: "free" | "byok" }
  | { type: "STATUS_FETCHING"; repo?: { owner: string; name: string } }
  | { type: "STATUS_REVIEWING"; tier?: "free" | "byok" }
  | { type: "STATUS_DEBATING" }
  | { type: "STATUS_SYNTHESIZING" }
  | { type: "AGENT_START"; agent: string }
  | { type: "AGENT_COMPLETE"; agent: string; result: TryAgentResult }
  | { type: "AGENT_ERROR"; agent: string }
  | { type: "COMPLETE"; result: TryPanelResult }
  | { type: "ERROR"; message: string };

function initialState(): PanelStreamState {
  return {
    phase: "idle",
    result: null,
    error: null,
    repoInfo: null,
    tier: null,
    agents: initialAgents(),
    completedCount: 0,
  };
}

function panelStreamReducer(
  state: PanelStreamState,
  action: PanelStreamAction,
): PanelStreamState {
  switch (action.type) {
    case "RESET":
      return initialState();

    case "START_REVIEW":
      return {
        ...initialState(),
        phase: "validating",
        tier: action.tier,
      };

    case "STATUS_FETCHING":
      return {
        ...state,
        phase: "fetching",
        repoInfo: action.repo ?? state.repoInfo,
      };

    case "STATUS_REVIEWING":
      return {
        ...state,
        phase: "reviewing",
        tier: action.tier ?? state.tier,
      };

    case "STATUS_DEBATING":
      return { ...state, phase: "debating" };

    case "STATUS_SYNTHESIZING":
      return { ...state, phase: "synthesizing" };

    case "AGENT_START":
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.agent === action.agent ? { ...a, status: "running" } : a,
        ),
      };

    case "AGENT_COMPLETE":
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.agent === action.agent
            ? { ...a, status: "complete", result: action.result }
            : a,
        ),
        completedCount: state.completedCount + 1,
      };

    case "AGENT_ERROR":
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.agent === action.agent ? { ...a, status: "error" } : a,
        ),
      };

    case "COMPLETE":
      return { ...state, phase: "complete", result: action.result };

    case "ERROR":
      return { ...state, phase: "error", error: action.message };

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────

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
  const [state, dispatch] = useReducer(
    panelStreamReducer,
    undefined,
    initialState,
  );
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    dispatch({ type: "RESET" });
  }, []);

  const startReview = useCallback((url: string, apiKey: string | null) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "START_REVIEW", tier: apiKey ? "byok" : "free" });

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
          dispatch({
            type: "ERROR",
            message: "Failed to connect to review service.",
          });
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
        dispatch({
          type: "ERROR",
          message: "Review failed. Please try again.",
        });
      }
    })();

    function handleSSEEvent(event: string, data: Record<string, unknown>) {
      switch (event) {
        case "status": {
          const statusPhase = data.phase as string;
          if (statusPhase === "fetching") {
            dispatch({
              type: "STATUS_FETCHING",
              repo: data.repo as { owner: string; name: string } | undefined,
            });
          } else if (statusPhase === "reviewing") {
            dispatch({
              type: "STATUS_REVIEWING",
              tier: data.tier as "free" | "byok" | undefined,
            });
          } else if (statusPhase === "debating") {
            dispatch({ type: "STATUS_DEBATING" });
          } else if (statusPhase === "synthesizing") {
            dispatch({ type: "STATUS_SYNTHESIZING" });
          }
          break;
        }
        case "agent_start":
          dispatch({ type: "AGENT_START", agent: data.agent as string });
          break;
        case "agent_complete":
          dispatch({
            type: "AGENT_COMPLETE",
            agent: data.agent as string,
            result: data.result as TryAgentResult,
          });
          break;
        case "agent_error":
          dispatch({ type: "AGENT_ERROR", agent: data.agent as string });
          break;
        case "complete": {
          const validation = validateTryPanelResult(data);
          if (validation.valid && validation.data) {
            dispatch({ type: "COMPLETE", result: validation.data });
          } else {
            dispatch({
              type: "ERROR",
              message: "Invalid review data received.",
            });
          }
          break;
        }
        case "error":
          dispatch({ type: "ERROR", message: data.message as string });
          break;
      }
    }
  }, []);

  return {
    phase: state.phase,
    result: state.result,
    error: state.error,
    repoInfo: state.repoInfo,
    tier: state.tier,
    agents: state.agents,
    completedCount: state.completedCount,
    startReview,
    reset,
  };
}
