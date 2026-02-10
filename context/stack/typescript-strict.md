# TypeScript Strict Mode — BoardClaude Stack Reference

## Why This Choice

Lydia Hallie's Frontend Masters courses test TypeScript knowledge rigorously. Strict mode signals "this person knows what they're doing." Boris values correctness — types are verification that runs at compile time, catching bugs before users do. For a hackathon, strict TypeScript prevents the class of bugs that wastes hours debugging at 2am. The type system is documentation that cannot go stale.

## Key Patterns for BoardClaude

### Interface-First Design
Use `interface` for all object shapes. Reserve `type` for unions, intersections, and mapped types.

### Core Domain Interfaces

**AuditReport** — the top-level output of a panel audit:
```
interface AuditReport {
  audit_id: string;
  timestamp: string;                    // ISO-8601
  panel: string;
  project: string;
  composite_score: number;              // 0-100
  agent_scores: Record<string, AgentScore>;
  radar_data: readonly RadarDataPoint[];
  strengths: readonly string[];
  weaknesses: readonly string[];
  divergences: readonly Divergence[];
  action_items: readonly ActionItem[];
  iteration_delta: IterationDelta | null;
}
```

**AgentScore** — individual agent evaluation:
```
interface AgentScore {
  total: number;                        // 0-100 weighted composite
  criteria: Record<string, number>;     // criterion name -> score
  key_findings: readonly string[];
  recommended_actions: readonly string[];
  verdict: Verdict;
  one_line: string;
}
```

**PanelConfig** — YAML panel definition parsed to TypeScript:
```
interface PanelConfig {
  name: string;
  type: 'professional' | 'personal';
  version: string;
  description: string;
  agents: readonly AgentConfig[];
  context?: PersonalContext;
  debate?: DebateConfig;
  scoring?: ScoringConfig;
}

interface AgentConfig {
  name: string;
  role: string;
  weight: number;                       // 0.0-1.0
  model?: 'opus' | 'sonnet';
  effort?: 'low' | 'medium' | 'high' | 'max';
  prompt: string;
}
```

**Supporting types:**
```
interface RadarDataPoint { axis: string; value: number; previousValue?: number; }
interface Divergence { topic: string; agents: Record<string, number>; analysis: string; }
interface ActionItem { priority: 1 | 2 | 3 | 4 | 5; action: string; impact: string; effort: 'low' | 'medium' | 'high'; }
interface IterationDelta { previous_score: number | null; change: number | null; improved: readonly string[]; regressed: readonly string[]; }
```

### Discriminated Unions
Use literal types to make invalid states unrepresentable:
```
type Verdict = 'STRONG_PASS' | 'PASS' | 'MARGINAL' | 'FAIL';
type PanelVerdict = 'SHIP' | 'CONTINUE' | 'PIVOT' | 'PAUSE';
type ModelTier = 'opus' | 'sonnet';
type EffortLevel = 'low' | 'medium' | 'high' | 'max';
```

### Strict Null Handling
With `strictNullChecks` and `exactOptionalPropertyTypes`, handle optional data explicitly:
```
const audit = getAudit(id);           // Returns AuditReport | null
if (audit === null) { /* 404 */ }     // Must handle null
if (audit.iteration_delta !== null) { // Safe to access delta fields
  // .previous_score, .change, etc.
}
```

### Use `unknown` Instead of `any`
When parsing external data, use `unknown` and narrow with type guards:
```
function parseAudit(data: unknown): AuditReport {
  if (!isValidAuditReport(data)) {
    throw new ParseError('Invalid audit format');
  }
  return data;
}

function isValidAuditReport(data: unknown): data is AuditReport {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj['audit_id'] === 'string' && typeof obj['composite_score'] === 'number';
}
```

### Named Exports and Readonly Arrays
- Named exports everywhere, default only for `page.tsx`
- Use `readonly T[]` for data that should not be mutated after parsing

## Configuration

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### What Each Strict Option Does

| Option | Purpose |
|--------|---------|
| `strict: true` | Enables all strict checks as baseline |
| `noUncheckedIndexedAccess` | Array/record index returns `T \| undefined` |
| `noImplicitReturns` | Every code path must return a value |
| `noFallthroughCasesInSwitch` | Switch cases must break or return |
| `forceConsistentCasingInFileNames` | Prevents cross-platform casing bugs |
| `exactOptionalPropertyTypes` | `prop?: string` means `string \| undefined` only |

## Component Skeletons

### File Organization
```
lib/types.ts     -- All domain interfaces, discriminated unions, component prop types
lib/utils.ts     -- getAgentColor, formatScore, calculateDelta
lib/parseAudit.ts -- parseAuditFile, isValidAuditReport type guard
lib/timeline.ts  -- parseTimeline, getLatestAuditId
```

### Component Prop Typing Pattern
```
interface AgentCardProps {
  agent: AgentScore;
  agentName: string;
  color: string;
}

interface RadarChartProps {
  data: readonly RadarDataPoint[];
  previousData?: readonly RadarDataPoint[];
  agentColors: Record<string, string>;
}
```

## Judge Evaluation Lens

**Lydia (Frontend/DX):** The strictest TS evaluator. Will check: Is `strict: true` enabled? Any `any` types? Is `noUncheckedIndexedAccess` on? Interfaces for object shapes? She will grep for `any` and deduct points for every occurrence.

**Boris (Architecture):** Values types as verification. The type system should make invalid states unrepresentable. Discriminated unions, proper null handling, clear data flow through types.

**Jason (Integration):** Cares about type exports for plugin consumers. Can external code import the types it needs? Is the public API surface well-typed?

**Ado (DevRel/Docs):** Types ARE documentation. Well-named interfaces serve as the API reference.

## Common Pitfalls

- Do NOT use `any` — use `unknown` and narrow with type guards
- Do NOT use `as` type assertions to silence errors — fix the underlying type
- Do NOT use `!` non-null assertion — handle null explicitly
- Do NOT use `enum` — use discriminated union literal types
- Do NOT use `Function` type — use specific signatures like `(score: number) => string`
- Do NOT skip typing component props — every component gets a `Props` interface
- Do NOT forget `noUncheckedIndexedAccess` — index access is unsafe without it

## Quick Reference

| Pattern | Approach |
|---------|----------|
| Object shapes | `interface` (not `type`) |
| Union types | `type Verdict = 'PASS' \| 'FAIL'` |
| Optional data | `prop: T \| null` or `prop?: T` with strict checks |
| External data | Parse as `unknown`, validate with type guards |
| Array immutability | `readonly T[]` for data not mutated after parse |
| Component props | `interface FooProps { ... }` with named export |
| Exports | Named exports everywhere, default only for page.tsx |
| Index access | Returns `T \| undefined` with `noUncheckedIndexedAccess` |
| Score range | `number` (0-100), validated at parse boundary |
| Timestamps | `string` (ISO-8601), not `Date` in JSON |
