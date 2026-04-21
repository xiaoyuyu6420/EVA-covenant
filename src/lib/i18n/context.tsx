"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Lang = "zh-CN" | "zh-TW" | "en" | "ja" | "ko";

export const LANG_LABELS: Record<Lang, string> = {
  "zh-CN": "中文",
  "zh-TW": "繁體",
  en: "EN",
  ja: "日本語",
  ko: "한국어",
};

type TranslationDict = Record<string, string | ((...args: unknown[]) => string)>;

const STORAGE_KEY = "eva-lang";

import { translations } from "./translations";

function getTranslations(lang: Lang): TranslationDict {
  return translations[lang] ?? translations["zh-CN"];
}

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, ...args: unknown[]) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh-CN");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && translations[saved]) {
      setLangState(saved);
      return;
    }
    // Auto-detect browser language
    const browserLang = navigator.language || "";
    const detected: Lang = browserLang.startsWith("ja") ? "ja"
      : browserLang.startsWith("ko") ? "ko"
      : browserLang.startsWith("zh") && (browserLang.includes("TW") || browserLang.includes("HK") || browserLang.includes("Hant"))
        ? "zh-TW"
      : browserLang.startsWith("zh") ? "zh-CN"
      : "en";
    setLangState(detected);
    localStorage.setItem(STORAGE_KEY, detected);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, ...args: unknown[]): string => {
      const dict = getTranslations(lang);
      const val = dict[key];
      if (typeof val === "function") return val(...args);
      return val ?? key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
