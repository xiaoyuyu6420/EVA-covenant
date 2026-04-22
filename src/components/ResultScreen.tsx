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
  // 零号机：金 + 蓝
  unit00: { color: "#fbbf24", accent: "#3b82f6", glow: "rgba(251, 191, 36, 0.5)" },
  // 初号机：紫 + 绿
  unit01: { color: "#a855f7", accent: "#52ff00", glow: "rgba(168, 85, 247, 0.5)" },
  // 贰号机：红 + 黄
  unit02: { color: "#ef4444", accent: "#fbbf24", glow: "rgba(239, 68, 68, 0.5)" },
  // 参号机：深蓝 + 橙
  unit03: { color: "#1e40af", accent: "#f97316", glow: "rgba(30, 64, 175, 0.5)" },
  // 四号机：银白 + 灰
  unit04: { color: "#d1d5db", accent: "#6b7280", glow: "rgba(209, 213, 219, 0.4)" },
  // 五号机：军绿 + 橙
  unit05: { color: "#65a30d", accent: "#f97316", glow: "rgba(101, 163, 13, 0.5)" },
  // Mark.06：金 + 银
  mark06: { color: "#d4a017", accent: "#e2e8f0", glow: "rgba(212, 160, 23, 0.5)" },
  // 八号机：粉 + 玫红
  unit08: { color: "#ec4899", accent: "#f43f5e", glow: "rgba(236, 72, 153, 0.5)" },
  // 九号机：浅蓝 + 白
  unit09: { color: "#60a5fa", accent: "#f9fafb", glow: "rgba(96, 165, 250, 0.5)" },
  // 十三号机：深洋红 + 金
  unit13: { color: "#831843", accent: "#fbbf24", glow: "rgba(131, 24, 67, 0.6)" },
  // 8+2号机：红 + 粉
  unit82: { color: "#f43f5e", accent: "#ec4899", glow: "rgba(244, 63, 94, 0.5)" },
  // ADAM（兜底特殊型）：白金
  adam: { color: "#f5f5f5", accent: "#d4a017", glow: "rgba(245, 245, 245, 0.4)" },
  // 人类补完（特殊触发）：绿 + 紫
  special: { color: "#52ff00", accent: "#a855f7", glow: "rgba(82, 255, 0, 0.4)" },
  // 十三号机觉醒（特殊触发）：深洋红 + 金
  unit13special: { color: "#831843", accent: "#fbbf24", glow: "rgba(131, 24, 67, 0.6)" },
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
    try {
      if (!shareRef.current) return;
      const dataUrl = await toPng(shareRef.current, { pixelRatio: 2 });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "eva-result.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "EVA Pilot Compatibility Test",
          text: t("result.shareText").replace("{0}", `${top.evaUnit || top.name}`).replace("{1}", `${top.similarity}`),
          files: [file],
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `eva-${top.code}.png`;
        a.click();
      }
    } catch {
      await navigator.clipboard.writeText(
        t("result.shareText").replace("{0}", `${top.evaUnit || top.name}`).replace("{1}", `${top.similarity}`)
      );
      alert(t("result.copied"));
    } finally {
      setSharing(false);
    }
  }, [top, theme]);

  return (
    <div className="flex-1 flex flex-col px-5 py-5 max-w-[600px] mx-auto w-full">
      {/* Header */}
      <motion.div
        className="flex justify-between items-center pb-1.5 mb-5 border-b border-[#333] text-xs tracking-[2px]"
        style={{ fontFamily: "var(--font-tech)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span style={{ color: "var(--nerv-orange)" }}>{t("result.header")}</span>
        <span style={{ color: theme.color }}>{t("result.classification")}</span>
      </motion.div>

      {/* Hero */}
      <motion.div
        className="py-5 mb-2 border-t border-b border-[#333]"
        style={{
          background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 2px, transparent 2px, transparent 8px)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Top row: number + sync rate */}
        <div className="flex items-center justify-between">
          <div className="w-[100px] h-[120px] flex justify-center items-center">
            <div
              className="text-[5rem] leading-none font-bold"
              style={{
                color: theme.accent,
                fontFamily: "var(--font-num)",
                textShadow: `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}, 0 0 80px ${theme.color}`,
              }}
            >
              {evaNum}
            </div>
          </div>
          <div className="flex-1 text-right">
            <div className="text-[0.7rem] text-[#666] mb-1" style={{ fontFamily: "var(--font-tech)" }}>
              {t("result.syncRate")}
            </div>
            <div
              className="text-[4.5rem] md:text-[5rem] leading-[0.9] text-white"
              style={{ fontFamily: "var(--font-num)", textShadow: `0 0 20px ${theme.color}, 0 0 40px ${theme.accent}` }}
            >
              {top.similarity}
              <span className="text-[2rem]" style={{ color: theme.accent }}>%</span>
            </div>
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
            <div className="text-[0.8rem] tracking-[2px] font-bold" style={{ color: theme.color }}>
              {group.eva}
            </div>
            <div className="text-[0.7rem] tracking-[1px] mt-0.5" style={{ color: "#666" }}>
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
        <span className="text-[0.7rem] tracking-[3px] text-[#555]">SUBJECT PROFILE</span>
        <span className="text-[0.75rem] tracking-[2px] font-bold" style={{ color: theme.accent }}>
          {top.code}
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
        {top.isBoundary && (
          <p className="mt-2 text-xs" style={{ color: "var(--nerv-orange)", fontFamily: "var(--font-tech)" }}>
            ▲ {t("result.boundary")}
          </p>
        )}
        {top.isSpecial && (
          <p className="mt-2 text-xs" style={{ color: theme.color, fontFamily: "var(--font-tech)" }}>
            ◆ {t("result.special")}
          </p>
        )}
      </motion.div>

      {/* Dimension Chart — Radar */}
      <motion.div
        className="border border-[#333] bg-[#0a0a0a] p-4 mb-7"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <p className="text-[0.7rem] text-[#666] mb-4 uppercase" style={{ fontFamily: "var(--font-tech)" }}>
          {t("result.chartTitle")}
        </p>
        <RadarChart
          scores={userScores}
          maxScore={9}
          color={theme.color}
          accent={theme.accent}
          glow={theme.glow}
          labels={DIMENSIONS.map((d) => `${d.code} ${d.name}`)}
        />
        {/* Score details below radar */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-4 text-[0.7rem]">
          {DIMENSIONS.map((dim, i) => (
            <div key={dim.code} className="flex justify-between">
              <span className="text-[#888]" style={{ fontFamily: "var(--font-tech)" }}>{dim.code}</span>
              <span className="text-white" style={{ fontFamily: "var(--font-num)" }}>{userScores[i]}/9</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top 3 Leaderboard */}
      <motion.div
        className="mb-7"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <p
          className="text-[0.85rem] mb-3 pb-1 border-b border-dashed border-[#333]"
          style={{ color: "var(--nerv-orange)", fontFamily: "var(--font-tech)" }}
        >
          {t("result.ranking")}
        </p>
        {top3.map((entry, i) => (
          <div
            key={entry.code}
            className={`flex justify-between text-[0.85rem] py-1.5 ${
              i === 0 ? "text-white font-bold px-2.5 border-l-2" : "text-[#ccc]"
            }`}
            style={i === 0 ? {
              backgroundColor: theme.glow.replace(/[\d.]+\)$/, "0.15)"),
              borderLeftColor: theme.accent,
            } : {}}
          >
            <span>
              #{i + 1} {entry.evaUnit || entry.name}
              {i === 0 && ` ${t("result.you")}`}
            </span>
            <span style={{ fontFamily: "var(--font-tech)" }}>{entry.similarity}%</span>
          </div>
        ))}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="flex gap-3 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
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
