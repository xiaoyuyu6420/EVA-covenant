// ===== 维度定义 =====
export const DIMENSIONS = [
  // 模型 A - 适格性 (Pilot Compatibility)
  { code: "A1", model: "A", name: "同步率", desc: "与EVA建立精神链接的能力" },
  { code: "A2", model: "A", name: "抗压能力", desc: "面对精神冲击的承受力" },
  { code: "A3", model: "A", name: "AT力场", desc: "自我边界与防御强度" },
  // 模型 B - 战斗风格 (Combat Style)
  { code: "B1", model: "B", name: "攻击性", desc: "主动出击 vs 防守反击" },
  { code: "B2", model: "B", name: "战术性", desc: "依赖计划 vs 直觉反应" },
  { code: "B3", model: "B", name: "决断力", desc: "紧急时刻的果断程度" },
  // 模型 C - 情感模式 (Emotional Pattern)
  { code: "C1", model: "C", name: "共感", desc: "对他人情感的感知能力" },
  { code: "C2", model: "C", name: "独处倾向", desc: "倾向独处 vs 寻求连接" },
  { code: "C3", model: "C", name: "表达欲", desc: "内敛压抑 vs 外放直接" },
  // 模型 D - 价值取向 (Value System)
  { code: "D1", model: "D", name: "责任感", desc: "对使命任务的承担意愿" },
  { code: "D2", model: "D", name: "自我关注", desc: "自我需求 vs 他人优先" },
  { code: "D3", model: "D", name: "意义感", desc: "对生命意义的探索深度" },
  // 模型 E - 互动模式 (Interaction)
  { code: "E1", model: "E", name: "独立性", desc: "依赖他人 vs 独自行动" },
  { code: "E2", model: "E", name: "信任度", desc: "对他人组织的信任程度" },
  { code: "E3", model: "E", name: "领导力", desc: "主导局面 vs 服从指令" },
] as const;

export type DimCode = (typeof DIMENSIONS)[number]["code"];

// ===== 维度索引常量 (避免魔法数字) =====
export const DIM_INDEX = {
  A1: 0, A2: 1, A3: 2,
  B1: 3, B2: 4, B3: 5,
  C1: 6, C2: 7, C3: 8,
  D1: 9, D2: 10, D3: 11,
  E1: 12, E2: 13, E3: 14,
} as const;

// ===== 分档 =====
export type Grade = "L" | "M" | "H" | "X";
export const GRADE_VALUES: Record<Grade, number> = { L: 0, M: 1, H: 2, X: 3 };
export const GRADE_LABELS: Record<Grade, string> = { L: "低", M: "中", H: "高", X: "极高" };

// ===== 题目 =====
export interface QuizOption {
  label: string;
  score: number; // 1 | 2 | 3
}

export interface QuizQuestion {
  dim: DimCode;
  text: string;
  options: QuizOption[];
}

export interface GateQuestion {
  text: string;
  options: { label: string; value: string }[];
}

export interface TriggerQuestion {
  text: string;
  options: { label: string; trigger?: string }[];
}

// ===== 人格类型 =====
export interface PersonalityType {
  code: string;
  name: string;
  group: string;
  vector: string; // "HML-MML-HHL-MHM-HLL"
  slogan: string;
  desc: string;
  evaUnit?: string;
  emoji: string;
}

export interface SpecialType {
  code: string;
  name: string;
  triggerType: "gate+trigger" | "fallback";
  triggerCond: string;
  slogan: string;
  desc: string;
  emoji: string;
}

// ===== 匹配结果 =====
export interface MatchResult {
  code: string;
  name: string;
  slogan: string;
  desc: string;
  similarity: number;
  isSpecial: boolean;
  isBoundary: boolean;
  emoji: string;
  vector: string;
  evaUnit?: string;
}

export interface FullResult {
  top: MatchResult;
  top3: MatchResult[];
  userVector: Grade[];
  userScores: number[];
  groupPosition: { rank: number; total: number; percentage: string };
}

// ===== 权重 =====
export const DIM_WEIGHTS = [
  1.5, 1.2, 1.0, // A1 A2 A3
  1.5, 1.0, 1.2, // B1 B2 B3
  1.0, 1.0, 1.2, // C1 C2 C3
  1.0, 1.5, 1.0, // D1 D2 D3
  1.0, 1.2, 1.0, // E1 E2 E3
];

// ===== 算法参数 =====
export const ALGO_PARAMS = {
  questionsPerDim: 3,
  maxScorePerQ: 3,
  minTotal: 3,
  maxTotal: 9,
  delta: 3,      // Top1/Top2差距阈值 %（相对分档后差异更小）
  threshold: 50, // 兜底相似度下限 %
};
