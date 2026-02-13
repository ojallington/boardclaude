"use client";

import { useTranslations } from "next-intl";

export function KeyboardHints() {
  const t = useTranslations("keyboard");

  const shortcuts = [
    { key: t("tab"), action: t("navigate") },
    { key: `${t("enter")} / ${t("space")}`, action: t("expandCard") },
  ];

  return (
    <div className="mt-8 border-t border-gray-800 pt-4">
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 text-xs text-gray-500 hover:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded">
          <svg
            className="h-3 w-3 transition-transform group-open:rotate-90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          {t("heading")}
        </summary>
        <div className="mt-2 ml-5 space-y-1">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <kbd className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-gray-400 border border-gray-700">
                {shortcut.key}
              </kbd>
              <span className="text-gray-500">{shortcut.action}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
