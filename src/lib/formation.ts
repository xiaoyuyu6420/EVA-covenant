import { DIMENSIONS, GRADE_VALUES, type FullResult, type Grade, type MatchResult } from "./types";

export interface RankedDimension {
  grade: Grade;
  index: number;
  score: number;
}

const MARKER_BY_CODE: Record<string, string> = {
  SYNC01: "01",
  BERS01: "01",
  COM02: "02",
  FURY02: "02",
  VOID00: "00",
  SACR00: "00",
  GRD03: "03",
  SACR03: "03",
  VAN04: "04",
  SIG04: "04",
  BEAST5: "05",
  GUARD5: "05",
  DESC06: "06",
  ANGEL06: "06",
  SNIP08: "08",
  REB08: "08",
  CLONE09: "09",
  ECHO09: "09",
  DUAL13: "13",
  AWAKE13: "13",
  FUS82: "8+2",
  ASYM82: "8+2",
  CMPL: "LCL",
  U13G: "13",
  ADAM: "A",
  REI0: "00",
};

const DISPLAY_NAME_BY_CODE: Record<string, string> = {
  SYNC01: "EVA 初号机",
  BERS01: "EVA 初号机暴走",
  COM02: "EVA 贰号机",
  FURY02: "EVA 贰号机近战配置",
  VOID00: "EVA 零号机",
  SACR00: "EVA 零号机改",
  GRD03: "EVA 参号机",
  SACR03: "EVA 参号机侵蚀记录",
  VAN04: "EVA 四号机",
  SIG04: "EVA 四号机 S2 试验",
  BEAST5: "EVA 五号机",
  GUARD5: "EVA 五号机临时配置",
  DESC06: "EVA Mark.06",
  ANGEL06: "EVA Mark.06 使徒侧记录",
  SNIP08: "EVA 八号机",
  REB08: "EVA 八号机 WILLE 配置",
  CLONE09: "EVA 九号机",
  ECHO09: "EVA 九号机 Adams 容器",
  DUAL13: "EVA 十三号机",
  AWAKE13: "EVA 十三号机觉醒",
  FUS82: "EVA 8+2号机",
  ASYM82: "EVA 8+2号机非对称配置",
  CMPL: "人类补完计划",
  U13G: "EVA 十三号机觉醒",
  ADAM: "第一使徒 Adam",
  REI0: "EVA 零号机共鸣",
};

export function rankTopDimensions(userGrades: Grade[] | null | undefined, dimScores: number[], limit = 4): RankedDimension[] {
  if (!userGrades) return [];

  return userGrades
    .map((grade, index) => ({ grade, index, score: dimScores[index] ?? 0 }))
    .sort((a, b) => {
      if (GRADE_VALUES[b.grade] !== GRADE_VALUES[a.grade]) {
        return GRADE_VALUES[b.grade] - GRADE_VALUES[a.grade];
      }
      return b.score - a.score;
    })
    .slice(0, limit);
}

export function getEvaMarker(match: MatchResult) {
  const exact = MARKER_BY_CODE[match.code];
  if (exact) return exact;

  const raw = `${match.evaUnit ?? ""} ${match.name} ${match.code}`.toLowerCase();
  if (raw.includes("8+2") || raw.includes("08+02")) return "8+2";
  if (raw.includes("十三") || raw.includes("13")) return "13";
  if (raw.includes("mark.06") || raw.includes("mark06") || raw.includes("06")) return "06";
  if (raw.includes("九号") || raw.includes("09")) return "09";
  if (raw.includes("八号") || raw.includes("08")) return "08";
  if (raw.includes("五号") || raw.includes("05")) return "05";
  if (raw.includes("四号") || raw.includes("04")) return "04";
  if (raw.includes("参号") || raw.includes("三号") || raw.includes("03")) return "03";
  if (raw.includes("贰号") || raw.includes("二号") || raw.includes("02")) return "02";
  if (raw.includes("初号") || raw.includes("01")) return "01";
  if (raw.includes("零号") || raw.includes("00")) return "00";
  return "?";
}

export function getResultDisplayName(match: MatchResult) {
  return DISPLAY_NAME_BY_CODE[match.code] ?? match.evaUnit ?? match.name.replace(/[型系]/g, "");
}

export function getFormationDimensionCodes(topDimensions: RankedDimension[]) {
  return topDimensions
    .slice(0, 3)
    .map((dimension) => `${DIMENSIONS[dimension.index].code}${dimension.grade}`)
    .join("-");
}

export function getFormationDimensionLabels(topDimensions: RankedDimension[], gradeLabels: Record<Grade, string>) {
  return topDimensions
    .slice(0, 3)
    .map((dimension) => `${DIMENSIONS[dimension.index].code}${gradeLabels[dimension.grade]}`)
    .join("/");
}

export function buildFormationCodeFromDimensions(marker: string, resultCode: string, topDimensions: RankedDimension[]) {
  const dimensionCodes = getFormationDimensionCodes(topDimensions);
  return `${marker}-${resultCode}-${dimensionCodes || "SYNC"}`.replace(/\s+/g, "").toUpperCase();
}

export function buildFormationCode(result: FullResult) {
  return buildFormationCodeFromDimensions(
    getEvaMarker(result.top),
    result.top.code,
    rankTopDimensions(result.userVector, result.userScores, 3)
  );
}
