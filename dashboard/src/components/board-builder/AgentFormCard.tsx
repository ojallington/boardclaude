"use client";

import type { BuilderAgent, BuilderAction } from "@/app/boards/build/page";
import { messages } from "@/lib/messages";

interface AgentFormCardProps {
  agent: BuilderAgent;
  index: number;
  canRemove: boolean;
  dispatch: React.Dispatch<BuilderAction>;
}

export function AgentFormCard({
  agent,
  index,
  canRemove,
  dispatch,
}: AgentFormCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Name */}
          <label className="block">
            <span className="text-xs font-medium text-gray-300">
              {messages.builder.agentName}
            </span>
            <input
              type="text"
              value={agent.name}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_AGENT",
                  index,
                  field: "name",
                  value: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Agent name"
            />
          </label>

          {/* Role */}
          <label className="block">
            <span className="text-xs font-medium text-gray-300">
              {messages.builder.agentRole}
            </span>
            <input
              type="text"
              value={agent.role}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_AGENT",
                  index,
                  field: "role",
                  value: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="What this agent evaluates"
            />
          </label>

          {/* Weight */}
          <label className="block">
            <span className="text-xs font-medium text-gray-300">
              {messages.builder.agentWeight}: {(agent.weight * 100).toFixed(0)}%
            </span>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.01"
              value={agent.weight}
              onChange={(e) =>
                dispatch({
                  type: "SET_AGENT_WEIGHT",
                  index,
                  value: parseFloat(e.target.value),
                })
              }
              className="mt-2 block w-full accent-indigo-500"
            />
          </label>

          {/* Model */}
          <label className="block">
            <span className="text-xs font-medium text-gray-300">
              {messages.builder.agentModel}
            </span>
            <select
              value={agent.model}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_AGENT",
                  index,
                  field: "model",
                  value: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="opus">Opus</option>
              <option value="sonnet">Sonnet</option>
              <option value="haiku">Haiku</option>
            </select>
          </label>
        </div>

        {canRemove && (
          <button
            onClick={() => dispatch({ type: "REMOVE_AGENT", index })}
            className="shrink-0 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-700 hover:bg-red-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {messages.builder.removeAgent}
          </button>
        )}
      </div>

      {/* Prompt */}
      <label className="mt-3 block">
        <span className="text-xs font-medium text-gray-300">
          {messages.builder.agentPrompt}
        </span>
        <textarea
          value={agent.prompt}
          onChange={(e) =>
            dispatch({
              type: "UPDATE_AGENT",
              index,
              field: "prompt",
              value: e.target.value,
            })
          }
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Instructions for this agent..."
        />
      </label>

      {/* Criteria */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-300">Criteria</span>
          <button
            onClick={() =>
              dispatch({ type: "ADD_CRITERION", agentIndex: index })
            }
            className="rounded-md bg-gray-800 px-2.5 py-1 text-xs font-medium text-indigo-400 transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            + {messages.builder.addCriterion}
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {agent.criteria.map((c, ci) => (
            <div
              key={ci}
              className="grid grid-cols-[1fr_80px_1fr_auto] items-center gap-2"
            >
              <input
                type="text"
                value={c.name}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_CRITERION",
                    agentIndex: index,
                    criterionIndex: ci,
                    field: "name",
                    value: e.target.value,
                  })
                }
                className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Name"
              />
              <input
                type="number"
                min="0.05"
                max="1"
                step="0.05"
                value={c.weight}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_CRITERION",
                    agentIndex: index,
                    criterionIndex: ci,
                    field: "weight",
                    value: e.target.value,
                  })
                }
                className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={c.description}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_CRITERION",
                    agentIndex: index,
                    criterionIndex: ci,
                    field: "description",
                    value: e.target.value,
                  })
                }
                className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Description"
              />
              {agent.criteria.length > 1 && (
                <button
                  onClick={() =>
                    dispatch({
                      type: "REMOVE_CRITERION",
                      agentIndex: index,
                      criterionIndex: ci,
                    })
                  }
                  className="text-xs text-gray-500 transition-colors hover:text-red-400"
                  aria-label={`Remove criterion ${c.name}`}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
