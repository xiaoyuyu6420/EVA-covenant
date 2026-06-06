import { DIMENSIONS } from "./types";
import type { FullResult } from "./types";

const STORAGE_KEY = "eva-covenant";
const HISTORY_KEY = `${STORAGE_KEY}-results`;

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
  const item: HistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    result,
  };
  history.push(item);
  // 最多保留50条
  if (history.length > 50) {
    history.shift();
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
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
}

/** 删除单条历史记录 */
export function removeHistoryItem(id: string): void {
  if (typeof window === "undefined") return;
  const history = loadHistory().filter((item) => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
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
