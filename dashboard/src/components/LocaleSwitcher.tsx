"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/request";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Espanol",
  fr: "Francais",
  de: "Deutsch",
  ja: "\u65e5\u672c\u8a9e",
  zh: "\u4e2d\u6587",
  ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value;
    startTransition(() => {
      document.cookie = `locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
      window.location.reload();
    });
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={isPending}
      aria-label="Language"
      className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:opacity-50"
    >
      {Object.entries(LOCALE_LABELS).map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
