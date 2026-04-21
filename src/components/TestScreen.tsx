"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n/context";
import type { QuestionItem } from "@/hooks/useQuiz";

interface Props {
  currentQ: number;
  totalQ: number;
  progress: number;
  question: QuestionItem;
  onAnswer: (optionIndex: number) => void;
  onRestart: () => void;
}

export default function TestScreen({ currentQ, totalQ, progress, question, onAnswer, onRestart }: Props) {
  const isGate = question.type === "gate";
  const t = useT();
  const isTrigger = question.type === "trigger";
  const syncRate = (progress * 100).toFixed(1);

  return (
    <div className="flex-1 flex flex-col px-5 py-5">
      {/* Header */}
      <div
        className="flex justify-between items-center pb-1.5 mb-5 border-b border-[#333] text-[0.8rem] tracking-[2px] uppercase"
        style={{ fontFamily: "var(--font-tech)" }}
      >
        <span style={{ color: "var(--nerv-orange)" }}>{t("test.header")}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={onRestart}
            className="text-[0.7rem] text-[#555] hover:text-[var(--nerv-orange)] transition-colors cursor-pointer tracking-[1px]"
          >
            ✕ {t("test.exit")}
          </button>
          <span>Q: {currentQ + 1}/{totalQ}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-7">
        <div className="h-1 bg-[#222] w-full relative">
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{ backgroundColor: "var(--eva-green)", width: `${syncRate}%`, boxShadow: "0 0 10px var(--eva-green)" }}
            initial={false}
            animate={{ width: `${syncRate}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
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
          {isGate && (
            <div
              className="inline-block self-start px-2 py-0.5 mb-4 text-xs font-bold"
              style={{ backgroundColor: "var(--nerv-red)", color: "#000", fontFamily: "var(--font-tech)", animation: "blink 1s infinite" }}
            >
              {t("test.gate")}
            </div>
          )}
          {isTrigger && (
            <div
              className="inline-block self-start px-2 py-0.5 mb-4 text-xs font-bold"
              style={{ backgroundColor: "var(--theme-color)", color: "#fff", fontFamily: "var(--font-tech)" }}
            >
              {t("test.trigger")}
            </div>
          )}

          {/* Question text */}
          <p
            className="text-[1.4rem] leading-[1.5] text-white mb-10"
            style={{ fontFamily: "var(--font-title)" }}
          >
            {question.text}
          </p>

          {/* Options */}
          <div className="flex flex-col gap-4 mt-auto">
            {question.options.map((opt, idx) => (
              <motion.button
                key={idx}
                onClick={() => onAnswer(idx)}
                className="flex items-center text-left px-4 py-4 bg-[#0a0a0a] border border-[#333]
                           hover:border-[var(--theme-color)] hover:bg-[var(--theme-glow)]
                           transition-all duration-200 cursor-pointer"
                whileTap={{ scale: 0.98 }}
              >
                <span
                  className="font-bold text-[1.2rem] mr-4"
                  style={{ fontFamily: "var(--font-tech)", color: "var(--theme-color)" }}
                >
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span
                  className="text-[#ccc] text-[0.95rem]"
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
        {t("test.hint")}
      </p>
    </div>
  );
}
