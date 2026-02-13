import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";

// ─── Mocks ──────────────────────────────────────────────────────────

// Mock next/link to avoid Next.js-specific runtime
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock next/navigation for client components
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock the HeroTrySection (client component with useRouter)
vi.mock("@/components/HeroTrySection", () => ({
  HeroTrySection: () => <div data-testid="hero-try-section">TrySection</div>,
}));

// Mock audit-loader so the async server component doesn't hit the filesystem
vi.mock("@/lib/audit-loader", () => ({
  getProjectState: vi.fn().mockResolvedValue(null),
}));

// Mock StoryScoreChart (client component with Recharts) to avoid heavy imports
vi.mock("@/components/story/StoryScoreChart", () => ({
  StoryScoreChart: () => <div data-testid="story-score-chart">ScoreChart</div>,
}));

// ─── Tests ──────────────────────────────────────────────────────────

describe("Page smoke tests", () => {
  it("landing page module exports a default function component", async () => {
    const mod = await import("../page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("results page module exports a default async function and metadata", async () => {
    const mod = await import("../results/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");

    // Metadata should have title and description
    expect(mod.metadata).toBeDefined();
    expect(typeof mod.metadata.title).toBe("string");
    expect(typeof mod.metadata.description).toBe("string");
    expect((mod.metadata.title as string).length).toBeGreaterThan(0);
    expect((mod.metadata.description as string).length).toBeGreaterThan(0);
  });

  it("landing page renders to HTML without throwing", async () => {
    const { default: HomePage } = await import("../page");
    const element = await HomePage();
    const html = renderToString(element);

    // Should contain key structural elements
    expect(html).toContain("BoardClaude");
    expect(html).toContain("How It Was Built");
    expect(html).toContain("The Panel");
    expect(html).toContain("How It Works");
    expect(html).toContain("Features");
    expect(html).toContain("Get Started");
  });

  it("messages object has all keys used by the landing page", async () => {
    const { messages } = await import("@/lib/messages");

    // Top-level sections referenced in page.tsx
    const requiredSections = [
      "hero",
      "story",
      "install",
      "howItWorks",
      "panel",
      "features",
      "footer",
      "loop",
    ] as const;

    for (const section of requiredSections) {
      expect(messages[section]).toBeDefined();
    }

    // Specific nested keys accessed in page.tsx
    expect(messages.hero.tagline).toBeDefined();
    expect(messages.hero.description).toBeDefined();
    expect(messages.story.heading).toBeDefined();
    expect(Array.isArray(messages.story.paragraphs)).toBe(true);
    expect(messages.story.paragraphs.length).toBeGreaterThan(0);
    expect(messages.install.heading).toBeDefined();
    expect(messages.install.command).toBeDefined();
    expect(messages.install.hintCommand).toBeDefined();
    expect(messages.howItWorks.heading).toBeDefined();
    expect(Array.isArray(messages.howItWorks.steps)).toBe(true);
    expect(messages.panel.heading).toBeDefined();
    expect(messages.panel.description).toBeDefined();
    expect(messages.panel.disclaimer).toBeDefined();
    expect(Array.isArray(messages.panel.agents)).toBe(true);
    expect(messages.panel.agents.length).toBe(6);
    expect(messages.features.heading).toBeDefined();
    expect(Array.isArray(messages.features.items)).toBe(true);
    expect(messages.footer.builtFor).toBeDefined();
    expect(messages.footer.hackathonName).toBeDefined();
    expect(messages.footer.github).toBeDefined();
    expect(messages.loop.heading).toBeDefined();
    expect(messages.loop.description).toBeDefined();
    expect(Array.isArray(messages.loop.steps)).toBe(true);
    expect(messages.loop.progression).toBeDefined();
    expect(messages.loop.cta).toBeDefined();
  });

  it("story page module exports a default function and metadata", async () => {
    const mod = await import("../story/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
    expect(mod.metadata).toBeDefined();
  });

  it("each panel agent has required key, fullName, and role fields", async () => {
    const { messages } = await import("@/lib/messages");
    const expectedAgentKeys = [
      "boris",
      "cat",
      "thariq",
      "lydia",
      "ado",
      "jason",
    ];

    for (const agent of messages.panel.agents) {
      expect(typeof agent.key).toBe("string");
      expect(typeof agent.fullName).toBe("string");
      expect(typeof agent.role).toBe("string");
      expect(agent.key.length).toBeGreaterThan(0);
      expect(agent.fullName.length).toBeGreaterThan(0);
      expect(agent.role.length).toBeGreaterThan(0);
    }

    const actualKeys = messages.panel.agents.map((a) => a.key);
    expect(actualKeys).toEqual(expectedAgentKeys);
  });
});
