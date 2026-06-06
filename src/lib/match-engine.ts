import {
  GRADE_VALUES, DIM_WEIGHTS, ALGO_PARAMS,
  type Grade, type FullResult, type MatchResult,
} from "./types";

interface PersonalityData {
  code: string;
  name: string;
  group: string;
  vector: string;
  slogan: string;
  desc: string;
  evaUnit?: string | null;
  emoji: string;
}

interface SpecialData {
  code: string;
  name: string;
  triggerType: string;
  triggerCond: string;
  slogan: string;
  desc: string;
  emoji: string;
}

export interface MatchInput {
  personalityTypes: PersonalityData[];
  specialTypes: SpecialData[];
}

/**
 * 将每维度的原始分数转换为分档 (L/M/H/X)
 * 使用相对排名：按分数排序后分配 4L + 4M + 4H + 3X
 * 消除 L/M 概率垄断问题
 */
export function scoresToGrades(scores: number[]): Grade[] {
  const n = scores.length;
  // 按分数排序，同分用维度索引做确定性打破
  const indexed = scores.map((s, i) => ({ score: s + i * 0.001, index: i }));
  indexed.sort((a, b) => a.score - b.score);

  const grades: Grade[] = new Array(n);
  indexed.forEach((item, rank) => {
    if (rank < 4) grades[item.index] = "L";       // 最低4个维度
    else if (rank < 8) grades[item.index] = "M";   // 中低4个
    else if (rank < 12) grades[item.index] = "H";  // 中高4个
    else grades[item.index] = "X";                 // 最高3个
  });

  return grades;
}

/**
 * 解析向量字符串为 Grade 数组
 * "HML-MML-HHL" => ["H","M","L","M","M","L","H","H","L"]
 */
export function parseVector(vec: string): Grade[] {
  return vec.split("-").join("").split("") as Grade[];
}

/**
 * 计算加权曼哈顿距离和相似度
 */
function computeSimilarity(userGrades: Grade[], templateVec: string): number {
  const templateGrades = parseVector(templateVec);
  const maxGrade = 3; // X=3

  let dist = 0;
  let maxDist = 0;

  for (let i = 0; i < userGrades.length; i++) {
    const w = DIM_WEIGHTS[i];
    const uVal = GRADE_VALUES[userGrades[i]];
    const tVal = GRADE_VALUES[templateGrades[i]];
    dist += w * Math.abs(uVal - tVal);
    maxDist += w * maxGrade;
  }

  // 归一化: 用户和模板的最低可能距离是各自减去最小值
  // 但简化处理：直接用最大距离做归一化
  const minPossibleDist = 0;
  const adjustedMaxDist = maxDist - minPossibleDist;
  const similarity = ((adjustedMaxDist - dist) / adjustedMaxDist) * 100;

  return Math.max(0, Math.min(100, similarity));
}

/**
 * 主匹配函数
 */
export function matchPersonality(
  scores: number[],       // 15个维度的原始分数
  gateValue: string | undefined,
  triggerValue: string | undefined,
  matchData: MatchInput,
): FullResult {
  const { personalityTypes, specialTypes } = matchData;
  const userGrades = scoresToGrades(scores);
  const { delta, threshold } = ALGO_PARAMS;

  // ① 检查特殊触发 — 需要门控+触发+相对维度结构三重条件
  if (gateValue === "complement" && triggerValue === "CMPL") {
    // CMPL 应该是稀有结果：高共情 + 高孤独牵引 + 低边界，而不是只要选择补完路线就触发。
    const empathy = scores[6]; // C1
    const loneliness = scores[7]; // C2
    const atField = scores[2]; // A3
    const hasHighEmpathy = GRADE_VALUES[userGrades[6]] >= GRADE_VALUES.H && empathy >= atField + 2;
    const hasHighLonelinessPull = GRADE_VALUES[userGrades[7]] >= GRADE_VALUES.H && loneliness >= atField + 1;
    const hasLowBoundary = userGrades[2] === "L";

    if (hasHighEmpathy && hasHighLonelinessPull && hasLowBoundary) {
      const cmpl = specialTypes.find((s) => s.code === "CMPL");
      if (!cmpl) return matchPersonality(scores, undefined, undefined, matchData);
      const result: MatchResult = {
        code: cmpl.code, name: cmpl.name, slogan: cmpl.slogan,
        desc: cmpl.desc, similarity: 100, isSpecial: true,
        isBoundary: false, emoji: cmpl.emoji, vector: "HHH-HHH-HHH-HHH-HHH",
      };
      return {
        top: result, top3: [result],
        userVector: userGrades, userScores: scores,
        groupPosition: { rank: 1, total: 1, percentage: "<0.1%" },
      };
    }
  }

  // ①-2 检查十三号机特殊触发 — 需要高同步率+高存在追问
  if (gateValue === "transcend" && triggerValue === "U13G") {
    const syncRate = scores[0]; // A1
    const existential = scores[11]; // D3
    if (syncRate >= 5 && existential >= 5) {
      const u13g = specialTypes.find((s) => s.code === "U13G");
      if (!u13g) return matchPersonality(scores, undefined, undefined, matchData);
      const result: MatchResult = {
        code: u13g.code, name: u13g.name, slogan: u13g.slogan,
        desc: u13g.desc, similarity: 100, isSpecial: true,
        isBoundary: false, emoji: u13g.emoji, vector: "XMH-MHL-HHM-XMH-HHM",
      };
      return {
        top: result, top3: [result],
        userVector: userGrades, userScores: scores,
        groupPosition: { rank: 1, total: 1, percentage: "<0.1%" },
      };
    }
  }

  // ② 向量匹配：计算所有模板的相似度
  const ranked = personalityTypes
    .map((pt) => ({
      type: pt,
      similarity: computeSimilarity(userGrades, pt.vector),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const top3Types = ranked.slice(0, 3);

  const top1 = top3Types[0];
  const top2 = top3Types[1];

  // ③ 边界检查
  let isBoundary = false;
  let selectedType = top1;
  let usedFallback = false;

  const gap = top1.similarity - top2.similarity;

  if (gap < delta) {
    // Top1 和 Top2 差距太小
    if (top1.similarity < threshold) {
      // 相似度太低 → 兜底（第一使徒 ADAM）
      const adam = specialTypes.find((s) => s.code === "ADAM")!;
      selectedType = {
        type: {
          code: adam.code, name: adam.name, group: "adam",
          vector: userGrades.join("").replace(/(.{3})/g, "$1-").slice(0, -1),
          slogan: adam.slogan, desc: adam.desc, emoji: adam.emoji,
        },
        similarity: top1.similarity,
      };
      usedFallback = true;
    } else {
      isBoundary = true;
    }
  }

  const topResult: MatchResult = {
    code: selectedType.type.code,
    name: selectedType.type.name,
    slogan: selectedType.type.slogan,
    desc: selectedType.type.desc,
    similarity: Math.round(selectedType.similarity * 10) / 10,
    isSpecial: usedFallback,
    isBoundary,
    emoji: selectedType.type.emoji,
    vector: selectedType.type.vector,
    evaUnit: selectedType.type.evaUnit ?? undefined,
  };

  const top3Results: MatchResult[] = top3Types.map((t) => ({
    code: t.type.code,
    name: t.type.name,
    slogan: t.type.slogan,
    desc: t.type.desc,
    similarity: Math.round(t.similarity * 10) / 10,
    isSpecial: false,
    isBoundary: false,
    emoji: t.type.emoji,
    vector: t.type.vector,
    evaUnit: t.type.evaUnit ?? undefined,
  }));

  // 计算群体定位（基于用户向量做确定性排名估算）
  const estimatedTotal = personalityTypes.length; // 22

  // 基于用户总分做确定性估算：总分越高排名越靠前
  const totalScore = userGrades.reduce((sum, grade) => sum + GRADE_VALUES[grade], 0);
  const maxScore = userGrades.length * 3;
  const estimatedRank = Math.max(1, Math.min(estimatedTotal,
    Math.round(((maxScore - totalScore) / maxScore) * estimatedTotal * 0.8) + 1
  ));

  return {
    top: topResult,
    top3: top3Results,
    userVector: userGrades,
    userScores: scores,
    groupPosition: {
      rank: estimatedRank,
      total: estimatedTotal,
      percentage: `${((estimatedRank / estimatedTotal) * 100).toFixed(1)}%`,
    },
  };
}
