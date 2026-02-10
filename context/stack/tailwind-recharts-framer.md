# Tailwind CSS + Recharts + Framer Motion — BoardClaude Stack Reference

## Why This Choice

Tailwind CSS v4 enables rapid iteration with a consistent design system and zero CSS-in-JS overhead. Recharts provides clean React-native charting with first-class radar chart support — D3 is overkill and risks a time sink. Framer Motion is the production-grade React animation library, making score counters, card entrances, and chart animations declarative. Together they create a polished dashboard that Lydia values for visual quality and Cat values for "fun factor."

## Key Patterns for BoardClaude

### Tailwind CSS v4 Setup

**CSS-First Configuration:** Tailwind v4 replaces `tailwind.config.js` with `@theme` blocks in CSS. Tokens become CSS custom properties automatically.

**Dark Mode with Class Toggle:**
```css
@import 'tailwindcss';
@custom-variant dark (&:where(.dark, .dark *));
```
Toggle by adding/removing `.dark` on `<html>`. Store in localStorage, default to dark.

### Design Token System

**Agent Colors** (defined once in `@theme`, used everywhere):
Boris=#3B82F6 (blue), Cat=#8B5CF6 (violet), Thariq=#06B6D4 (cyan), Lydia=#F59E0B (amber), Ado=#10B981 (emerald), Jason=#EF4444 (red), Synthesis=#6366F1 (indigo)

**Surface Colors** (dark default, light mode override):

| Token | Dark | Light |
|-------|------|-------|
| surface | #09090B (zinc-950) | #FFFFFF |
| surface-raised | #18181B (zinc-900) | #F4F4F5 |
| border | #3F3F46 (zinc-700) | #D4D4D8 |
| text-primary | #FAFAFA (zinc-50) | #09090B |
| text-secondary | #A1A1AA (zinc-400) | #71717A |

### Card Pattern — Colored Left Border
Each agent card has a left border in the agent's color:
```
Container: bg-surface-raised rounded-xl border border-border
Left accent: border-l-4 with agent color
Header: name + role, animated score
Body: key findings, verdict badge
```

### Typography Scale

| Element | Classes |
|---------|---------|
| Page title | `text-3xl font-bold tracking-tight` |
| Section header | `text-xl font-semibold` |
| Card title | `text-lg font-medium` |
| Body text | `text-sm text-text-secondary` |
| Score display | `text-4xl font-bold tabular-nums` |
| Mono/code | `font-mono text-xs` |

### Recharts RadarChart

**Component Hierarchy:**
```
<ResponsiveContainer width="100%" height={400}>
  <RadarChart outerRadius="80%" data={radarData}>
    <PolarGrid gridType="polygon" />
    <PolarAngleAxis dataKey="axis" />
    <PolarRadiusAxis angle={30} domain={[0, 100]} />
    <Radar name="Current" dataKey="value" fill="accent" fillOpacity={0.3} />
    {previousData && (
      <Radar name="Previous" dataKey="previousValue" fill="none" strokeDasharray="4 4" />
    )}
  </RadarChart>
</ResponsiveContainer>
```

**Data Format (6-axis, one per agent evaluation domain):**
```
const radarData = [
  { axis: 'Architecture', value: 82, previousValue: 65 },
  { axis: 'Product',      value: 85, previousValue: 70 },
  { axis: 'AI/Research',  value: 88, previousValue: 72 },
  { axis: 'Frontend/DX',  value: 78, previousValue: 55 },
  { axis: 'Docs/A11y',    value: 75, previousValue: 60 },
  { axis: 'Integration',  value: 71, previousValue: 58 },
];
```

**Iteration Overlay:** Current scores as filled polygon, previous as dashed outline. Visually communicates the self-improvement story.

### Framer Motion Patterns

**Score Count-Up:** Animate from 0 to final value on viewport entry using `useMotionValue` + `useTransform` + `useInView`. Duration 1.2s, easeOut. Use `tabular-nums` for stable digit width.

**Card Entrance Stagger:**
```
Parent: staggerChildren: 0.1, delayChildren: 0.2
Child:  hidden { opacity: 0, y: 20 } -> visible { opacity: 1, y: 0 } (350ms easeOut)
```

**Radar Drawing:** Built-in Recharts animation via `isAnimationActive={true}` and `animationDuration={1200}`.

**Page Transitions:** `initial: { opacity: 0, y: 8 }` -> `animate: { opacity: 1, y: 0 }` (200ms).

**Verdict Badge:** Spring animation: `{ type: 'spring', stiffness: 300, damping: 20 }`.

**Reduced Motion:** Wrap app in `<MotionConfig reducedMotion="user">` to respect `prefers-reduced-motion`.

## Configuration

### globals.css (Tailwind v4 Entry Point)
```css
@import 'tailwindcss';
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-inter: 'Inter', system-ui, sans-serif;
  --color-agent-boris: #3B82F6;
  --color-agent-cat: #8B5CF6;
  --color-agent-thariq: #06B6D4;
  --color-agent-lydia: #F59E0B;
  --color-agent-ado: #10B981;
  --color-agent-jason: #EF4444;
  --color-agent-synthesis: #6366F1;
  --color-surface: #09090B;
  --color-surface-raised: #18181B;
  --color-border: #3F3F46;
  --color-text-primary: #FAFAFA;
  --color-text-secondary: #A1A1AA;
  --color-accent: #3B82F6;
}
```

### Agent Color Map (TypeScript)
```
const AGENT_COLORS: Record<string, string> = {
  boris: '#3B82F6', cat: '#8B5CF6', thariq: '#06B6D4',
  lydia: '#F59E0B', ado: '#10B981', jason: '#EF4444', synthesis: '#6366F1',
};
```

## Component Skeletons

### AgentCard (client component)
```
props: { agent: AgentScore, agentName: string, color: string }
<motion.div variants={cardVariant}>
  <div className="border-l-4" style={{ borderColor: color }}>
    <header> <ColorDot /> <name> <AnimatedScore /> </header>
    <ProgressBar value={agent.total} color={color} />
    <FindingsList items={agent.key_findings} />
    <VerdictBadge verdict={agent.verdict} />
  </div>
</motion.div>
```

### RadarChartWrapper (client component)
```
props: { data: RadarDataPoint[], previousData?: RadarDataPoint[] }
<ResponsiveContainer> -> <RadarChart> -> <PolarGrid> + <PolarAngleAxis> + <Radar>
Optional second <Radar> with strokeDasharray for iteration overlay
```

## Judge Evaluation Lens

**Lydia (Frontend/DX):** Coherent design system, consistent spacing, proper dark mode. Semantic tokens not raw hex. Responsive charts. Animations enhance UX, don't distract. Loading skeletons match final layout. Reduced motion respected.

**Cat (Product):** Score count-up and radar drawing create an emotional demo hook. Iteration overlay tells the improvement story at a glance. This is visual proof of BoardClaude's value.

**Boris (Architecture):** Design system should be simple and systematic. Colors defined once, used everywhere. Card pattern is one reusable component, not copy-pasted.

**Ado (DevRel/Docs):** Color contrast AA minimum. Focus indicators visible. Dark mode is not an afterthought.

## Common Pitfalls

- Do NOT import all of Recharts — import only needed components
- Do NOT set fixed pixel dimensions on charts — use ResponsiveContainer
- Do NOT use Framer Motion's full bundle — use `LazyMotion` with `domAnimation`
- Do NOT animate layout properties (width, height) — use transforms only
- Do NOT stagger more than 10 items — it becomes tedious, not delightful
- Do NOT hardcode colors — reference the token system
- Do NOT forget `tabular-nums` on score displays
- Do NOT skip reduced motion — non-negotiable for accessibility

## Quick Reference

| Animation | Duration | Easing |
|-----------|----------|--------|
| Score count-up | 1200ms | easeOut |
| Card stagger | 100ms gap | easeOut, 350ms each |
| Radar draw | 1200ms | ease-out (Recharts) |
| Page transition | 200ms | easeInOut |
| Verdict badge | spring | stiffness: 300, damping: 20 |

| Recharts Component | Purpose |
|-------------------|---------|
| `RadarChart` | Container for radar visualization |
| `PolarGrid` | Background grid (polygon or circle) |
| `PolarAngleAxis` | Labels around perimeter (axis names) |
| `PolarRadiusAxis` | Radial scale (0-100) |
| `Radar` | Data polygon fill + stroke |
| `ResponsiveContainer` | Adaptive sizing wrapper |
