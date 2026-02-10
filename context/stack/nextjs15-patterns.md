# Next.js 15 App Router Patterns — BoardClaude Stack Reference

## Why This Choice

Next.js 15 with App Router is the natural choice because judge Lydia Hallie co-authored patterns.dev and teaches React/Next.js patterns on Frontend Masters. Using modern patterns (RSC, Suspense boundaries, streaming SSR) demonstrates mastery of what she evaluates. Boris values the simplicity of file-based routing and server-first architecture — no unnecessary client-side complexity.

## Key Patterns for BoardClaude

### Server Components by Default
Every component is a Server Component unless explicitly marked with `'use client'`. This means:
- Data fetching happens on the server, close to the data source (`.boardclaude/` directory)
- Zero JavaScript shipped for server-rendered components
- Smaller bundles, faster initial loads
- Only add `'use client'` when the component needs interactivity, state, or browser APIs

### Client Component Boundaries
Keep client components small and leaf-like. The dashboard needs `'use client'` for:
- RadarChart (Recharts requires browser DOM)
- AgentCard score animations (Framer Motion)
- AuditStream live updates (SSE/polling state)
- Theme toggle (localStorage + class manipulation)
- PanelConfig YAML editor (interactive textarea)

Everything else — layout shells, page structure, data loading — stays as Server Components.

### Suspense Boundaries for Streaming
Wrap slow async operations in `<Suspense>` with meaningful fallback UI:
- Audit data loading: show skeleton cards while agents evaluate
- Radar chart: show placeholder circle while scores compute
- Timeline: show simplified tree while full history loads
- Each agent card can stream independently as that agent completes

### File-Based Routing Structure
```
app/
  layout.tsx          -- Root shell: sidebar nav + main content + dark mode provider
  page.tsx            -- Overview: latest audit summary + radar chart
  loading.tsx         -- Root loading skeleton
  error.tsx           -- Root error boundary with recovery
  audit/
    [id]/
      page.tsx        -- Full audit detail: all agent cards + findings
      loading.tsx     -- Audit-specific skeleton
  timeline/
    page.tsx          -- Branching tree visualization
  compare/
    page.tsx          -- Side-by-side branch comparison
  panel/
    page.tsx          -- Panel config viewer/editor
```

### Data Fetching Pattern
Server Components read directly from the `.boardclaude/` directory:
- `audits/*.json` for audit results
- `state.json` for current state
- `timeline.json` for branching history
No API routes needed for MVP — file system IS the data layer.

### Font Loading with next/font
Use `next/font/google` to load Inter with zero layout shift:
- Variable weight support (400, 500, 600, 700)
- Automatic font optimization and self-hosting
- Apply via CSS variable for Tailwind integration

### Streaming SSR for Real-Time Audit Display
When an audit is running, use streaming to progressively reveal results:
- Page shell renders immediately (static layout)
- Each agent's evaluation streams in via Suspense as it completes
- Radar chart updates incrementally as scores arrive
- Composite score appears last (after synthesis agent)

## Configuration

### next.config.ts
```
// Key settings for BoardClaude dashboard
const nextConfig = {
  reactStrictMode: true,
  images: {
    // No external images needed — all generated UI
    unoptimized: false,
  },
  experimental: {
    // Enable Partial Prerendering when stable
    // ppr: true,
  },
};
```

### Project Init Command
```
npx create-next-app@latest dashboard \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

### Package Dependencies
```
npm install recharts framer-motion
npm install -D @types/node
```

## Component Skeletons

### Root Layout Structure
```
RootLayout
  props: { children: React.ReactNode }
  renders:
    <html lang="en" className={inter.variable}>
      <body className="bg-zinc-950 text-zinc-100">
        <div className="flex min-h-screen">
          <Sidebar />               -- Server Component: nav links
          <main className="flex-1 p-8">
            {children}               -- Page content streams here
          </main>
        </div>
      </body>
    </html>
```

### Overview Page Structure
```
OverviewPage (Server Component, async)
  reads: latest audit from .boardclaude/audits/
  renders:
    <h1>BoardClaude Dashboard</h1>
    <div className="grid grid-cols-3 gap-6">
      <Suspense fallback={<ScoreSkeleton />}>
        <CompositeScore auditId={latest.id} />
      </Suspense>
      <Suspense fallback={<RadarSkeleton />}>
        <RadarChartWrapper data={latest.radar_data} />   -- 'use client'
      </Suspense>
      <Suspense fallback={<ActionsSkeleton />}>
        <TopActions items={latest.action_items} />
      </Suspense>
    </div>
    <Suspense fallback={<CardGridSkeleton count={6} />}>
      <AgentCardGrid agents={latest.agent_scores} />
    </Suspense>
```

### Audit Detail Page Structure
```
AuditDetailPage (Server Component, async)
  params: { id: string }
  reads: .boardclaude/audits/{id}.json
  renders:
    <AuditHeader audit={data} />
    <div className="grid grid-cols-2 gap-6">
      {agents.map(agent =>
        <Suspense key={agent.name} fallback={<AgentCardSkeleton />}>
          <AgentCard agent={agent} />           -- 'use client' for animations
        </Suspense>
      )}
    </div>
    <SynthesisPanel synthesis={data.synthesis} />
    <ActionItemList items={data.action_items} />
```

## Judge Evaluation Lens

**Lydia (Frontend/DX):** Will look for proper RSC usage — are Server Components the default? Are client boundaries minimal and intentional? Are Suspense boundaries placed strategically (not wrapping everything)? Is streaming used for progressive rendering? She will notice if `'use client'` is overused or if data fetching happens client-side when it could be server-side. Lighthouse 90+ on all Core Web Vitals is her baseline expectation.

**Boris (Architecture):** Values the simplicity of file-based routing. Each page has one job, clear data flow from file system to UI. No over-engineering — no GraphQL layer, no state management library, no API routes when file reads suffice. The architecture should be "surprisingly vanilla."

**Cat (Product):** Wants the dashboard to load fast and be immediately useful. Streaming means users see content progressively rather than staring at a blank screen. The page structure should tell a story: overview first, drill-down available.

**Jason (Integration):** Will check that error boundaries exist at route level. What happens when an audit file is malformed? When the `.boardclaude/` directory doesn't exist? Every error.tsx should provide recovery guidance.

## Common Pitfalls

- Do NOT put `'use client'` at the top of page.tsx files — pages should be Server Components
- Do NOT use `useEffect` for data fetching — read data in Server Components directly
- Do NOT import Recharts or Framer Motion in Server Components — they need the browser
- Do NOT nest Suspense boundaries too deeply — one per logical content block is enough
- Do NOT use `getServerSideProps` or `getStaticProps` — those are Pages Router patterns
- Do NOT forget error.tsx files — they catch rendering errors within route segments
- Do NOT pass non-serializable data (functions, classes) from Server to Client Components

## Quick Reference

| Pattern | Approach |
|---------|----------|
| Data fetching | Async Server Components reading JSON files |
| Interactivity | `'use client'` on leaf components only |
| Loading states | `loading.tsx` per route + `<Suspense>` per component |
| Error handling | `error.tsx` per route segment |
| Font loading | `next/font/google` with Inter, CSS variable |
| Styling | Tailwind CSS v4 utility classes |
| Charts | Recharts in client components |
| Animation | Framer Motion in client components |
| Routing | File-based: `/`, `/audit/[id]`, `/timeline`, `/compare`, `/panel` |
| Deployment | Vercel with automatic Next.js optimization |
| Performance target | Lighthouse 90+ (LCP < 2.5s, FID < 100ms, CLS < 0.1) |
| State management | None needed — file system is source of truth |
| API layer | None for MVP — Server Components read files directly |
