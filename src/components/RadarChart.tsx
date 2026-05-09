"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

interface Props {
  scores: number[];
  maxScore?: number;
  color: string;
  accent: string;
  glow: string;
  labels: string[];
  modelColors?: string[];
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function RadarChart({ scores, maxScore = 9, color, accent, glow, labels, modelColors }: Props) {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const n = scores.length;
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const baseR = 130;
  const levels = 5;
  const mColors = modelColors ?? Array.from({ length: 5 }, () => color);
  const step = 360 / n;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    let id: number;
    let start: number | null = null;
    const run = (ts: number) => {
      if (!start) start = ts;
      setTick(((ts - start) % 6000) / 6000);
      id = requestAnimationFrame(run);
    };
    id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  const scanDeg = tick * 360;
  const scanRad = ((scanDeg - 90) * Math.PI) / 180;

  const dataPoints = useMemo(() =>
    scores.map((s, i) => {
      const r = baseR * (s / maxScore);
      return polar(cx, cy, r, step * i);
    }), [scores, maxScore, cx, cy, baseR, step]);

  const smoothPath = useMemo(() => {
    if (dataPoints.length < 3) return "";
    const pts = [...dataPoints, dataPoints[0]];
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      d += ` Q ${p0.x} ${p0.y} ${mx} ${my}`;
    }
    d += " Z";
    return d;
  }, [dataPoints]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[400px] mx-auto">
      <defs>
        <filter id="rg">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="dg">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="sg">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <radialGradient id="rbg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="50%" stopColor={color} stopOpacity="0.03" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="df" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="ds" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
        <linearGradient id="scLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="40%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Center glow */}
      <circle cx={cx} cy={cy} r={baseR + 25} fill="url(#rbg)" />

      {/* Grid levels — hexagonal rings */}
      {Array.from({ length: levels }, (_, li) => {
        const r = baseR * ((li + 1) / levels);
        const isOuter = li === levels - 1;
        return (
          <polygon
            key={li}
            points={Array.from({ length: n }, (_, i) => {
              const { x, y } = polar(cx, cy, r, step * i);
              return `${x},${y}`;
            }).join(" ")}
            fill="none"
            stroke={isOuter ? `${color}33` : `${color}15`}
            strokeWidth={isOuter ? 1.2 : 0.5}
            strokeDasharray={isOuter ? "none" : "2 6"}
          />
        );
      })}

      {/* Axis lines — subtle */}
      {Array.from({ length: n }, (_, i) => {
        const { x, y } = polar(cx, cy, baseR, step * i);
        const midR = baseR * 0.5;
        const { x: mx, y: my } = polar(cx, cy, midR, step * i);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={mx} y2={my} stroke={`${color}11`} strokeWidth={0.5} />
            <line x1={mx} y1={my} x2={x} y2={y} stroke={`${color}22`} strokeWidth={0.8} />
          </g>
        );
      })}

      {/* Tick marks on outer ring */}
      {Array.from({ length: n }, (_, i) => {
        const { x, y } = polar(cx, cy, baseR, step * i);
        const { x: x2, y: y2 } = polar(cx, cy, baseR + 5, step * i);
        return (
          <line key={i} x1={x} y1={y} x2={x2} y2={y2} stroke={`${color}66`} strokeWidth={2} />
        );
      })}

      {/* Scanning beam */}
      {mounted && (
        <g>
          <line
            x1={cx} y1={cy}
            x2={cx + baseR * 1.15 * Math.cos(scanRad)}
            y2={cy + baseR * 1.15 * Math.sin(scanRad)}
            stroke={`url(#scLine)`} strokeWidth={2}
            opacity={0.7}
          />
          <circle
            cx={cx + baseR * Math.cos(scanRad)}
            cy={cy + baseR * Math.sin(scanRad)}
            r={12}
            fill={accent} filter="url(#sg)" opacity={0.4}
          />
          {/* Scan trail arc */}
          {Array.from({ length: 8 }, (_, ti) => {
            const trailDeg = scanDeg - (ti + 1) * 4;
            const trailRad = ((trailDeg - 90) * Math.PI) / 180;
            const tr = baseR * (0.3 + Math.random() * 0.7);
            return (
              <circle
                key={ti}
                cx={cx + tr * Math.cos(trailRad)}
                cy={cy + tr * Math.sin(trailRad)}
                r={1.5 - ti * 0.15}
                fill={color}
                opacity={0.3 - ti * 0.035}
              />
            );
          })}
        </g>
      )}

      {/* Data shape — smooth Bézier */}
      <motion.path
        d={smoothPath}
        fill="url(#df)"
        stroke="url(#ds)"
        strokeWidth={2}
        strokeLinejoin="round"
        filter="url(#rg)"
        initial={{ opacity: 0 }}
        animate={{ opacity: mounted ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      />

      {/* Data points with pulse rings */}
      {scores.map((s, i) => {
        const r = baseR * (s / maxScore);
        const { x, y } = polar(cx, cy, r, step * i);
        const modelIdx = Math.floor(i / 3);
        const dotColor = mColors[modelIdx % mColors.length];
        const pulsePhase = (tick * 6 + i * 0.3) % 1;
        return (
          <g key={i}>
            {/* Pulse ring */}
            <motion.circle
              cx={x} cy={y}
              r={4 + pulsePhase * 10}
              fill="none" stroke={dotColor}
              strokeWidth={1.5 * (1 - pulsePhase)}
              opacity={0.5 * (1 - pulsePhase)}
              initial={{ opacity: 0 }}
              animate={{ opacity: mounted ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.03 }}
            />
            {/* Outer glow */}
            <motion.circle
              cx={x} cy={y} r={6}
              fill={dotColor} opacity={0.1}
              filter="url(#dg)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: mounted ? 0.1 : 0, scale: mounted ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.03 }}
            />
            {/* Core dot */}
            <motion.circle
              cx={x} cy={y} r={3}
              fill={accent} stroke={dotColor} strokeWidth={1.5}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: mounted ? 1 : 0, scale: mounted ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.03 }}
            />
          </g>
        );
      })}

      {/* Labels */}
      {labels.map((label, i) => {
        const labelR = baseR + 22;
        const angle = step * i;
        const { x, y } = polar(cx, cy, labelR, angle);
        const anchor = x < cx - 10 ? "end" : x > cx + 10 ? "start" : "middle";
        const dy = y < cy - 10 ? -2 : y > cy + 10 ? 6 : 2;
        const modelIdx = Math.floor(i / 3);
        const labelColor = mColors[modelIdx % mColors.length];
        return (
          <text
            key={i}
            x={x} y={y + dy}
            textAnchor={anchor}
            fill={labelColor}
            fontSize={9.5}
            fontWeight="600"
            opacity={0.85}
            style={{ fontFamily: "var(--font-tech)" }}
          >
            {label}
          </text>
        );
      })}

      {/* Center crosshair */}
      <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} stroke={`${color}44`} strokeWidth={0.8} />
      <line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6} stroke={`${color}44`} strokeWidth={0.8} />
    </svg>
  );
}
