import { DIMENSIONS } from "./types";
import type { FullResult } from "./types";

const STORAGE_KEY = "eva-covenant";
const HISTORY_KEY = `${STORAGE_KEY}-results`;
const HISTORY_EVENT = `${STORAGE_KEY}-history-change`;

interface StorageData {
  currentQuestion: number;
  answers: number[];
  gateAnswer?: string;
  triggerAnswer?: string;
  completedAt?: string;
  lastResult?: string;
  answerLog?: Array<{ dim: string; text: string; label: string; score: number }>;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  result: FullResult;
  relaySourceCode?: string;
  relaySourceUnit?: string;
  relayRootCode?: string;
  relayDepth?: number;
}

function getQueryParam(params: URLSearchParams, key: string, maxLength = 120) {
  const value = params.get(key)?.trim();
  return value ? value.slice(0, maxLength) : undefined;
}

function getPositiveRelayDepth(params: URLSearchParams) {
  const raw = params.get("relay_depth");
  if (!raw) return 1;
  const depth = Number.parseInt(raw, 10);
  if (!Number.isFinite(depth) || depth < 1) return 1;
  return Math.min(depth, 99);
}

function getCurrentRelayContext() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const relaySourceCode = getQueryParam(params, "share_by");
  if (!relaySourceCode) return { relayDepth: 1 };

  const sourceDepth = getPositiveRelayDepth(params);
  return {
    relaySourceCode,
    relaySourceUnit: getQueryParam(params, "share_unit", 80),
    relayRootCode: getQueryParam(params, "relay_root") ?? getQueryParam(params, "relay_from") ?? relaySourceCode,
    relayDepth: Math.min(sourceDepth + 1, 99),
  };
}

function notifyHistoryChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function subscribeHistory(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(HISTORY_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(HISTORY_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getHistorySnapshot() {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(HISTORY_KEY) ?? "[]";
}

export function loadProgress(): StorageData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProgress(data: StorageData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** 保存完整测试结果到历史记录 */
export function saveResult(result: FullResult): void {
  if (typeof window === "undefined") return;
  const history = loadHistory();
  const relayContext = getCurrentRelayContext();
  const item: HistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    result,
    ...relayContext,
  };
  history.push(item);
  // 最多保留50条
  if (history.length > 50) {
    history.shift();
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  notifyHistoryChange();
}

/** 加载所有历史记录 */
export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 清空历史记录 */
export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
  notifyHistoryChange();
}

/** 删除单条历史记录 */
export function removeHistoryItem(id: string): void {
  if (typeof window === "undefined") return;
  const history = loadHistory().filter((item) => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  notifyHistoryChange();
}

/** 向后兼容：获取旧版历史 */
export function getHistory(): { code: string; date: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-history`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 将用户分数数组转为维度显示数据 */
export function getDimensionDisplay(scores: number[], grades: string[]) {
  return DIMENSIONS.map((dim, i) => ({
    ...dim,
    score: scores[i],
    grade: grades[i],
  }));
}
