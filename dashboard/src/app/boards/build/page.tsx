"use client";

import { useReducer, useCallback, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { messages } from "@/lib/messages";
import { getTemplate } from "@/lib/templates";
import type { TemplateData } from "@/lib/templates";
import {
  panelToYaml,
  downloadYaml,
  type SerializedPanel,
} from "@/lib/panel-serializer";
import { savePanel } from "@/lib/board-storage";
import { AgentFormCard } from "@/components/board-builder/AgentFormCard";
import { WeightBar } from "@/components/board-builder/WeightBar";

// ─── Types ────────────────────────────────────────────────────────────

export interface BuilderCriterion {
  name: string;
  weight: number;
  description: string;
}

export interface BuilderAgent {
  id: string;
  name: string;
  role: string;
  weight: number;
  model: string;
  prompt: string;
  veto_power: boolean;
  criteria: BuilderCriterion[];
}

interface BuilderState {
  name: string;
  description: string;
  type: "professional" | "personal";
  agents: BuilderAgent[];
  passingThreshold: number;
  iterationTarget: number;
}

export type BuilderAction =
  | { type: "LOAD_TEMPLATE"; template: TemplateData }
  | { type: "SET_FIELD"; field: "name" | "description"; value: string }
  | { type: "SET_TYPE"; value: "professional" | "personal" }
  | { type: "ADD_AGENT" }
  | { type: "REMOVE_AGENT"; index: number }
  | {
      type: "UPDATE_AGENT";
      index: number;
      field: "name" | "role" | "model" | "prompt";
      value: string;
    }
  | { type: "SET_AGENT_WEIGHT"; index: number; value: number }
  | {
      type: "ADD_CRITERION";
      agentIndex: number;
    }
  | {
      type: "REMOVE_CRITERION";
      agentIndex: number;
      criterionIndex: number;
    }
  | {
      type: "UPDATE_CRITERION";
      agentIndex: number;
      criterionIndex: number;
      field: "name" | "weight" | "description";
      value: string;
    }
  | {
      type: "SET_SCORING";
      field: "passingThreshold" | "iterationTarget";
      value: number;
    };

// ─── Helpers ──────────────────────────────────────────────────────────

const AGENT_PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
];

function defaultAgent(): BuilderAgent {
  return {
    id: crypto.randomUUID(),
    name: "",
    role: "",
    weight: 0.25,
    model: "sonnet",
    prompt: "",
    veto_power: false,
    criteria: [{ name: "", weight: 1.0, description: "" }],
  };
}

function defaultState(): BuilderState {
  return {
    name: "",
    description: "",
    type: "professional",
    agents: [defaultAgent(), defaultAgent()],
    passingThreshold: 70,
    iterationTarget: 85,
  };
}

function rebalanceWeights(
  agents: BuilderAgent[],
  changedIdx: number,
  newWeight: number,
): BuilderAgent[] {
  const others = agents.filter((_, i) => i !== changedIdx);
  const otherTotal = others.reduce((s, a) => s + a.weight, 0);
  const remaining = Math.max(0, 1 - newWeight);

  return agents.map((agent, i) => {
    if (i === changedIdx) return { ...agent, weight: newWeight };
    const share =
      otherTotal > 0 ? agent.weight / otherTotal : 1 / others.length;
    return {
      ...agent,
      weight: Math.max(0.05, parseFloat((remaining * share).toFixed(2))),
    };
  });
}

function templateToState(t: TemplateData): BuilderState {
  return {
    name: t.name,
    description: t.description,
    type: t.type,
    agents: t.agents.map((a) => ({
      id: crypto.randomUUID(),
      name: a.name,
      role: a.role,
      weight: a.weight,
      model: a.model,
      prompt: "",
      veto_power: a.veto_power ?? false,
      criteria: a.criteria.map((c) => ({
        name: c.name,
        weight: c.weight,
        description: c.description,
      })),
    })),
    passingThreshold: t.scoring.passing_threshold,
    iterationTarget: t.scoring.iteration_target,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────

function builderReducer(
  state: BuilderState,
  action: BuilderAction,
): BuilderState {
  switch (action.type) {
    case "LOAD_TEMPLATE":
      return templateToState(action.template);

    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "SET_TYPE":
      return { ...state, type: action.value };

    case "ADD_AGENT": {
      if (state.agents.length >= 8) return state;
      const newAgent = defaultAgent();
      const newWeight = parseFloat((1 / (state.agents.length + 1)).toFixed(2));
      newAgent.weight = newWeight;
      const agents = [...state.agents, newAgent];
      // Rebalance all
      const total = agents.reduce((s, a) => s + a.weight, 0);
      return {
        ...state,
        agents: agents.map((a) => ({
          ...a,
          weight: parseFloat((a.weight / total).toFixed(2)),
        })),
      };
    }

    case "REMOVE_AGENT": {
      if (state.agents.length <= 2) return state;
      const agents = state.agents.filter((_, i) => i !== action.index);
      const total = agents.reduce((s, a) => s + a.weight, 0);
      return {
        ...state,
        agents: agents.map((a) => ({
          ...a,
          weight: parseFloat((a.weight / total).toFixed(2)),
        })),
      };
    }

    case "UPDATE_AGENT": {
      const agents = state.agents.map((a, i) => {
        if (i !== action.index) return a;
        return { ...a, [action.field]: action.value } as BuilderAgent;
      });
      return { ...state, agents };
    }

    case "SET_AGENT_WEIGHT":
      return {
        ...state,
        agents: rebalanceWeights(state.agents, action.index, action.value),
      };

    case "ADD_CRITERION": {
      const agents = state.agents.map((a, i) => {
        if (i !== action.agentIndex) return a;
        return {
          ...a,
          criteria: [...a.criteria, { name: "", weight: 0.2, description: "" }],
        };
      });
      return { ...state, agents };
    }

    case "REMOVE_CRITERION": {
      const agents = state.agents.map((a, i) => {
        if (i !== action.agentIndex) return a;
        return {
          ...a,
          criteria: a.criteria.filter((_, ci) => ci !== action.criterionIndex),
        };
      });
      return { ...state, agents };
    }

    case "UPDATE_CRITERION": {
      const agents = state.agents.map((a, i) => {
        if (i !== action.agentIndex) return a;
        const criteria = a.criteria.map((c, ci) => {
          if (ci !== action.criterionIndex) return c;
          return {
            ...c,
            [action.field]:
              action.field === "weight"
                ? parseFloat(action.value) || 0
                : action.value,
          } as BuilderCriterion;
        });
        return { ...a, criteria };
      });
      return { ...state, agents };
    }

    case "SET_SCORING":
      return { ...state, [action.field]: action.value };

    default:
      return state;
  }
}

// ─── YAML Preview ────────────────────────────────────────────────────

function YamlPreview({ yaml }: { yaml: string }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900/50">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-medium text-gray-300 transition-colors hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <span>YAML Preview</span>
        <span className="text-gray-500">{collapsed ? "▸" : "▾"}</span>
      </button>
      {!collapsed && (
        <pre className="max-h-96 overflow-auto border-t border-gray-800 px-5 py-4 text-xs leading-relaxed text-gray-300">
          <code>{yaml}</code>
        </pre>
      )}
    </section>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export default function BuilderPage() {
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(builderReducer, undefined, defaultState);
  const [saved, setSaved] = useState(false);

  // Load template from query param on mount
  useEffect(() => {
    const slug = searchParams.get("template");
    if (slug) {
      const tpl = getTemplate(slug);
      if (tpl) {
        dispatch({ type: "LOAD_TEMPLATE", template: tpl });
      }
    }
  }, [searchParams]);

  const toSerializedPanel = useCallback((): SerializedPanel => {
    return {
      name: state.name || "custom-panel",
      type: state.type,
      version: "1.0.0",
      description: state.description || "Custom evaluation panel",
      agents: state.agents.map((a) => ({
        name: a.name || "Agent",
        role: a.role || "Evaluator",
        weight: a.weight,
        model: a.model,
        veto_power: a.veto_power,
        prompt: a.prompt,
        criteria: a.criteria.map((c) => ({
          name: c.name || "criterion",
          weight: c.weight,
          description: c.description || "",
        })),
      })),
      scoring: {
        scale: 100,
        passing_threshold: state.passingThreshold,
        iteration_target: state.iterationTarget,
      },
    };
  }, [state]);

  const yamlPreview = useMemo(
    () => panelToYaml(toSerializedPanel()),
    [toSerializedPanel],
  );

  const handleExport = useCallback(() => {
    const panel = toSerializedPanel();
    const yaml = panelToYaml(panel);
    const slug = panel.name.toLowerCase().replace(/\s+/g, "-");
    downloadYaml(yaml, slug);
  }, [toSerializedPanel]);

  const handleSave = useCallback(() => {
    const panel = toSerializedPanel();
    savePanel(panel);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [toSerializedPanel]);

  return (
    <main
      id="main-content"
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="mb-8">
        <Link
          href="/boards"
          className="text-sm text-gray-400 transition-colors hover:text-gray-200"
        >
          &larr; {messages.builder.backToTemplates}
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{messages.builder.heading}</h1>
      </div>

      {/* Panel metadata */}
      <section className="mb-8 rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-gray-300">
              {messages.builder.panelName}
            </span>
            <input
              type="text"
              value={state.name}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "name",
                  value: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="my-panel"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-300">
              {messages.builder.panelType}
            </span>
            <select
              value={state.type}
              onChange={(e) =>
                dispatch({
                  type: "SET_TYPE",
                  value: e.target.value as "professional" | "personal",
                })
              }
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="professional">Professional</option>
              <option value="personal">Personal</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-xs font-medium text-gray-300">
            {messages.builder.panelDescription}
          </span>
          <textarea
            value={state.description}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "description",
                value: e.target.value,
              })
            }
            rows={2}
            className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="What does this panel evaluate?"
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-gray-300">
              {messages.builder.passingThreshold}
            </span>
            <input
              type="number"
              min="0"
              max="100"
              value={state.passingThreshold}
              onChange={(e) =>
                dispatch({
                  type: "SET_SCORING",
                  field: "passingThreshold",
                  value: parseInt(e.target.value) || 0,
                })
              }
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-300">
              {messages.builder.iterationTarget}
            </span>
            <input
              type="number"
              min="0"
              max="100"
              value={state.iterationTarget}
              onChange={(e) =>
                dispatch({
                  type: "SET_SCORING",
                  field: "iterationTarget",
                  value: parseInt(e.target.value) || 0,
                })
              }
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
        </div>
      </section>

      {/* Weight distribution */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-gray-300">
          {messages.builder.weightDistribution}
        </h2>
        <WeightBar
          items={state.agents.map((a, i) => ({
            name: a.name || `Agent ${i + 1}`,
            weight: a.weight,
            color: AGENT_PALETTE[i % AGENT_PALETTE.length] ?? "#6b7280",
          }))}
        />
      </section>

      {/* Agents */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Agents ({state.agents.length})
          </h2>
          <button
            onClick={() => dispatch({ type: "ADD_AGENT" })}
            disabled={state.agents.length >= 8}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            + {messages.builder.addAgent}
          </button>
        </div>
        {state.agents.length >= 8 && (
          <p className="text-xs text-amber-400">{messages.builder.maxAgents}</p>
        )}
        {state.agents.map((agent, idx) => (
          <AgentFormCard
            key={agent.id}
            agent={agent}
            index={idx}
            canRemove={state.agents.length > 2}
            dispatch={dispatch}
          />
        ))}
      </section>

      {/* YAML Preview */}
      <YamlPreview yaml={yamlPreview} />

      {/* Actions */}
      <div className="mt-10 flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          {messages.builder.exportYaml}
        </button>
        <button
          onClick={handleSave}
          className="rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          {saved ? messages.builder.saved : messages.builder.saveLocal}
        </button>
      </div>
    </main>
  );
}
