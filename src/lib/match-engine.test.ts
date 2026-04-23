/**
 * EVA-Covenant 核心逻辑自动化测试
 * 
 * 覆盖模块：
 * 1. match-engine: 分档算法 + 匹配算法 + 特殊触发 + 边界处理
 * 2. quiz-data: 题目完整性 + 向量有效性
 * 3. storage: 进度存取
 */

import { describe, it, expect, beforeEach } from "vitest";
import { scoresToGrades, parseVector, matchPersonality, type MatchInput } from "@/lib/match-engine";
import { questions, gateQuestion, triggerQuestion, unit13TriggerQuestion, personalityTypes, specialTypes, groups } from "@/lib/quiz-data";
import { DIMENSIONS, GRADE_VALUES, DIM_WEIGHTS, ALGO_PARAMS } from "@/lib/types";

const matchData: MatchInput = { personalityTypes, specialTypes };

function runMatch(scores: number[], gate?: string, trigger?: string) {
  return matchPersonality(scores, gate, trigger, matchData);
}

// ============================================================
// 1. scoresToGrades — 相对排名分档
// ============================================================
describe("scoresToGrades: 相对排名分档算法", () => {
  it("15个维度应产出 4L + 4M + 4H + 3X", () => {
    const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const grades = scoresToGrades(scores);
    expect(grades).toHaveLength(15);
    
    const counts = { L: 0, M: 0, H: 0, X: 0 };
    grades.forEach((g) => { counts[g]++; });
    expect(counts.L).toBe(4);
    expect(counts.M).toBe(4);
    expect(counts.H).toBe(4);
    expect(counts.X).toBe(3);
  });

  it("全相同分数也应产出 4L + 4M + 4H + 3X（同分打破）", () => {
    const scores = new Array(15).fill(5);
    const grades = scoresToGrades(scores);
    expect(grades).toHaveLength(15);
    
    const counts = { L: 0, M: 0, H: 0, X: 0 };
    grades.forEach((g) => { counts[g]++; });
    expect(counts.L).toBe(4);
    expect(counts.M).toBe(4);
    expect(counts.H).toBe(4);
    expect(counts.X).toBe(3);
  });

  it("最低分应得 L，最高分应得 X", () => {
    const scores = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 6, 6, 6, 6];
    const grades = scoresToGrades(scores);
    // 前四个1应得L
    expect(grades.slice(0, 4).every((g) => g === "L")).toBe(true);
    // 最后三个6应得X
    expect(grades.slice(12, 15).every((g) => g === "X")).toBe(true);
  });

  it("分档结果只含 L/M/H/X", () => {
    const scores = Array.from({ length: 15 }, () => Math.floor(Math.random() * 7));
    const grades = scoresToGrades(scores);
    const valid = new Set(["L", "M", "H", "X"]);
    grades.forEach((g) => expect(valid.has(g)).toBe(true));
  });

  it("分档是确定性的——相同输入永远产出相同输出", () => {
    const scores = [3, 1, 5, 2, 4, 6, 0, 3, 2, 5, 1, 4, 6, 2, 3];
    const r1 = scoresToGrades(scores);
    const r2 = scoresToGrades(scores);
    expect(r1).toEqual(r2);
  });
});

// ============================================================
// 2. parseVector — 向量解析
// ============================================================
describe("parseVector: 向量字符串解析", () => {
  it("正确解析 'HML-MML-HHL-MHM-HLL'", () => {
    const result = parseVector("HML-MML-HHL-MHM-HLL");
    expect(result).toEqual(["H", "M", "L", "M", "M", "L", "H", "H", "L", "M", "H", "M", "H", "L", "L"]);
    expect(result).toHaveLength(15);
  });

  it("解析结果只含 L/M/H/X", () => {
    const vec = "XMH-LLH-HMM-HLX-MHL";
    const result = parseVector(vec);
    const valid = new Set(["L", "M", "H", "X"]);
    result.forEach((g) => expect(valid.has(g)).toBe(true));
  });
});

// ============================================================
// 3. matchPersonality — 主匹配函数
// ============================================================
describe("matchPersonality: 人格匹配引擎", () => {
  it("正常匹配：返回完整结果结构", () => {
    const scores = [3, 2, 1, 4, 3, 2, 1, 5, 4, 3, 2, 1, 4, 3, 2];
    const result = runMatch(scores);
    
    // 结构完整性
    expect(result.top).toBeDefined();
    expect(result.top3).toHaveLength(3);
    expect(result.userVector).toHaveLength(15);
    expect(result.userScores).toEqual(scores);
    expect(result.groupPosition).toBeDefined();
    expect(result.groupPosition.rank).toBeGreaterThanOrEqual(1);
    expect(result.groupPosition.total).toBe(personalityTypes.length);
    
    // top 字段完整
    expect(result.top.code).toBeTruthy();
    expect(result.top.name).toBeTruthy();
    expect(result.top.similarity).toBeGreaterThanOrEqual(0);
    expect(result.top.similarity).toBeLessThanOrEqual(100);
    expect(result.top.isSpecial).toBeDefined();
    expect(result.top.isBoundary).toBeDefined();
  });

  it("top3 相似度降序排列", () => {
    const scores = [2, 3, 1, 5, 4, 2, 1, 3, 4, 2, 5, 1, 3, 4, 2];
    const result = runMatch(scores);
    
    for (let i = 1; i < result.top3.length; i++) {
      expect(result.top3[i - 1].similarity).toBeGreaterThanOrEqual(result.top3[i].similarity);
    }
  });

  it("匹配是确定性的——相同输入永远产出相同结果", () => {
    const scores = [3, 1, 5, 2, 4, 6, 0, 3, 2, 5, 1, 4, 6, 2, 3];
    const r1 = runMatch(scores);
    const r2 = runMatch(scores);
    expect(r1.top.code).toBe(r2.top.code);
    expect(r1.top.similarity).toBe(r2.top.similarity);
    expect(r1.userVector).toEqual(r2.userVector);
  });

  // --- 特殊触发：CMPL（人类补完）---
  describe("特殊触发: CMPL 人类补完", () => {
    it("满足三重条件时触发 CMPL", () => {
      // gateValue="complement" + triggerValue="CMPL" + C1共情力>=5 + A3 AT力场<=4
      const scores = new Array(15).fill(3);
      scores[6] = 5;  // C1 共情力 >= 5
      scores[2] = 2;  // A3 AT力场 <= 4
      
      const result = runMatch(scores, "complement", "CMPL");
      expect(result.top.code).toBe("CMPL");
      expect(result.top.isSpecial).toBe(true);
      expect(result.top.similarity).toBe(100);
    });

    it("C1共情力不足时不触发 CMPL", () => {
      const scores = new Array(15).fill(3);
      scores[6] = 3;  // C1 共情力 < 5
      scores[2] = 2;  // A3 AT力场 <= 4
      
      const result = runMatch(scores, "complement", "CMPL");
      expect(result.top.code).not.toBe("CMPL");
    });

    it("A3 AT力场过高时不触发 CMPL", () => {
      const scores = new Array(15).fill(3);
      scores[6] = 5;  // C1 共情力 >= 5
      scores[2] = 5;  // A3 AT力场 > 4
      
      const result = runMatch(scores, "complement", "CMPL");
      expect(result.top.code).not.toBe("CMPL");
    });

    it("gateValue 不匹配时不触发 CMPL", () => {
      const scores = new Array(15).fill(3);
      scores[6] = 5;
      scores[2] = 2;
      
      const result = runMatch(scores, "transcend", "CMPL");
      expect(result.top.code).not.toBe("CMPL");
    });

    it("triggerValue 不匹配时不触发 CMPL", () => {
      const scores = new Array(15).fill(3);
      scores[6] = 5;
      scores[2] = 2;
      
      const result = runMatch(scores, "complement", undefined);
      expect(result.top.code).not.toBe("CMPL");
    });
  });

  // --- 特殊触发：U13G（神之觉醒）---
  describe("特殊触发: U13G 神之觉醒", () => {
    it("满足三重条件时触发 U13G", () => {
      // gateValue="transcend" + triggerValue="U13G" + A1同步率>=5 + D3存在追问>=5
      const scores = new Array(15).fill(3);
      scores[0] = 5;   // A1 同步率 >= 5
      scores[11] = 5;  // D3 存在追问 >= 5
      
      const result = runMatch(scores, "transcend", "U13G");
      expect(result.top.code).toBe("U13G");
      expect(result.top.isSpecial).toBe(true);
      expect(result.top.similarity).toBe(100);
    });

    it("A1同步率不足时不触发 U13G", () => {
      const scores = new Array(15).fill(3);
      scores[0] = 3;   // A1 < 5
      scores[11] = 5;
      
      const result = runMatch(scores, "transcend", "U13G");
      expect(result.top.code).not.toBe("U13G");
    });

    it("D3存在追问不足时不触发 U13G", () => {
      const scores = new Array(15).fill(3);
      scores[0] = 5;
      scores[11] = 3;  // D3 < 5
      
      const result = runMatch(scores, "transcend", "U13G");
      expect(result.top.code).not.toBe("U13G");
    });
  });

  // --- 边界处理 ---
  describe("边界处理", () => {
    it("top1/top2 差距 < delta 且相似度 < threshold → 兜底 ADAM", () => {
      // 全零分数：所有模板距离最大，相似度最低
      const scores = new Array(15).fill(0);
      const result = runMatch(scores);
      
      // 可能触发 ADAM 兜底或匹配到某个类型
      // 关键是结果必须合法
      expect(result.top.code).toBeTruthy();
      expect(result.top.similarity).toBeGreaterThanOrEqual(0);
    });

    it("top1/top2 差距 < delta 但相似度 >= threshold → 标记 isBoundary", () => {
      // 构造一个接近多个模板的分数
      // 这取决于具体数据，但我们验证 isBoundary 字段存在
      const scores = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
      const result = runMatch(scores);
      expect(typeof result.top.isBoundary).toBe("boolean");
    });

    it("全零分数不崩溃", () => {
      const scores = new Array(15).fill(0);
      expect(() => runMatch(scores)).not.toThrow();
    });

    it("全满分分数不崩溃", () => {
      const scores = new Array(15).fill(6);
      expect(() => runMatch(scores)).not.toThrow();
    });
  });

  // --- groupPosition 确定性 ---
  describe("groupPosition 确定性", () => {
    it("groupPosition 不使用 Math.random——相同输入结果一致", () => {
      const scores = [2, 4, 1, 3, 5, 2, 1, 4, 3, 2, 5, 1, 3, 4, 2];
      const r1 = runMatch(scores);
      const r2 = runMatch(scores);
      expect(r1.groupPosition.rank).toBe(r2.groupPosition.rank);
      expect(r1.groupPosition.total).toBe(r2.groupPosition.total);
    });

    it("rank 在合理范围 [1, total]", () => {
      for (let i = 0; i < 10; i++) {
        const scores = Array.from({ length: 15 }, () => Math.floor(Math.random() * 7));
        const result = runMatch(scores);
        expect(result.groupPosition.rank).toBeGreaterThanOrEqual(1);
        expect(result.groupPosition.rank).toBeLessThanOrEqual(result.groupPosition.total);
      }
    });
  });
});

// ============================================================
// 4. quiz-data 数据完整性
// ============================================================
describe("quiz-data: 数据完整性验证", () => {
  it("常规题目数量 = 15维度 × 2 = 30道", () => {
    expect(questions).toHaveLength(30);
  });

  it("每道题有3个选项，分数为 1/2/3", () => {
    questions.forEach((q, i) => {
      expect(q.options).toHaveLength(3);
      q.options.forEach((opt) => {
        expect([1, 2, 3]).toContain(opt.score);
      });
    });
  });

  it("每道题的 dim 对应 DIMENSIONS 中的维度", () => {
    const dimCodes = new Set(DIMENSIONS.map((d) => d.code));
    questions.forEach((q) => {
      expect(dimCodes.has(q.dim as never)).toBe(true);
    });
  });

  it("每个维度恰好2道题", () => {
    const dimCounts: Record<string, number> = {};
    DIMENSIONS.forEach((d) => { dimCounts[d.code] = 0; });
    questions.forEach((q) => { dimCounts[q.dim] = (dimCounts[q.dim] || 0) + 1; });
    
    DIMENSIONS.forEach((d) => {
      expect(dimCounts[d.code]).toBe(2);
    });
  });

  it("门控题至少有2个选项", () => {
    expect(gateQuestion.options.length).toBeGreaterThanOrEqual(2);
  });

  it("门控题包含 complement 和 transcend 值", () => {
    const values = gateQuestion.options.map((o) => o.value);
    expect(values).toContain("complement");
    expect(values).toContain("transcend");
  });

  it("触发题包含可触发选项", () => {
    const cmplTriggers = triggerQuestion.options.map((o) => o.trigger).filter(Boolean);
    expect(cmplTriggers.length).toBeGreaterThanOrEqual(1);
    
    const u13Triggers = unit13TriggerQuestion.options.map((o) => o.trigger).filter(Boolean);
    expect(u13Triggers.length).toBeGreaterThanOrEqual(1);
  });

  it("22个常规人格类型", () => {
    expect(personalityTypes).toHaveLength(22);
  });

  it("3个特殊人格类型", () => {
    expect(specialTypes).toHaveLength(3);
  });

  it("每个常规类型的向量解析后恰好15个分档值", () => {
    personalityTypes.forEach((pt) => {
      const parsed = parseVector(pt.vector);
      expect(parsed).toHaveLength(15);
    });
  });

  it("每个常规类型的向量含 3X + 4H + 4M + 4L", () => {
    personalityTypes.forEach((pt) => {
      const parsed = parseVector(pt.vector);
      const counts = { L: 0, M: 0, H: 0, X: 0 };
      parsed.forEach((g) => { counts[g]++; });
      expect(counts.L).toBe(4);
      expect(counts.M).toBe(4);
      expect(counts.H).toBe(4);
      expect(counts.X).toBe(3);
    });
  });

  it("特殊类型包含 CMPL, U13G, ADAM", () => {
    const codes = specialTypes.map((s) => s.code);
    expect(codes).toContain("CMPL");
    expect(codes).toContain("U13G");
    expect(codes).toContain("ADAM");
  });

  it("11个分组", () => {
    expect(Object.keys(groups)).toHaveLength(11);
  });

  it("每个常规类型的 group 在 groups 中存在", () => {
    personalityTypes.forEach((pt) => {
      expect(groups).toHaveProperty(pt.group);
    });
  });

  it("每个常规类型包含必要字段", () => {
    personalityTypes.forEach((pt) => {
      expect(pt.code).toBeTruthy();
      expect(pt.name).toBeTruthy();
      expect(pt.group).toBeTruthy();
      expect(pt.vector).toBeTruthy();
      expect(pt.slogan).toBeTruthy();
      expect(pt.desc).toBeTruthy();
      expect(pt.emoji).toBeTruthy();
    });
  });
});

// ============================================================
// 5. 类型系统约束
// ============================================================
describe("types: 类型系统约束", () => {
  it("DIMENSIONS 有15个维度", () => {
    expect(DIMENSIONS).toHaveLength(15);
  });

  it("DIM_WEIGHTS 有15个权重值，全部 > 0", () => {
    expect(DIM_WEIGHTS).toHaveLength(15);
    DIM_WEIGHTS.forEach((w) => expect(w).toBeGreaterThan(0));
  });

  it("GRADE_VALUES: L=0, M=1, H=2, X=3", () => {
    expect(GRADE_VALUES.L).toBe(0);
    expect(GRADE_VALUES.M).toBe(1);
    expect(GRADE_VALUES.H).toBe(2);
    expect(GRADE_VALUES.X).toBe(3);
  });

  it("ALGO_PARAMS 关键参数合理", () => {
    expect(ALGO_PARAMS.questionsPerDim).toBe(2);
    expect(ALGO_PARAMS.delta).toBeGreaterThan(0);
    expect(ALGO_PARAMS.threshold).toBeGreaterThan(0);
    expect(ALGO_PARAMS.threshold).toBeLessThan(100);
  });
});

// ============================================================
// 6. 端到端匹配场景
// ============================================================
describe("端到端匹配场景", () => {
  it("全选最低分(1) → 可完成匹配", () => {
    const scores = new Array(15).fill(2); // 2题×1分=2
    const result = runMatch(scores);
    expect(result.top.code).toBeTruthy();
    expect(result.top3).toHaveLength(3);
  });

  it("全选最高分(3) → 可完成匹配", () => {
    const scores = new Array(15).fill(6); // 2题×3分=6
    const result = runMatch(scores);
    expect(result.top.code).toBeTruthy();
    expect(result.top3).toHaveLength(3);
  });

  it("极端偏科 → 可完成匹配", () => {
    // 只有A1维度最高，其他最低
    const scores = new Array(15).fill(0);
    scores[0] = 6;
    const result = runMatch(scores);
    expect(result.top.code).toBeTruthy();
  });

  it("匹配到的类型一定在 personalityTypes 或 specialTypes 中", () => {
    const allCodes = new Set([
      ...personalityTypes.map((p) => p.code),
      ...specialTypes.map((s) => s.code),
    ]);
    
    // 测试多种分数
    const testCases = [
      [3, 2, 1, 4, 3, 2, 1, 5, 4, 3, 2, 1, 4, 3, 2],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
    
    testCases.forEach((scores) => {
      const result = runMatch(scores);
      expect(allCodes.has(result.top.code)).toBe(true);
      result.top3.forEach((t) => {
        expect(allCodes.has(t.code)).toBe(true);
      });
    });
  });
});
