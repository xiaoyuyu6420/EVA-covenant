"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n, LANG_LABELS, type Lang } from "@/lib/i18n/context";

const LANGS: Lang[] = ["zh-CN", "zh-TW", "en", "ja", "ko"];

export default function LangSelector() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-[0.75rem] tracking-[1px] px-2 py-1 border border-[#444] text-[#888] hover:text-white hover:border-[#888] transition-colors cursor-pointer"
        style={{ fontFamily: "var(--font-tech)" }}
      >
        {LANG_LABELS[lang]} ▾
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 border border-[#444] bg-[#111] z-50 min-w-[80px]"
          style={{ fontFamily: "var(--font-tech)" }}
        >
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className={`block w-full text-left text-[0.75rem] px-3 py-1.5 cursor-pointer transition-colors ${
                l === lang ? "text-white bg-[#222]" : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
