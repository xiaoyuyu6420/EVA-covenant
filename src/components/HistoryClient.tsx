"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Share2, Trash2 } from "lucide-react";
import { buildShareUrl, normalizeRelayDepth, trackEvent } from "@/lib/analytics";
import {
  buildFormationCode,
  getFormationDimensionLabels,
  getResultDisplayName,
  rankTopDimensions,
} from "@/lib/formation";
import {
  clearHistory,
  getHistorySnapshot,
  removeHistoryItem,
  subscribeHistory,
  type HistoryItem,
} from "@/lib/storage";
import type { Grade } from "@/lib/types";

const GRADE_LABELS: Record<Grade, string> = { L: "低", M: "中", H: "高", X: "极高" };
const HISTORY_INVITE_TARGET = "history";
const HISTORY_INVITE_LABEL = "历史再发";

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getHistoryMeta(item: HistoryItem) {
  const result = item.result;
  const formationCode = buildFormationCode(result);
  const topDimensions = rankTopDimensions(result.userVector, result.userScores, 3);
  const dimensionLabels = getFormationDimensionLabels(topDimensions, GRADE_LABELS);
  const relayDepth = normalizeRelayDepth(item.relayDepth);
  const relayRoot = item.relayRootCode ?? item.relaySourceCode;
  const displayName = getResultDisplayName(result.top);
  const shareUrl = buildShareUrl(formationCode, item.relaySourceCode, relayRoot, relayDepth, {
    shareUnit: displayName,
    inviteTarget: HISTORY_INVITE_TARGET,
    inviteLabel: HISTORY_INVITE_LABEL,
  });

  const shareText = [
    `我的 EVA 适格记录：${displayName}`,
    `编队码：${formationCode}`,
    `接力站位：第 ${relayDepth} 站`,
    dimensionLabels ? `高位指标：${dimensionLabels}` : "",
    "你测完把机体和编队码发我，接一下这条编队：",
    shareUrl,
  ].filter(Boolean).join("\n");

  return {
    formationCode,
    dimensionLabels,
    displayName,
    relayDepth,
    relayRoot,
    shareUrl,
    shareText,
  };
}

function getServerHistorySnapshot() {
  return "[]";
}

function parseHistorySnapshot(snapshot: string) {
  try {
    const value: unknown = JSON.parse(snapshot);
    return Array.isArray(value) ? (value as HistoryItem[]).slice().reverse() : [];
  } catch {
    return [];
  }
}

export default function HistoryClient() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const historySnapshot = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getServerHistorySnapshot
  );
  const items = useMemo(() => parseHistorySnapshot(historySnapshot), [historySnapshot]);

  useEffect(() => {
    trackEvent("page_view", { pageType: "history" });
  }, []);

  const latestItem = items[0];
  const latestMeta = useMemo(() => latestItem ? getHistoryMeta(latestItem) : null, [latestItem]);

  const copyRelay = async (item: HistoryItem, channel = "history_copy") => {
    const meta = getHistoryMeta(item);
    trackEvent("share_click", {
      channel,
      code: item.result.top.code,
      unit: meta.displayName,
      shareUnit: meta.displayName,
      formationCode: meta.formationCode,
      relayFrom: item.relaySourceCode,
      relayRoot: meta.relayRoot,
      relayDepth: meta.relayDepth,
      inviteTarget: HISTORY_INVITE_TARGET,
      inviteLabel: HISTORY_INVITE_LABEL,
    });

    try {
      await navigator.clipboard.writeText(meta.shareText);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(null), 1600);
      trackEvent("share_success", {
        channel,
        code: item.result.top.code,
        unit: meta.displayName,
        shareUnit: meta.displayName,
        formationCode: meta.formationCode,
        relayFrom: item.relaySourceCode,
        relayRoot: meta.relayRoot,
        relayDepth: meta.relayDepth,
        inviteTarget: HISTORY_INVITE_TARGET,
        inviteLabel: HISTORY_INVITE_LABEL,
      });
    } catch {
      setCopiedId(null);
    }
  };

  const shareRelay = async (item: HistoryItem) => {
    const meta = getHistoryMeta(item);

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        trackEvent("share_click", {
          channel: "history_native",
          code: item.result.top.code,
          unit: meta.displayName,
          shareUnit: meta.displayName,
          formationCode: meta.formationCode,
          relayFrom: item.relaySourceCode,
          relayRoot: meta.relayRoot,
          relayDepth: meta.relayDepth,
          inviteTarget: HISTORY_INVITE_TARGET,
          inviteLabel: HISTORY_INVITE_LABEL,
        });
        await navigator.share({
          title: `EVA 编队接力：${meta.displayName}`,
          text: meta.shareText,
          url: meta.shareUrl || undefined,
        });
        setCopiedId(item.id);
        window.setTimeout(() => setCopiedId(null), 1600);
        trackEvent("share_success", {
          channel: "history_native",
          code: item.result.top.code,
          unit: meta.displayName,
          shareUnit: meta.displayName,
          formationCode: meta.formationCode,
          relayFrom: item.relaySourceCode,
          relayRoot: meta.relayRoot,
          relayDepth: meta.relayDepth,
          inviteTarget: HISTORY_INVITE_TARGET,
          inviteLabel: HISTORY_INVITE_LABEL,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyRelay(item, "history_fallback");
  };

  const deleteItem = (id: string) => {
    removeHistoryItem(id);
  };

  const clearAll = () => {
    clearHistory();
  };

  return (
    <div
      className="w-full max-w-[600px] h-dvh max-h-[900px] bg-[var(--card)] relative border-x border-[#333] flex flex-col overflow-hidden mx-auto"
      style={{ boxShadow: "0 0 30px rgba(0,0,0,0.8)" }}
    >
      <div className="caution-tape" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-5" style={{ scrollbarWidth: "none" }}>
        <header className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
          <button
            onClick={() => { window.location.href = "/"; }}
            className="h-9 w-9 border border-white/15 text-[#aaa] flex items-center justify-center transition-colors hover:text-white hover:border-white/30"
            aria-label="Back"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <div className="min-w-0 text-right">
            <p className="text-[0.68rem] tracking-[0.22em] text-[var(--nerv-orange)]" style={{ fontFamily: "var(--font-tech)" }}>
              RESULT ARCHIVE
            </p>
            <h1 className="mt-1 text-[1.8rem] leading-none text-white" style={{ fontFamily: "var(--font-title)" }}>
              历史适格记录
            </h1>
          </div>
        </header>

        {latestMeta ? (
          <section className="py-5 border-b border-white/10">
            <div className="border-l-[3px] pl-4" style={{ borderColor: "var(--eva-green)" }}>
              <p className="text-[0.68rem] tracking-[0.18em] text-[#777]" style={{ fontFamily: "var(--font-tech)" }}>
                LATEST RELAY
              </p>
              <p className="mt-2 text-[1rem] leading-[1.7] text-[#ddd]" style={{ fontFamily: "var(--font-title)" }}>
                最近一次结果是 {latestMeta.displayName}。可以直接复制这条接力邀请，继续发给下一站。
              </p>
            </div>
          </section>
        ) : null}

        {items.length === 0 ? (
          <section className="py-12 text-center">
            <p className="text-[0.74rem] tracking-[0.2em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
              NO LOCAL RECORD
            </p>
            <p className="mt-4 text-[0.95rem] leading-[1.7] text-[#aaa]" style={{ fontFamily: "var(--font-title)" }}>
              本机还没有保存过测试结果。完成一次适格测试后，结果会出现在这里。
            </p>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="mt-6 h-11 px-6 border border-[var(--eva-green)] text-[var(--eva-green)] text-[0.78rem] tracking-[0.14em] uppercase transition-colors eva-btn"
              style={{ fontFamily: "var(--font-tech)" }}
            >
              <span className="relative z-10">START TEST</span>
            </button>
          </section>
        ) : (
          <section className="py-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-[0.72rem] tracking-[0.2em] text-[var(--nerv-orange)]" style={{ fontFamily: "var(--font-tech)" }}>
                SAVED RESULTS
              </p>
              <button
                onClick={clearAll}
                className="h-8 px-3 border border-white/15 text-[0.62rem] tracking-[0.14em] text-[#777] transition-colors hover:text-white hover:border-white/30"
                style={{ fontFamily: "var(--font-tech)" }}
              >
                CLEAR
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((item) => {
                const meta = getHistoryMeta(item);
                return (
                  <article
                    key={item.id}
                    className="border border-white/10 p-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(82,255,0,0.06), rgba(0,0,0,0.24))",
                      borderLeft: "3px solid var(--eva-green)",
                    }}
                  >
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
                      <div className="min-w-0">
                        <p className="text-[0.62rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                          {formatDate(item.timestamp)} / NODE {meta.relayDepth.toString().padStart(2, "0")}
                        </p>
                        <h2 className="mt-2 text-[1.2rem] leading-tight text-white break-words" style={{ fontFamily: "var(--font-title)" }}>
                          {meta.displayName}
                        </h2>
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="h-8 w-8 border border-white/10 text-[#666] flex items-center justify-center transition-colors hover:text-white hover:border-white/30"
                        aria-label="Delete result"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-4 border border-white/10 bg-black/25 px-3 py-2">
                      <p className="text-[0.78rem] leading-[1.35] break-all" style={{ color: "var(--eva-green)", fontFamily: "var(--font-tech)" }}>
                        {meta.formationCode}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-1 min-[430px]:grid-cols-[1fr_auto] gap-3 min-[430px]:items-end">
                      <p className="text-[0.82rem] leading-[1.65] text-[#aaa]" style={{ fontFamily: "var(--font-title)" }}>
                        {meta.dimensionLabels ? `高位指标：${meta.dimensionLabels}` : "高位指标：SYNC"}
                        <span className="block mt-1 text-[#777]">继续邀请下一站接入。</span>
                      </p>
                      <button
                        onClick={() => shareRelay(item)}
                        className="h-10 px-3 border border-[var(--eva-green)] text-[var(--eva-green)] text-[0.66rem] tracking-[0.14em] flex items-center justify-center gap-1.5 transition-colors"
                        style={{ fontFamily: "var(--font-tech)" }}
                      >
                        <Share2 size={13} aria-hidden="true" />
                        {copiedId === item.id ? "READY" : "SEND RELAY"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <div className="caution-tape" />
    </div>
  );
}
