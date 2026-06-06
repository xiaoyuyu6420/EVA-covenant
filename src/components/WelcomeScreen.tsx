"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/context";
import { normalizeRelayDepth } from "@/lib/analytics";
import LangSelector from "./LangSelector";

interface Props {
  onStart: () => void;
  inviteCode?: string;
  shareUnit?: string;
  relayFrom?: string;
  relayDepth?: number;
  inviteLabel?: string;
  relayRelation?: string;
  inviteNamed?: boolean;
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function requestDocumentFullscreen() {
  const el = document.documentElement as FullscreenElement;
  const requestFullscreen = el.requestFullscreen ?? el.webkitRequestFullscreen;
  if (!requestFullscreen) return;
  return requestFullscreen.call(el);
}

export default function WelcomeScreen({
  onStart,
  inviteCode,
  shareUnit,
  relayFrom,
  relayDepth,
  inviteLabel,
  relayRelation,
  inviteNamed,
}: Props) {
  const [bootPhase, setBootPhase] = useState(0);
  const [pilotCount, setPilotCount] = useState<number | null>(null);
  const [showFSModal, setShowFSModal] = useState(false);
  const t = useT();
  const sourceRelayDepth = normalizeRelayDepth(relayDepth);
  const nextRelayDepth = normalizeRelayDepth(sourceRelayDepth + 1);
  const hasInviteContext = Boolean(shareUnit || inviteLabel || relayRelation || inviteNamed);

  useEffect(() => {
    const t1 = setTimeout(() => setBootPhase(1), 400);
    const t2 = setTimeout(() => setBootPhase(2), 1000);
    const t3 = setTimeout(() => setBootPhase(3), 1800);
    const t4 = setTimeout(() => setBootPhase(4), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as NavigatorWithStandalone).standalone === true;
    if (isMobile && !isStandalone && !document.fullscreenElement) {
      const timer = setTimeout(() => setShowFSModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { if (d.total) setPilotCount(d.total); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col px-5 py-4">
      {/* Header */}
      <motion.div
        className="flex justify-between items-center pb-1.5 mb-4 border-b border-[#333] text-[var(--nerv-orange)] text-[0.8rem] tracking-[2px] uppercase"
        style={{ fontFamily: "var(--font-tech)" }}
        initial={{ opacity: 0 }}
        animate={bootPhase >= 1 ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        <span>{t("welcome.header")}</span>
        <div className="flex items-center gap-3">
          <LangSelector />
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                void Promise.resolve(requestDocumentFullscreen()).catch(() => {});
              }
            }}
            className="text-[0.75rem] text-[#555] hover:text-[var(--nerv-orange)] transition-colors cursor-pointer"
            title="Fullscreen"
          >
            ⛶
          </button>
          <span>READY</span>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        className="my-6 text-center"
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
        className="border-l-[3px] border-[var(--nerv-red)] pl-4 mb-6"
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

      {inviteCode && (
        <motion.div
          className="mb-6 border border-[var(--nerv-orange)]/60 bg-[rgba(242,116,5,0.08)] p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={bootPhase >= 3 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span
              className="text-[0.68rem] tracking-[0.22em] text-[var(--nerv-orange)]"
              style={{ fontFamily: "var(--font-tech)" }}
            >
              {t("welcome.relayTitle")}
            </span>
            <span
              className="text-[0.62rem] tracking-[0.16em] text-[#666]"
              style={{ fontFamily: "var(--font-tech)" }}
            >
              {t("welcome.relayStatus")}
            </span>
          </div>
          <div className="border border-white/10 bg-black/25 px-3 py-2 mb-3">
            <p
              className="text-[1rem] leading-[1.25] break-all"
              style={{ color: "var(--eva-green)", fontFamily: "var(--font-tech)" }}
            >
              {inviteCode}
            </p>
          </div>
          {hasInviteContext && (
            <div className="mb-3 grid grid-cols-1 min-[430px]:grid-cols-2 gap-2">
              {shareUnit && (
                <div className="border border-white/10 bg-black/20 px-3 py-2 min-w-0 min-[430px]:col-span-2">
                  <p className="text-[0.56rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                    SOURCE UNIT
                  </p>
                  <p className="mt-1 text-[0.9rem] leading-tight text-[#ddd] break-words" style={{ fontFamily: "var(--font-title)" }}>
                    {shareUnit}
                  </p>
                </div>
              )}
              {inviteLabel && (
                <div className="border border-white/10 bg-black/20 px-3 py-2 min-w-0">
                  <p className="text-[0.56rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                    INVITE MODE
                  </p>
                  <p className="mt-1 text-[0.82rem] leading-tight text-[#ddd] break-words" style={{ fontFamily: "var(--font-title)" }}>
                    {inviteLabel}
                  </p>
                </div>
              )}
              {relayRelation && (
                <div className="border border-white/10 bg-black/20 px-3 py-2 min-w-0">
                  <p className="text-[0.56rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                    RELATION
                  </p>
                  <p className="mt-1 text-[0.82rem] leading-tight text-[#ddd] break-words" style={{ fontFamily: "var(--font-title)" }}>
                    {relayRelation}
                  </p>
                </div>
              )}
              {inviteNamed && (
                <div className="border border-white/10 bg-black/20 px-3 py-2 min-w-0">
                  <p className="text-[0.56rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                    DIRECT CALL
                  </p>
                  <p className="mt-1 text-[0.82rem] leading-tight text-[#ddd] break-words" style={{ fontFamily: "var(--font-title)" }}>
                    点名接力
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[0.56rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                SOURCE NODE
              </p>
              <p className="mt-1 text-[1rem] leading-none" style={{ color: "var(--nerv-orange)", fontFamily: "var(--font-num)" }}>
                {sourceRelayDepth.toString().padStart(2, "0")}
              </p>
            </div>
            <div className="border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[0.56rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                YOUR NODE
              </p>
              <p className="mt-1 text-[1rem] leading-none" style={{ color: "var(--eva-green)", fontFamily: "var(--font-num)" }}>
                {nextRelayDepth.toString().padStart(2, "0")}
              </p>
            </div>
          </div>
          <p className="text-[0.92rem] leading-[1.7] text-[#ddd]" style={{ fontFamily: "var(--font-title)" }}>
            {t("welcome.relayDesc")}
          </p>
          {relayFrom && (
            <p className="mt-2 text-[0.68rem] tracking-[0.14em] text-[#777]" style={{ fontFamily: "var(--font-tech)" }}>
              {t("welcome.relayUpstream")} {relayFrom}
            </p>
          )}
        </motion.div>
      )}

      {/* Pilot count — EVA themed */}
      {pilotCount !== null && pilotCount > 0 && (
        <motion.div
          className="mb-6 flex items-center justify-center gap-3"
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
        className="border border-dashed border-[var(--eva-green)] bg-[rgba(82,255,0,0.05)] p-3 mb-6 text-[0.85rem]"
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
        <span className="relative z-10">{inviteCode ? t("welcome.relayBtn") : t("welcome.btn")}</span>
      </motion.button>

      {/* History button */}
      <motion.button
        onClick={() => window.location.href = "/history"}
        className="w-full mt-3 py-3 text-center text-[0.85rem] font-medium tracking-[2px] cursor-pointer
                   border border-[#333] text-[#666] bg-transparent rounded-lg
                   uppercase transition-colors hover:border-[#555] hover:text-[#888]"
        style={{ fontFamily: "var(--font-tech)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={bootPhase >= 4 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        查看历史记录
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

      {/* Fullscreen modal — first visit on mobile */}
      {showFSModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => { setShowFSModal(false); }}
        >
          <motion.div
            className="mx-6 border border-[var(--nerv-orange)] bg-[#111] p-6 max-w-[340px] w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "var(--font-tech)" }}
          >
            <p className="text-[0.7rem] text-[var(--nerv-orange)] tracking-[2px] mb-3">⚠ NERV SYSTEM NOTICE</p>
            <p className="text-[0.95rem] text-[#ccc] leading-[1.7] mb-5" style={{ fontFamily: "var(--font-title)" }}>
              建议进入全屏模式以获得最佳适格者检测体验。地址栏会遮挡关键操作区域。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  void Promise.resolve(requestDocumentFullscreen()).catch(() => {});
                  setShowFSModal(false);
                }}
                className="flex-1 py-2.5 text-center text-[0.85rem] font-bold tracking-[2px] cursor-pointer border border-[var(--eva-green)] text-[var(--eva-green)] bg-transparent uppercase transition-colors eva-btn"
              >
                <span className="relative z-10">进入全屏</span>
              </button>
              <button
                onClick={() => { setShowFSModal(false); }}
                className="flex-1 py-2.5 text-center text-[0.85rem] tracking-[1px] cursor-pointer border border-[#444] text-[#666] bg-transparent uppercase transition-colors"
              >
                跳过
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
