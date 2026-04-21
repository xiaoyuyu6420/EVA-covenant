"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/context";
import LangSelector from "./LangSelector";

interface Props {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: Props) {
  const [bootPhase, setBootPhase] = useState(0);
  const [pilotCount, setPilotCount] = useState<number | null>(null);
  const t = useT();

  useEffect(() => {
    const t1 = setTimeout(() => setBootPhase(1), 400);
    const t2 = setTimeout(() => setBootPhase(2), 1000);
    const t3 = setTimeout(() => setBootPhase(3), 1800);
    const t4 = setTimeout(() => setBootPhase(4), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { if (d.total) setPilotCount(d.total); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col px-5 py-7">
      {/* Header */}
      <motion.div
        className="flex justify-between items-center pb-1.5 mb-5 border-b border-[#333] text-[var(--nerv-orange)] text-[0.8rem] tracking-[2px] uppercase"
        style={{ fontFamily: "var(--font-tech)" }}
        initial={{ opacity: 0 }}
        animate={bootPhase >= 1 ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        <span>{t("welcome.header")}</span>
        <div className="flex items-center gap-3">
          <LangSelector />
          <span>SYSTEM READY</span>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        className="my-10 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={bootPhase >= 2 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <h1
          className="text-[3.5rem] md:text-[4rem] leading-[1.1] text-white tracking-[4px]"
          style={{ fontFamily: "var(--font-title)", textShadow: "2px 2px 0 var(--nerv-red)" }}
        >
          {t("welcome.title").split("\n").map((line, i) => (
            <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
          ))}
        </h1>
        <p
          className="mt-3 text-sm tracking-[5px]"
          style={{ color: "var(--eva-green)", fontFamily: "var(--font-tech)" }}
        >
          PILOT COMPATIBILITY TEST
        </p>
      </motion.div>

      {/* Description */}
      <motion.div
        className="border-l-[3px] border-[var(--nerv-red)] pl-4 mb-10"
        style={{ fontFamily: "var(--font-title)" }}
        initial={{ opacity: 0, x: -10 }}
        animate={bootPhase >= 3 ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[#ccc] text-[0.95rem] font-bold leading-[1.7] tracking-wide">
          {t("welcome.desc").split("\n").map((line, i) => (
            <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
          ))}
        </p>
      </motion.div>

      {/* Pilot count — EVA themed */}
      {pilotCount !== null && pilotCount > 0 && (
        <motion.div
          className="mb-8 flex items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={bootPhase >= 3 ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontFamily: "var(--font-tech)" }}
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--nerv-red)]/30" />
          <div className="flex items-center gap-2 text-[0.75rem] tracking-[2px]">
            <span className="text-[#555]">适格者评定记录</span>
            <span
              className="text-[1.1rem] font-bold"
              style={{ color: "var(--eva-green)", fontFamily: "var(--font-num)", textShadow: "0 0 10px var(--eva-green)" }}
            >
              {pilotCount.toLocaleString()}
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--nerv-red)]/30" />
        </motion.div>
      )}

      {/* Status box */}
      <motion.div
        className="border border-dashed border-[var(--eva-green)] bg-[rgba(82,255,0,0.05)] p-4 mb-10 text-[0.85rem]"
        style={{ color: "var(--eva-green)", fontFamily: "var(--font-tech)" }}
        initial={{ opacity: 0 }}
        animate={bootPhase >= 4 ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-1">{t("welcome.status1")}</div>
        <div className="mb-1">{t("welcome.status2")}</div>
        <div className="mb-1">{t("welcome.status3")}</div>
        <div>{t("welcome.status4")}</div>
      </motion.div>

      {/* Start button */}
      <motion.button
        onClick={onStart}
        className="w-full py-4 text-center text-xl font-bold tracking-[3px] cursor-pointer
                   border border-[var(--eva-green)] text-[var(--eva-green)] bg-transparent
                   eva-btn uppercase transition-colors"
        style={{ fontFamily: "var(--font-title)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={bootPhase >= 4 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="relative z-10">{t("welcome.btn")}</span>
      </motion.button>

      {/* Footer */}
      <motion.p
        className="mt-auto pt-6 text-center text-[0.65rem] text-[var(--muted-foreground)] tracking-[2px]"
        style={{ fontFamily: "var(--font-tech)" }}
        initial={{ opacity: 0 }}
        animate={bootPhase >= 4 ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        CLASSIFIED — NERV-HQ-2024
      </motion.p>
    </div>
  );
}
