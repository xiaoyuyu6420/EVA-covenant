"use client";

import { forwardRef } from "react";
import type { MatchResult } from "@/lib/types";
import { DIMENSIONS } from "@/lib/types";
import { personalityTypes, groups } from "@/lib/quiz-data";

interface Props {
  top: MatchResult;
  userScores: number[];
  theme: { color: string; accent: string; glow: string };
}

const ShareCard = forwardRef<HTMLDivElement, Props>(({ top, userScores, theme }, ref) => {
  const maxScore = 9;
  const barW = 100;
  const personalityType = personalityTypes.find((p) => p.code === top.code);
  const groupKey = top.isSpecial
    ? (top.code === "CMPL" ? "special" : top.code === "U13G" ? "unit13special" : "adam")
    : (personalityType?.group ?? "adam");
  const group = groups[groupKey as keyof typeof groups];

  return (
    <div
      ref={ref}
      style={{
        width: 420,
        padding: 32,
        background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: -1,
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #333", paddingBottom: 8, fontSize: 11, letterSpacing: 2, color: "#e65100" }}>
        <span>NERV — PILOT COMPATIBILITY REPORT</span>
        <span style={{ color: theme.color }}>CLASSIFICATION: LEVEL-A</span>
      </div>

      {/* Hero */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "12px 0", borderTop: "1px solid #333", borderBottom: "1px solid #333" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>SYNC RATE</div>
          <div style={{ fontSize: 56, fontWeight: "bold", lineHeight: 1, textShadow: `0 0 20px ${theme.color}` }}>
            {top.similarity}<span style={{ fontSize: 24, color: theme.accent }}>%</span>
          </div>
        </div>
        <div style={{ fontSize: 72, fontWeight: "bold", color: theme.accent, textShadow: `0 0 30px ${theme.glow}, 0 0 60px ${theme.color}`, lineHeight: 1 }}>
          {top.code === "ADAM" ? "ADAM" : top.code === "CMPL" ? "∞" : top.code === "U13G" ? "13" : top.evaUnit?.match(/(\d+)/)?.[1] ?? "★"}
        </div>
      </div>

      {/* Designation */}
      {group && (
        <div style={{ marginBottom: 16, fontFamily: "monospace" }}>
          <div style={{ fontSize: 16, fontWeight: "bold", letterSpacing: 2, color: theme.color }}>{group.eva}</div>
          <div style={{ fontSize: 11, letterSpacing: 1, color: "#666", marginTop: 2 }}>{group.jp}</div>
        </div>
      )}

      {/* Description */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>{top.desc}</div>
      </div>

      {/* Bars */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "#666", marginBottom: 10, letterSpacing: 1 }}>[ MAGI DIMENSION ANALYSIS ]</div>
        {DIMENSIONS.map((dim, i) => {
          const pct = (userScores[i] / maxScore) * barW;
          return (
            <div key={dim.code} style={{ display: "flex", alignItems: "center", fontSize: 11, marginBottom: 4 }}>
              <span style={{ width: 70, color: "#aaa" }}>{dim.code} {dim.name}</span>
              <div style={{ flex: 1, height: 10, background: "#222", margin: "0 8px" }}>
                <div style={{ width: pct, height: "100%", background: `linear-gradient(90deg, ${theme.color}, ${theme.accent})` }} />
              </div>
              <span style={{ width: 28, textAlign: "right", fontSize: 12 }}>{userScores[i]}/9</span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #333", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555" }}>
        <span>EVA-Covenant Pilot Compatibility Test</span>
        <span>eva-covenant.app</span>
      </div>
    </div>
  );
});

ShareCard.displayName = "ShareCard";
export default ShareCard;
