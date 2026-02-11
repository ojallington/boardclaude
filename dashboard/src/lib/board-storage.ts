/**
 * localStorage CRUD for board builder state.
 */

import type { SerializedPanel } from "./panel-serializer";

const STORAGE_KEY = "boardclaude-builder-panels";

export function loadSavedPanels(): SerializedPanel[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePanel(panel: SerializedPanel): void {
  if (typeof window === "undefined") return;
  const panels = loadSavedPanels();
  const idx = panels.findIndex((p) => p.name === panel.name);
  if (idx >= 0) {
    panels[idx] = panel;
  } else {
    panels.push(panel);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
}

export function deletePanel(name: string): void {
  if (typeof window === "undefined") return;
  const panels = loadSavedPanels().filter((p) => p.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
}
