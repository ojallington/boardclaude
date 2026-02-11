import type { Verdict } from "./types";

// ─── Verdict Styles ─────────────────────────────────────────────────────────
// Shared across AgentCard, results/page.tsx, and results/[auditId]/page.tsx

export const VERDICT_BADGE_STYLES: Record<Verdict, string> = {
  STRONG_PASS: "bg-emerald-900/40 text-emerald-400 border-emerald-800",
  PASS: "bg-blue-900/40 text-blue-400 border-blue-800",
  MARGINAL: "bg-amber-900/40 text-amber-400 border-amber-800",
  FAIL: "bg-red-900/40 text-red-400 border-red-800",
};

export const GRADE_STYLES: Record<string, string> = {
  "A+": "text-emerald-400",
  A: "text-emerald-400",
  "A-": "text-emerald-400",
  "B+": "text-blue-400",
  B: "text-blue-400",
  "B-": "text-blue-400",
  "C+": "text-amber-400",
  C: "text-amber-400",
  "C-": "text-amber-400",
  D: "text-red-400",
  F: "text-red-500",
};

// ─── Agent Roles ────────────────────────────────────────────────────────────

export const AGENT_ROLES: Record<string, string> = {
  boris: "Architecture & Verification",
  cat: "Product & User Impact",
  thariq: "AI Innovation & Systems",
  lydia: "Frontend & Developer Experience",
  ado: "Documentation & Developer Relations",
  jason: "Community Impact & Integration",
};

// ─── Date Formatting ────────────────────────────────────────────────────────

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
