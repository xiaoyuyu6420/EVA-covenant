"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n/context";
import type { QuestionItem } from "@/hooks/useQuiz";
import { DIMENSIONS } from "@/lib/types";
import { useEffect, useState, useRef } from "react";

interface Props {
  currentQ: number;
  totalQ: number;
  progress: number;
  question: QuestionItem;
  onAnswer: (optionIndex: number) => void;
  onRestart: () => void;
}

const ZONE_LABELS = [
  { at: 0, text: "第一战区 — A模型「同步·韧性·心之壁」", emoji: "🌀" },
  { at: 6, text: "第二战区 — B模型「攻击·战术·决断」", emoji: "⚔️" },
  { at: 12, text: "第三战区 — C模型「共情·孤独·表达」", emoji: "💫" },
  { at: 18, text: "第四战区 — D模型「责任·自我·存在」", emoji: "🔭" },
  { at: 24, text: "第五战区 — E模型「独立·信任·领导」", emoji: "👑" },
];

function getZoneLabel(idx: number) {
  let label = ZONE_LABELS[0];
  for (const z of ZONE_LABELS) {
    if (idx >= z.at) label = z;
  }
  return label;
}

export default function TestScreen({ currentQ, totalQ, progress, question, onAnswer, onRestart }: Props) {
  const isGate = question.type === "gate";
  const t = useT();
  const isTrigger = question.type === "trigger";
  const syncRate = (progress * 100).toFixed(1);
  const optCount = question.options.length;
  const dimCode = question.dimIndex !== undefined ? DIMENSIONS[question.dimIndex]?.code : undefined;
  const dimInfo = dimCode ? DIMENSIONS.find(d => d.code === dimCode) : undefined;
  const zone = getZoneLabel(currentQ);
  const remaining = totalQ - currentQ - 1;
  const estMin = Math.max(1, Math.round(remaining * 0.2));

  const [glitch, setGlitch] = useState(false);
  const glitchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      const delay = 3000 + Math.random() * 8000;
      glitchTimeout.current = setTimeout(() => {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150 + Math.random() * 200);
        schedule();
      }, delay);
    };
    schedule();
    return () => { if (glitchTimeout.current) clearTimeout(glitchTimeout.current); };
  }, []);

  return (
    <div className="flex-1 flex flex-col px-5 py-5">
      {/* Header */}
      <div
        className="flex justify-between items-center pb-1.5 mb-5 border-b border-[#333] text-[0.8rem] tracking-[2px] uppercase"
        style={{ fontFamily: "var(--font-tech)" }}
      >
        <button
          onClick={onRestart}
          className="text-[0.7rem] text-[#555] hover:text-[var(--nerv-orange)] transition-colors cursor-pointer tracking-[1px] shrink-0"
        >
          ✕ {t("test.exit")}
        </button>
        <span className="text-[0.75rem] text-[var(--nerv-orange)] truncate mx-2">{t("test.header")}</span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                const el = document.documentElement;
                const req = el.requestFullscreen || (el as any).webkitRequestFullscreen;
                if (req) req.call(el).catch(() => {});
              }
            }}
            className="text-[0.7rem] text-[#555] hover:text-[var(--nerv-orange)] transition-colors cursor-pointer"
          >
            ⛶ 全屏
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[0.65rem] text-[#555]" style={{ fontFamily: "var(--font-tech)" }}>
            {isGate ? "⚡ COMMANDER DISPATCH" : isTrigger ? "⊙ DEEP ANALYSIS" : `Q ${currentQ + 1} / ${totalQ}`}
          </span>
          <span className="text-[0.65rem] text-[var(--eva-green)]" style={{ fontFamily: "var(--font-tech)" }}>
            {syncRate}%
          </span>
        </div>
        <div className="h-1 bg-[#222] w-full relative">
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{ backgroundColor: "var(--eva-green)", width: `${syncRate}%`, boxShadow: "0 0 10px var(--eva-green)" }}
            initial={false}
            animate={{ width: `${syncRate}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[0.6rem] text-[#444]" style={{ fontFamily: "var(--font-tech)" }}>
            ≈{estMin}min
          </span>
          <span className="text-[0.6rem] text-[#444]" style={{ fontFamily: "var(--font-tech)" }}>
            {currentQ + 1}/{totalQ}
          </span>
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          {/* Tags */}
          <div className="flex items-center gap-2 mb-4">
            {isGate && (
              <span
                className="inline-block px-2 py-0.5 text-xs font-bold"
                style={{ backgroundColor: "var(--nerv-red)", color: "#000", fontFamily: "var(--font-tech)", animation: "blink 1s infinite" }}
              >
                司令下派
              </span>
            )}
            {isTrigger && (
              <span
                className="inline-block px-2 py-0.5 text-xs font-bold"
                style={{ backgroundColor: "var(--theme-color)", color: "#fff", fontFamily: "var(--font-tech)" }}
              >
                {t("test.trigger")}
              </span>
            )}
          </div>

          {/* Question text */}
          <p
            className="text-[1.4rem] leading-[1.5] text-white mb-5"
            style={{
              fontFamily: "var(--font-title)",
              filter: glitch ? `blur(${1 + Math.random() * 2}px) brightness(${0.4 + Math.random() * 0.4})` : "none",
              transform: glitch ? `translateX(${(Math.random() - 0.5) * 4}px)` : "none",
              textShadow: glitch ? `0 0 8px rgba(255,0,60,0.6)` : "none",
              transition: "filter 0.05s, transform 0.05s",
            }}
          >
            {question.text}
          </p>

          {/* Options */}
          <div className="flex flex-col gap-3 mt-2">
            {question.options.map((opt, idx) => (
              <motion.button
                key={idx}
                onClick={() => onAnswer(idx)}
                className="flex items-center text-left px-4 py-3 bg-[#0a0a0a] border border-[#333]
                           hover:border-[var(--theme-color)]
                           eva-btn eva-btn-option transition-colors cursor-pointer"
                whileTap={{ scale: 0.98 }}
              >
                <span
                  className="font-bold text-[1.2rem] mr-4 relative z-10"
                  style={{ fontFamily: "var(--font-tech)", color: "var(--theme-color)" }}
                >
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span
                  className="text-[#ccc] text-[0.95rem] relative z-10"
                  style={{ fontFamily: "var(--font-title)" }}
                >
                  {opt.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Keyboard hint */}
      <p
        className="text-center mt-5 text-[0.7rem] text-[var(--muted-foreground)]"
        style={{ fontFamily: "var(--font-tech)" }}
      >
        {optCount <= 5
          ? t("test.hint").replace("1 / 2 / 3", Array.from({ length: Math.min(optCount, 9) }, (_, i) => i + 1).join(" / "))
          : ""
        }
      </p>
    </div>
  );
}
