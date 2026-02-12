import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Variant config
// ---------------------------------------------------------------------------

const VARIANT_CONFIG = {
  strengths: { icon: <CheckIcon />, textIcon: "+", color: "text-emerald-400" },
  weaknesses: { icon: <WarningIcon />, textIcon: "-", color: "text-amber-400" },
  critical: { icon: <AlertIcon />, textIcon: "!", color: "text-red-400" },
} as const;

type Variant = keyof typeof VARIANT_CONFIG;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EvaluationListProps {
  items: string[];
  variant: Variant;
  label?: string;
  /** "sm" for compact cards (PanelAgentCard), "md" for standard */
  size?: "sm" | "md";
  /** Custom icon override (bypasses variant icon) */
  icon?: ReactNode;
  /** Custom icon color override */
  iconColor?: string;
}

/**
 * Shared list component for rendering strengths, weaknesses, and critical
 * issues across AgentCard, PanelAgentCard, PanelSynthesisView, and
 * StreamingAgentCard. Uses content-derived keys for correct React
 * reconciliation during streaming.
 */
export function EvaluationList({
  items,
  variant,
  label,
  size = "md",
  icon,
  iconColor,
}: EvaluationListProps) {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return null;

  const config = VARIANT_CONFIG[variant];
  const resolvedIcon = icon ?? (size === "sm" ? config.textIcon : config.icon);
  const resolvedColor = iconColor ?? config.color;
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const spacing = size === "sm" ? "space-y-0.5" : "space-y-1.5";
  const gap = size === "sm" ? "gap-1.5" : "gap-2";
  const headerClass =
    size === "sm"
      ? "text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1"
      : "text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2";

  return (
    <div>
      {label && <h4 className={headerClass}>{label}</h4>}
      <ul className={spacing}>
        {filtered.map((item) => (
          <li
            key={item}
            className={`flex items-start ${gap} ${textSize} text-gray-300`}
          >
            <span className={`mt-0.5 shrink-0 ${resolvedColor}`}>
              {resolvedIcon}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
