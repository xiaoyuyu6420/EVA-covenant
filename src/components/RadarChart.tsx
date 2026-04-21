"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  scores: number[];
  maxScore?: number;
  color: string;
  accent: string;
  glow: string;
  labels: string[];
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPolygon(cx: number, cy: number, r: number, n: number): string {
  return Array.from({ length: n }, (_, i) => {
    const { x, y } = polarToCartesian(cx, cy, r, (360 / n) * i);
    return `${x},${y}`;
  }).join(" ");
}

function buildDataPolygon(
  cx: number, cy: number, baseR: number, n: number, values: number[], maxVal: number
): string {
  return Array.from({ length: n }, (_, i) => {
    const r = baseR * (values[i] / maxVal);
    const { x, y } = polarToCartesian(cx, cy, r, (360 / n) * i);
    return `${x},${y}`;
  }).join(" ");
}

export default function RadarChart({ scores, maxScore = 9, color, accent, glow, labels }: Props) {
  const [mounted, setMounted] = useState(false);
  const n = scores.length;
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const baseR = 140;
  const levels = 4;

  useEffect(() => setMounted(true), []);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[400px] mx-auto">
      <defs>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.05" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Background fill */}
      <circle cx={cx} cy={cy} r={baseR} fill="url(#radarBg)" />

      {/* Grid layers — dashed for tech feel */}
      {Array.from({ length: levels }, (_, li) => {
        const r = baseR * ((li + 1) / levels);
        return (
          <polygon
            key={li}
            points={buildPolygon(cx, cy, r, n)}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={0.5}
            strokeDasharray={li === levels - 1 ? "none" : "2 2"}
          />
        );
      })}

      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const { x, y } = polarToCartesian(cx, cy, baseR, (360 / n) * i);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#222" strokeWidth={0.5} />
        );
      })}

      {/* Tick marks on outer ring */}
      {Array.from({ length: n }, (_, i) => {
        const { x, y } = polarToCartesian(cx, cy, baseR, (360 / n) * i);
        const { x: x2, y: y2 } = polarToCartesian(cx, cy, baseR + 4, (360 / n) * i);
        return (
          <line key={i} x1={x} y1={y} x2={x2} y2={y2} stroke="#444" strokeWidth={1} />
        );
      })}

      {/* Data polygon — glow */}
      <motion.polygon
        points={buildDataPolygon(cx, cy, baseR, n, scores, maxScore)}
        fill={`${color}18`}
        stroke={color}
        strokeWidth={2}
        filter="url(#radarGlow)"
        initial={{ opacity: 0 }}
        animate={{ opacity: mounted ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      {/* Data dots */}
      {scores.map((s, i) => {
        const r = baseR * (s / maxScore);
        const { x, y } = polarToCartesian(cx, cy, r, (360 / n) * i);
        return (
          <g key={i}>
            <motion.circle
              cx={x} cy={y} r={5}
              fill={color} opacity={0.3}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: mounted ? 0.3 : 0, scale: mounted ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.03 }}
            />
            <motion.circle
              cx={x} cy={y} r={2.5}
              fill={accent} stroke={color} strokeWidth={1}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: mounted ? 1 : 0, scale: mounted ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.03 }}
            />
          </g>
        );
      })}

      {/* Labels */}
      {labels.map((label, i) => {
        const labelR = baseR + 20;
        const angle = (360 / n) * i;
        const { x, y } = polarToCartesian(cx, cy, labelR, angle);
        const anchor = x < cx - 5 ? "end" : x > cx + 5 ? "start" : "middle";
        const dy = y < cy - 5 ? -4 : y > cy + 5 ? 10 : 4;
        return (
          <text
            key={i}
            x={x}
            y={y + dy}
            textAnchor={anchor}
            fill="#666"
            fontSize={9}
            style={{ fontFamily: "var(--font-tech)" }}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
