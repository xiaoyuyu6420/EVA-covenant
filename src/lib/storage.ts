import { DIMENSIONS } from "./types";

const STORAGE_KEY = "eva-covenant";

interface StorageData {
  currentQuestion: number;
  answers: number[];
  gateAnswer?: string;
  triggerAnswer?: string;
  completedAt?: string;
  lastResult?: string;
  answerLog?: Array<{ dim: string; text: string; label: string; score: number }>;
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

export function saveResult(code: string): void {
  const history = getHistory();
  history.push({ code, date: new Date().toISOString() });
  if (typeof window !== "undefined") {
    localStorage.setItem(`${STORAGE_KEY}-history`, JSON.stringify(history));
  }
}

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
