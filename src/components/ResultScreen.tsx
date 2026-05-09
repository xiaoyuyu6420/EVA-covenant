"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import type { FullResult } from "@/lib/types";
import { DIMENSIONS } from "@/lib/types";
import { groups, personalityTypes } from "@/lib/quiz-data";
import { useT } from "@/lib/i18n/context";
import RadarChart from "./RadarChart";
import ShareCard from "./ShareCard";

const MODEL_GROUPS = [
  { key: "A", label: "适格性", labelEn: "PILOT COMPAT.", color: "#3b82f6" },
  { key: "B", label: "战斗风格", labelEn: "COMBAT STYLE", color: "#ef4444" },
  { key: "C", label: "情感模式", labelEn: "EMOTIONAL", color: "#a855f7" },
  { key: "D", label: "价值取向", labelEn: "VALUE SYSTEM", color: "#fbbf24" },
  { key: "E", label: "互动模式", labelEn: "INTERACTION", color: "#22c55e" },
];
const MODEL_COLORS = MODEL_GROUPS.map((g) => g.color);

const DIM_SHORT_NAMES = [
  "同步", "抗压", "心防",
  "攻击", "战术", "决断",
  "共情", "独处", "表达",
  "责任", "自我", "追问",
  "独行", "信任", "掌控",
];

interface Props {
  result: FullResult;
  onRestart: () => void;
}

interface ThemeColor {
  color: string;
  accent: string;
  glow: string;
}

const GROUP_THEME: Record<string, ThemeColor> = {
  unit00: { color: "#3b82f6", accent: "#fbbf24", glow: "rgba(59, 130, 246, 0.5)" },
  unit01: { color: "#52ff00", accent: "#a855f7", glow: "rgba(82, 255, 0, 0.5)" },
  unit02: { color: "#ef4444", accent: "#fbbf24", glow: "rgba(239, 68, 68, 0.5)" },
  unit03: { color: "#1e3a5f", accent: "#f97316", glow: "rgba(30, 58, 95, 0.5)" },
  unit04: { color: "#94a3b8", accent: "#ef4444", glow: "rgba(148, 163, 184, 0.4)" },
  unit05: { color: "#38bdf8", accent: "#4ade80", glow: "rgba(56, 189, 248, 0.5)" },
  mark06: { color: "#d4a017", accent: "#60a5fa", glow: "rgba(212, 160, 23, 0.5)" },
  unit08: { color: "#ec4899", accent: "#fb923c", glow: "rgba(236, 72, 153, 0.5)" },
  unit09: { color: "#3b82f6", accent: "#f0f0f0", glow: "rgba(59, 130, 246, 0.4)" },
  unit13: { color: "#be123c", accent: "#fbbf24", glow: "rgba(190, 18, 60, 0.5)" },
  unit82: { color: "#f43f5e", accent: "#ec4899", glow: "rgba(244, 63, 94, 0.5)" },
  adam: { color: "#f5f5f5", accent: "#d4a017", glow: "rgba(245, 245, 245, 0.4)" },
  special: { color: "#52ff00", accent: "#a855f7", glow: "rgba(82, 255, 0, 0.4)" },
  unit13special: { color: "#be123c", accent: "#fbbf24", glow: "rgba(190, 18, 60, 0.5)" },
};

function getEvaNumber(evaUnit?: string): string {
  if (!evaUnit) return "★";
  if (evaUnit.includes("零号")) return "00";
  if (evaUnit.includes("初号")) return "01";
  if (evaUnit.includes("贰号")) return "02";
  if (evaUnit.includes("参号")) return "03";
  if (evaUnit.includes("四号")) return "04";
  if (evaUnit.includes("五号")) return "05";
  if (evaUnit.includes("Mark")) return "06";
  if (evaUnit.includes("八号")) return "08";
  if (evaUnit.includes("九号")) return "09";
  if (evaUnit.includes("十三号")) return "13";
  if (evaUnit.includes("8+2")) return "8+2";
  if (evaUnit.includes("08+02")) return "8+2";
  const m = evaUnit.match(/(\d+)/);
  if (m) return m[1];
  return "★";
}

function getSilhouette(code: string, evaUnit?: string): string {
  if (code === "ADAM") return "ADAM";
  if (code === "CMPL") return "∞";
  if (code === "U13G") return "13";
  return getEvaNumber(evaUnit);
}

export default function ResultScreen({ result, onRestart }: Props) {
  const { top, top3, userScores } = result;
  const shareRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const t = useT();

  const personalityType = personalityTypes.find((p) => p.code === top.code);
  const groupKey = top.isSpecial
    ? (top.code === "CMPL" ? "special" : top.code === "U13G" ? "unit13special" : "adam")
    : (personalityType?.group ?? "adam");
  const theme = GROUP_THEME[groupKey] ?? GROUP_THEME.adam;
  const evaNum = getSilhouette(top.code, top.evaUnit);
  const group = groups[groupKey as keyof typeof groups] ?? null;

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", theme.color);
    document.documentElement.style.setProperty("--theme-glow", theme.glow);
    return () => {
      document.documentElement.style.removeProperty("--theme-color");
      document.documentElement.style.removeProperty("--theme-glow");
    };
  }, [theme]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    const shareUrl = typeof window !== "undefined" ? window.location.origin : "";
    const unitName = top.evaUnit || top.name;
    const shareText = t("result.shareText")
      .replace("{0}", unitName)
      .replace("{1}", `${top.similarity}`)
      .replace("{2}", shareUrl);
    const shareShort = t("result.shareShort")
      .replace("{0}", unitName)
      .replace("{1}", `${top.similarity}`);
    try {
      if (!shareRef.current) return;
      shareRef.current.style.opacity = "1";
      await new Promise<void>((r) => {
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100)));
      });
      const dataUrl = await toPng(shareRef.current, { pixelRatio: 2 });
      shareRef.current.style.opacity = "0";

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "eva-result.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "EVA Pilot Compatibility Test",
          text: shareShort,
          url: shareUrl,
          files: [file],
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `eva-${top.code}.png`;
        a.click();
      }
    } catch {
      if (shareRef.current) shareRef.current.style.opacity = "0";
      await navigator.clipboard.writeText(shareText);
      alert(t("result.copied"));
    } finally {
      setSharing(false);
    }
  }, [top, theme, t]);

  return (
    <div className="flex-1 flex flex-col px-5 py-5 max-w-[600px] mx-auto w-full">
      {/* Header */}
      <motion.div
        className="flex justify-between items-center pb-1.5 mb-5 border-b border-[#333] text-[0.85rem] tracking-[2px]"
        style={{ fontFamily: "var(--font-tech)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span style={{ color: "var(--nerv-orange)" }}>{t("result.header")}</span>
        <div className="flex items-center gap-2">
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
            ⛶
          </button>
          <span style={{ color: theme.color }}>{t("result.classification")}</span>
        </div>
      </motion.div>

      {/* Hero */}
      <motion.div
        className="py-5 mb-2 border-t border-b border-[#333] relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Pulsing background glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              `radial-gradient(ellipse 60% 50% at 30% 50%, ${theme.color}15, transparent)`,
              `radial-gradient(ellipse 60% 50% at 30% 50%, ${theme.color}25, transparent)`,
              `radial-gradient(ellipse 60% 50% at 30% 50%, ${theme.color}15, transparent)`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Scan line sweep */}
        <motion.div
          className="absolute left-0 right-0 h-[30%] pointer-events-none"
          style={{ background: `linear-gradient(180deg, transparent 0%, ${theme.color}08 50%, transparent 100%)` }}
          animate={{ top: ["-30%", "100%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center justify-center" style={{ minWidth: 110 }}>
            <svg width="100" height="100" viewBox="0 0 100 100" className="mb-1">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#222" strokeWidth="2" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none"
                stroke={theme.color} strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - top.similarity / 100) }}
                transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                transform="rotate(-90 50 50)"
                style={{ filter: `drop-shadow(0 0 4px ${theme.color})` }}
              />
              {/* Orbiting particle */}
              <motion.circle
                r="2.5" fill={theme.accent}
                animate={{
                  cx: [50 + 42 * Math.cos(0), 50 + 42 * Math.cos(Math.PI * 2)],
                  cy: [50 + 42 * Math.sin(0), 50 + 42 * Math.sin(Math.PI * 2)],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{ filter: `drop-shadow(0 0 3px ${theme.accent})` }}
              />
              <motion.text
                x="50" y="46" textAnchor="middle" dominantBaseline="central"
                fill={theme.accent} fontSize="28" fontWeight="bold"
                style={{ fontFamily: "var(--font-num)" }}
                animate={{
                  textShadow: [
                    `0 0 8px ${theme.glow}`,
                    `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}`,
                    `0 0 8px ${theme.glow}`,
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {evaNum}
              </motion.text>
              <text x="50" y="68" textAnchor="middle" fill="#555" fontSize="6" style={{ fontFamily: "var(--font-tech)" }}>
                EVA UNIT
              </text>
            </svg>
          </div>
          <div className="flex-1 text-right">
            <div className="text-[0.8rem] text-[#888] mb-1" style={{ fontFamily: "var(--font-tech)" }}>
              {t("result.syncRate")}
            </div>
            <motion.div
              className="text-[4.5rem] md:text-[5rem] leading-[0.9] text-white"
              style={{ fontFamily: "var(--font-num)" }}
              animate={{
                textShadow: [
                  `0 0 20px ${theme.color}, 0 0 40px ${theme.accent}`,
                  `0 0 30px ${theme.color}, 0 0 60px ${theme.accent}, 0 0 80px ${theme.color}`,
                  `0 0 20px ${theme.color}, 0 0 40px ${theme.accent}`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {top.similarity}
              <span className="text-[2rem]" style={{ color: theme.accent }}>%</span>
            </motion.div>
          </div>
        </div>

        {/* Designation line */}
        {group && (
          <motion.div
            className="mt-4 pt-3 border-t border-[#222]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ fontFamily: "var(--font-tech)" }}
          >
            <div className="text-[0.9rem] tracking-[2px] font-bold" style={{ color: theme.color }}>
              {group.eva}
            </div>
            <div className="text-[0.8rem] tracking-[1px] mt-0.5" style={{ color: "#888" }}>
              {group.jp}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Designation bar */}
      <motion.div
        className="mb-5 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        style={{ fontFamily: "var(--font-tech)" }}
      >
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${theme.color}44)` }} />
        <span className="text-[0.8rem] tracking-[3px] text-[#666]">SUBJECT PROFILE</span>
        <span className="text-[0.9rem] tracking-[2px] font-bold" style={{ color: theme.accent }}>
          {top.evaUnit || top.name}
        </span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(270deg, transparent, ${theme.color}44)` }} />
      </motion.div>

      {/* Analysis readout */}
      <motion.div
        className="mb-7 border-l-2 pl-4 py-1"
        style={{ borderColor: `${theme.color}66` }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <p className="text-[#bbb] text-[0.9rem] leading-[1.8]" style={{ fontFamily: "var(--font-title)" }}>
          {top.desc}
        </p>
      </motion.div>

      {/* MAGI Warning — personalized insight */}
      <MAGIWarning scores={userScores} theme={theme} />

      {/* Dimension gauges by model group */}
      <motion.div
        className="mb-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <p className="text-[0.75rem] text-[#666] mb-4 uppercase tracking-[2px]" style={{ fontFamily: "var(--font-tech)" }}>
          [ MAGI MODEL ANALYSIS ]
        </p>
        {MODEL_GROUPS.map((mg, gi) => {
          const startIdx = gi * 3;
          return (
            <div key={mg.key} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[0.65rem] tracking-[2px] font-bold px-1.5 py-0.5 border"
                  style={{ color: theme.color, borderColor: `${theme.color}44`, fontFamily: "var(--font-tech)" }}
                >
                  {mg.key}
                </span>
                <span className="text-[0.75rem] text-[#777]" style={{ fontFamily: "var(--font-tech)" }}>
                  {mg.label}
                </span>
              </div>
              <div className="flex justify-center gap-1">
                {Array.from({ length: 3 }, (_, di) => {
                  const idx = startIdx + di;
                  const score = userScores[idx];
                  const pct = score / 9;
                  const shortName = DIM_SHORT_NAMES[idx];
                  const r = 26;
                  const circ = 2 * Math.PI * r;
                  const dashOffset = circ * (1 - pct);
                  return (
                    <motion.div
                      key={idx}
                      className="flex flex-col items-center py-1.5"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.7 + idx * 0.04 }}
                    >
                      <svg width="60" height="60" viewBox="0 0 60 60">
                        <circle cx="30" cy="30" r={r} fill="none" stroke="#1a1a1a" strokeWidth="5" />
                        <motion.circle
                          cx="30" cy="30" r={r} fill="none"
                          stroke={theme.color} strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={circ}
                          initial={{ strokeDashoffset: circ }}
                          animate={{ strokeDashoffset: dashOffset }}
                          transition={{ duration: 0.8, delay: 0.8 + idx * 0.04, ease: "easeOut" }}
                          transform="rotate(-90 30 30)"
                          style={{ filter: `drop-shadow(0 0 4px ${theme.glow})` }}
                        />
                        <text
                          x="30" y="29" textAnchor="middle" dominantBaseline="central"
                          fill={theme.color} fontSize="18" fontWeight="bold"
                          style={{ fontFamily: "var(--font-num)" }}
                        >
                          {score}
                        </text>
                        <text x="30" y="42" textAnchor="middle" fill="#666" fontSize="6" style={{ fontFamily: "var(--font-tech)" }}>
                          /9
                        </text>
                      </svg>
                      <span className="text-[0.7rem] text-[#aaa] mt-0.5" style={{ fontFamily: "var(--font-tech)" }}>
                        {shortName}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Dimension Chart — Radar */}
      <motion.div
        className="border border-[#333] bg-[#0a0a0a] p-4 mb-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.75 }}
      >
        <p className="text-[0.8rem] text-[#888] mb-4 uppercase" style={{ fontFamily: "var(--font-tech)" }}>
          {t("result.chartTitle")}
        </p>
        <RadarChart
          scores={userScores}
          maxScore={9}
          color={theme.color}
          accent={theme.accent}
          glow={theme.glow}
          labels={DIM_SHORT_NAMES}
        />
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="flex gap-3 pb-4 mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.85 }}
      >
        <button
          onClick={onRestart}
          className="flex-1 py-3 text-center text-base font-bold tracking-[2px] cursor-pointer
                     border border-[var(--muted-foreground)] text-[var(--muted-foreground)] bg-transparent
                     eva-btn eva-btn-secondary uppercase transition-colors"
          style={{ fontFamily: "var(--font-title)" }}
        >
          <span className="relative z-10">{t("result.restart")}</span>
        </button>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 py-3 text-center text-base font-bold tracking-[2px] cursor-pointer
                     border bg-transparent
                     eva-btn eva-btn-theme uppercase transition-colors disabled:opacity-50"
          style={{ fontFamily: "var(--font-title)", borderColor: theme.color, color: theme.color }}
        >
          <span className="relative z-10">{sharing ? t("result.shareLoading") : t("result.share")}</span>
        </button>
      </motion.div>

      {/* Hidden share card for image generation */}
      <ShareCard ref={shareRef} top={top} userScores={userScores} theme={theme} />
    </div>
  );
}

function MAGIWarning({ scores, theme }: { scores: number[]; theme: ThemeColor }) {
  const s = (i: number) => scores[i] ?? 0;
  const warnings: string[] = [];

  const atField = s(2);
  const loneliness = s(7);
  if (atField >= 7 && loneliness >= 7) {
    warnings.push("AT力场强度与孤独倾向均处于高位——你正在用封闭保护一个可能并不存在的威胁。心之壁太厚，信号进不来，也出不去。");
  }

  const empathy = s(6);
  const expression = s(8);
  if (empathy >= 7 && expression <= 3) {
    warnings.push("共情力极高但表达方式极低——你比谁都懂别人在想什么，却从来不让自己被读懂。最深的孤独，是没有人知道你有多在乎。");
  }

  const responsibility = s(9);
  const selfAware = s(10);
  if (responsibility >= 8 && selfAware <= 3) {
    warnings.push("责任感极高而自我意识极低——你为所有人战斗，却从没问过自己值不值得。EVA不需要牺牲品，它需要活着回来的驾驶员。");
  }

  const attack = s(3);
  const tactic = s(4);
  if (attack >= 7 && tactic <= 3) {
    warnings.push("攻击性极高而战术性极低——你冲得最快，但也最可能冲进陷阱。暴走能赢一场战斗，却赢不了一场战争。");
  }

  const sync = s(0);
  const independence = s(12);
  if (sync >= 7 && independence >= 7) {
    warnings.push("同步率与独立性同时极高——你与EVA的链接越深，越不需要任何人。但完全不需要人类的驾驶员，离使徒只有一步之遥。");
  }

  const existence = s(11);
  if (existence >= 8) {
    warnings.push("存在追问极高——你不断追问「我为什么在这里」，却忘了有些问题只有在活着的时候才值得回答。先回来，再思考。");
  }

  if (warnings.length === 0) return null;

  return (
    <motion.div
      className="mb-7 border border-[#ef4444]/30 bg-[#ef4444]/5 p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
    >
      <p className="text-[0.85rem] mb-3 tracking-[2px]" style={{ color: "#ef4444", fontFamily: "var(--font-tech)" }}>
        ⚠ MAGI ANOMALY DETECTED
      </p>
      {warnings.map((w, i) => (
        <p key={i} className="text-[0.9rem] text-[#ccc] leading-[1.7] mb-2 last:mb-0" style={{ fontFamily: "var(--font-title)" }}>
          {w}
        </p>
      ))}
    </motion.div>
  );
}
