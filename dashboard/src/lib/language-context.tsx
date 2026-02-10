"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/** Supported locale codes. Extend as translations are added. */
export type SupportedLocale = "en" | "es" | "fr" | "de" | "ja" | "zh" | "ko";

const SUPPORTED_LOCALES: SupportedLocale[] = [
  "en",
  "es",
  "fr",
  "de",
  "ja",
  "zh",
  "ko",
];

interface LanguageContextValue {
  /** Current active locale */
  locale: SupportedLocale;
  /** Update the active locale */
  setLocale: (locale: SupportedLocale) => void;
  /** All supported locale codes */
  supportedLocales: readonly SupportedLocale[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Detect the best matching supported locale from the browser's language
 * preferences. Falls back to "en" if no match is found.
 */
function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === "undefined") return "en";

  for (const lang of navigator.languages ?? [navigator.language]) {
    const prefix = lang.slice(0, 2).toLowerCase() as SupportedLocale;
    if (SUPPORTED_LOCALES.includes(prefix)) {
      return prefix;
    }
  }
  return "en";
}

const STORAGE_KEY = "boardclaude-locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>("en");

  // On mount: restore from localStorage or detect from browser
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      setLocaleState(stored as SupportedLocale);
    } else {
      setLocaleState(detectBrowserLocale());
    }
  }, []);

  // Sync html lang attribute whenever locale changes
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <LanguageContext
      value={{ locale, setLocale, supportedLocales: SUPPORTED_LOCALES }}
    >
      {children}
    </LanguageContext>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
