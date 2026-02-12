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

// ─── SSE Data Type Guards ─────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRepoInfo(value: unknown): value is { owner: string; name: string } {
  return (
    isRecord(value) &&
    typeof value.owner === "string" &&
    typeof value.name === "string"
  );
}

/** Lightweight type guard for TryAgentResult shape validation. */
function isAgentResult(value: unknown): value is TryAgentResult {
  if (!isRecord(value)) return false;
  return (
    typeof value.agent === "string" &&
    typeof value.role === "string" &&
    typeof value.composite === "number" &&
    typeof value.grade === "string" &&
    typeof value.verdict === "string" &&
    typeof value.one_line === "string" &&
    typeof value.model_used === "string" &&
    Array.isArray(value.strengths) &&
    Array.isArray(value.weaknesses) &&
    isRecord(value.scores)
  );
}

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
  | { type: "AGENT_TOOL_USE"; agent: string }
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

    case "AGENT_TOOL_USE":
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.agent === action.agent
            ? { ...a, toolUseCount: (a.toolUseCount ?? 0) + 1 }
            : a,
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
          if (typeof data.phase !== "string") break;
          const statusPhase = data.phase;
          if (statusPhase === "fetching") {
            dispatch({
              type: "STATUS_FETCHING",
              repo: isRepoInfo(data.repo) ? data.repo : undefined,
            });
          } else if (statusPhase === "reviewing") {
            const tier =
              data.tier === "free" || data.tier === "byok"
                ? data.tier
                : undefined;
            dispatch({ type: "STATUS_REVIEWING", tier });
          } else if (statusPhase === "debating") {
            dispatch({ type: "STATUS_DEBATING" });
          } else if (statusPhase === "synthesizing") {
            dispatch({ type: "STATUS_SYNTHESIZING" });
          }
          break;
        }
        case "agent_start": {
          if (typeof data.agent !== "string") break;
          dispatch({ type: "AGENT_START", agent: data.agent });
          break;
        }
        case "agent_tool_use": {
          if (typeof data.agent !== "string") break;
          dispatch({ type: "AGENT_TOOL_USE", agent: data.agent });
          break;
        }
        case "agent_complete": {
          if (typeof data.agent !== "string") break;
          if (!isAgentResult(data.result)) {
            dispatch({ type: "AGENT_ERROR", agent: data.agent });
            break;
          }
          dispatch({
            type: "AGENT_COMPLETE",
            agent: data.agent,
            result: data.result,
          });
          break;
        }
        case "agent_error": {
          if (typeof data.agent !== "string") break;
          dispatch({ type: "AGENT_ERROR", agent: data.agent });
          break;
        }
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
        case "error": {
          const message =
            typeof data.message === "string"
              ? data.message
              : "Unknown error occurred.";
          dispatch({ type: "ERROR", message });
          break;
        }
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
