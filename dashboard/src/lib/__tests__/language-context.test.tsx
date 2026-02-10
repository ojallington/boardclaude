import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "../language-context";
import type { SupportedLocale } from "../language-context";

function wrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe("LanguageProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("provides default locale 'en'", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.locale).toBe("en");
  });

  it("exposes supported locales list", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.supportedLocales).toContain("en");
    expect(result.current.supportedLocales).toContain("es");
    expect(result.current.supportedLocales).toContain("ja");
    expect(result.current.supportedLocales.length).toBeGreaterThanOrEqual(7);
  });

  it("setLocale updates the locale", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => {
      result.current.setLocale("fr");
    });
    expect(result.current.locale).toBe("fr");
  });

  it("setLocale persists to localStorage", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => {
      result.current.setLocale("de");
    });
    expect(localStorage.getItem("boardclaude-locale")).toBe("de");
  });

  it("setLocale updates document.documentElement.lang", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => {
      result.current.setLocale("ja");
    });
    expect(document.documentElement.lang).toBe("ja");
  });

  it("restores locale from localStorage on mount", () => {
    localStorage.setItem("boardclaude-locale", "ko");
    const { result } = renderHook(() => useLanguage(), { wrapper });
    // After useEffect runs, locale should be restored
    expect(result.current.locale).toBe("ko");
  });

  it("throws when used outside LanguageProvider", () => {
    expect(() => {
      renderHook(() => useLanguage());
    }).toThrow("useLanguage must be used within a LanguageProvider");
  });
});
