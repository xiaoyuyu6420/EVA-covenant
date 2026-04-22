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

function detectLang(): Lang {
  if (typeof window === "undefined") return "zh-CN";
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && translations[saved]) return saved;
  const bl = navigator.language || "";
  return bl.startsWith("ja") ? "ja"
    : bl.startsWith("ko") ? "ko"
    : bl.startsWith("zh") && (bl.includes("TW") || bl.includes("HK") || bl.includes("Hant")) ? "zh-TW"
    : bl.startsWith("zh") ? "zh-CN"
    : "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

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
