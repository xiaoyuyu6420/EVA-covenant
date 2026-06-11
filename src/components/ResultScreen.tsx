"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { Copy, Maximize2, Minimize2, RotateCcw, Share2 } from "lucide-react";
import type { FullResult, Grade, MatchResult } from "@/lib/types";
import { DIMENSIONS } from "@/lib/types";
import { buildShareUrl, createShareId, normalizeRelayDepth, trackEvent } from "@/lib/analytics";
import { buildFormationCodeFromDimensions, getFormationDimensionLabels, rankTopDimensions } from "@/lib/formation";

interface Props {
  result: FullResult;
  onRestart: () => void;
  dimScores: number[];
  userGrades: Grade[] | null;
  relaySourceCode?: string;
  relaySourceUnit?: string;
  relayRootCode?: string;
  relayDepth?: number;
}

type Theme = {
  bg: string;
  panel: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  glow: string;
};

type ResultProfile = {
  displayName: string;
  modelName: string;
  jpName: string;
  marker: string;
  route: string;
  lore: string;
  reading: string;
  tension: string;
  shareLine: string;
  theme: Theme;
};

type FormationSignature = {
  marker: string;
  typeCode: string;
  dimensionCodes: string[];
};

type RelayRelation = {
  label: string;
  description: string;
  dimensionNote: string;
  upstreamLabel: string;
  currentLabel: string;
  sharedDimensionCodes: string[];
};

type RelayInviteKey = "general" | "contrast" | "same_axis" | "verify";

type RelayInviteOption = {
  key: RelayInviteKey;
  shareId: string;
  label: string;
  title: string;
  target: string;
  reason: string;
  url: string;
  nativeText: string;
  message: string;
};

type InviteShareChannel =
  | "invite_copy"
  | "target_invite_copy"
  | "invite_native"
  | "target_invite_native"
  | "invite_fallback"
  | "target_invite_fallback"
  | "quick_invite_copy"
  | "quick_target_invite_copy"
  | "quick_invite_native"
  | "quick_target_invite_native"
  | "quick_invite_fallback"
  | "quick_target_invite_fallback";

type InviteSharePlacement = "detail" | "quick";
type InviteShareTransport = "copy" | "native" | "fallback";

const GRADE_LABELS: Record<Grade, string> = { L: "低", M: "中", H: "高", X: "极高" };
const GRADE_WIDTH: Record<Grade, number> = { L: 28, M: 52, H: 76, X: 100 };
const DIMENSION_NAMES: Map<string, string> = new Map(DIMENSIONS.map((dimension) => [dimension.code, dimension.name]));
const DIMENSION_CHAIN_PROMPTS = [
  "同步率越高，越容易和截然不同的机体产生共鸣——找一位默契度接近的人对照，结果往往出人意料。",
  "心理韧性的差异会直接影响编队中的互补结构。找一位面对压力反应不同的人，机体差异会很明显。",
  "AT 力场是编队对照中最容易产生发现的维度。找一位边界感明确的人，看看你们的防御逻辑有多大差异。",
  "攻击性拉开后，前锋和支援的分工会更清晰。找一位行动节奏和你不同的人，看看谁更适合冲在前面。",
  "计划性差异会塑造完全不同的作战风格。找一位更依赖直觉反应的人，对照你们的决策路径。",
  "决断力高的位置天然是编队的锚点。找一位关键时刻反应风格不同的人，看谁更像指挥位。",
  "共情阈的接近程度，决定你们能否读懂彼此没说出口的部分。找一位共感能力接近的人对照。",
  "疏离倾向拉开后，编队中独处和连接的张力会变得非常直观。找一位社交偏好不同的人。",
  "情绪开放度差异越大，你们对同一件事的表达反差越明显。找一位情绪习惯不同的人对照。",
  "责任感偏高的人容易在编队里承担过多。找一位责任分配感不同的人，看看谁更先上机。",
  "自我参照度决定你在编队中的角色定位——是为自己还是为他人而战。找一位自我关注程度不同的人。",
  "存在敏感度偏高意味着你不会轻易放过意义层面的问题。找一位思考深度不同的人对照。",
  "独立性差异大的编队，合作模式更有辨识度。找一位依赖偏好不同的人，看看编队的结构。",
  "信任度是编队能否稳定运转的基础变量。找一位对系统和权威态度不同的人。",
  "领导力维度决定谁在编队里接管局面。找一位掌控偏好不同的人，看看谁更像指挥位。",
];

function cleanInviteName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 12);
}

const THEMES: Record<string, Theme> = {
  unit00: {
    bg: "#121107",
    panel: "rgba(246, 196, 69, 0.08)",
    primary: "#f6c445",
    secondary: "#48a8ff",
    accent: "#f4f0df",
    muted: "#8d8a77",
    glow: "rgba(246, 196, 69, 0.34)",
  },
  unit01: {
    bg: "#0d0815",
    panel: "rgba(111, 67, 216, 0.12)",
    primary: "#7650dc",
    secondary: "#7cff00",
    accent: "#f0a42b",
    muted: "#9182ae",
    glow: "rgba(124, 255, 0, 0.25)",
  },
  unit02: {
    bg: "#130607",
    panel: "rgba(215, 25, 32, 0.12)",
    primary: "#d71920",
    secondary: "#ff9300",
    accent: "#f4f2ec",
    muted: "#aa7870",
    glow: "rgba(255, 147, 0, 0.26)",
  },
  unit03: {
    bg: "#080807",
    panel: "rgba(220, 220, 210, 0.08)",
    primary: "#e6e4d8",
    secondary: "#1a1a18",
    accent: "#b81822",
    muted: "#85857c",
    glow: "rgba(184, 24, 34, 0.28)",
  },
  unit04: {
    bg: "#08090a",
    panel: "rgba(216, 221, 225, 0.08)",
    primary: "#d8dde1",
    secondary: "#8c99a3",
    accent: "#e84d4d",
    muted: "#8a9096",
    glow: "rgba(216, 221, 225, 0.22)",
  },
  unit05: {
    bg: "#081108",
    panel: "rgba(114, 182, 90, 0.11)",
    primary: "#72b65a",
    secondary: "#d0d2c4",
    accent: "#ffe36e",
    muted: "#819178",
    glow: "rgba(255, 227, 110, 0.22)",
  },
  mark06: {
    bg: "#050817",
    panel: "rgba(40, 62, 143, 0.16)",
    primary: "#2b4096",
    secondary: "#d1b34a",
    accent: "#eef1f7",
    muted: "#7f88aa",
    glow: "rgba(43, 64, 150, 0.34)",
  },
  unit08: {
    bg: "#150813",
    panel: "rgba(237, 108, 174, 0.12)",
    primary: "#ed6cae",
    secondary: "#ff9d2e",
    accent: "#eef3ef",
    muted: "#aa7d96",
    glow: "rgba(237, 108, 174, 0.28)",
  },
  unit09: {
    bg: "#120b07",
    panel: "rgba(241, 163, 61, 0.12)",
    primary: "#f1a33d",
    secondary: "#f2edda",
    accent: "#3a2019",
    muted: "#a88562",
    glow: "rgba(241, 163, 61, 0.28)",
  },
  unit13: {
    bg: "#080710",
    panel: "rgba(76, 48, 130, 0.16)",
    primary: "#4c3082",
    secondary: "#c8ad62",
    accent: "#77ff7c",
    muted: "#8c7ca5",
    glow: "rgba(119, 255, 124, 0.18)",
  },
  unit82: {
    bg: "#13070d",
    panel: "rgba(237, 108, 174, 0.11)",
    primary: "#d71920",
    secondary: "#ed6cae",
    accent: "#77ff7c",
    muted: "#aa798a",
    glow: "rgba(237, 108, 174, 0.25)",
  },
  special: {
    bg: "#120907",
    panel: "rgba(242, 130, 54, 0.11)",
    primary: "#f28236",
    secondary: "#ffe1b8",
    accent: "#b61f26",
    muted: "#a88772",
    glow: "rgba(242, 130, 54, 0.26)",
  },
};

const PROFILES: Record<string, ResultProfile> = {
  SYNC01: {
    displayName: "EVA 初号机",
    modelName: "EVANGELION-01 TEST TYPE",
    jpName: "エヴァンゲリオン初号機",
    marker: "01",
    route: "测试机 / 高同步适格",
    lore: "初号机不是一台稳定的武器。它的故事总是和异常同步率、核心里的亲子关系、关键战斗中的失控绑在一起。",
    reading: "你的同步率和存在敏感度同时偏高，结果落在了初号机。与其说你在追求胜利，不如说你是被压力逼着建立连接的那种人。",
    tension: "你的临界点很高，能扛住压力。但任务、关系和自我证明容易搅在一起，分不清哪个是哪个。",
    shareLine: "测试把我分到初号机：能启动，但不一定好控制。",
    theme: THEMES.unit01,
  },
  BERS01: {
    displayName: "EVA 初号机暴走",
    modelName: "EVANGELION-01 BERSERK STATE",
    jpName: "エヴァンゲリオン初号機 暴走",
    marker: "01",
    route: "暴走状态 / 临界同步",
    lore: "这不是一份常规的运行日志。初号机暴走是机体意志、驾驶员崩溃和核心反应同时爆发的事件——系统记录到的数据远超正常阈值。",
    reading: "你的同步率、心理韧性和攻击反应都很高，被推到了暴走状态。重点不是你脾气大，而是压力超过阈值之后，你会直接接管行动。",
    tension: "你最强的地方是危机里会自己动起来。最危险的地方也在这里——事后你未必解释得清每一步。",
    shareLine: "测试把我分到初号机暴走：不是稳定输出，是临界反应。",
    theme: THEMES.unit01,
  },
  COM02: {
    displayName: "EVA 贰号机",
    modelName: "EVANGELION-02 PRODUCTION MODEL",
    jpName: "エヴァンゲリオン弐号機",
    marker: "02",
    route: "正式量产机 / 实战适格",
    lore: "贰号机是第一台正式投入实战的 EVA。红色机体、武器适应性、驾驶员的强自尊，是它最鲜明的记忆。",
    reading: "你的攻击性、决断力和自我参照度都偏前列。这不是说你脾气差，而是你的行动优先级很清楚——先上场，再修细节。",
    tension: "你不用等别人推你，这是你的优势。代价是失败的时候，你很难把它当成普通失误。",
    shareLine: "测试把我分到贰号机：能打，且很难假装不在意。",
    theme: THEMES.unit02,
  },
  FURY02: {
    displayName: "EVA 贰号机近战配置",
    modelName: "EVANGELION-02 ASSAULT CONFIG",
    jpName: "エヴァンゲリオン弐号機 近接戦闘",
    marker: "02",
    route: "近战配置 / 高压推进",
    lore: "贰号机在系列里打了最多的正面战斗。它的美感不在神秘，而在清晰、锋利、带着自尊的进攻姿态。",
    reading: "你的战斗判断比情绪表达更快。你适合短时间高压推进，但不适合长时间解释自己为什么这么做。",
    tension: "你出手干净，这是优势。风险在于你会把休息也理解成退让。",
    shareLine: "测试把我分到贰号机近战配置：先处理问题，再处理感受。",
    theme: THEMES.unit02,
  },
  VOID00: {
    displayName: "EVA 零号机",
    modelName: "EVANGELION-00 PROTOTYPE",
    jpName: "エヴァンゲリオン零号機",
    marker: "00",
    route: "原型机 / 低表征适格",
    lore: "零号机是最早投入测试的原型机。它的存在感偏冷，和试验、替换、沉默的执行感绑在一起。",
    reading: "你的责任感和独立性高，但情绪开放度和自我需求偏低。系统能读到你的执行力，却读不到太多外放信号。",
    tension: "你能稳定地扛住事情。但要小心长期把自己当成可替换的零件。",
    shareLine: "测试把我分到零号机：安静，不代表没有反应。",
    theme: THEMES.unit00,
  },
  SACR00: {
    displayName: "EVA 零号机改",
    modelName: "EVANGELION-00 REFIT",
    jpName: "エヴァンゲリオン零号機 改",
    marker: "00",
    route: "改装原型机 / 防御型",
    lore: "零号机改看起来更像正式机体了，但它保留了原型机的冷感。原作里它经常被放在保护、测试和牺牲的位置上。",
    reading: "你的边界感和责任感都很高，但同步率和共情阈的外放不强。你更像先完成保护，再决定要不要解释原因。",
    tension: "你的边界很清晰。风险是别人只看得见你的克制，看不见克制背后的投入。",
    shareLine: "测试把我分到零号机改：边界很硬，选择很少说出口。",
    theme: THEMES.unit00,
  },
  GRD03: {
    displayName: "EVA 参号机",
    modelName: "EVANGELION-03 PRODUCTION MODEL",
    jpName: "エヴァンゲリオン参号機",
    marker: "03",
    route: "正式机 / 普通人的战场",
    lore: "参号机本来是正式量产线上的机体，但在原作里被使徒侵蚀，成了一个很具体的悲剧。",
    reading: "你的责任感高，基础数据比较均衡，接近参号机。它不像初号机那样神秘，也不像贰号机那样张扬，但它扛的是具体的人和具体的后果。",
    tension: "你能把责任落到现实里。但太容易把别人的安全放在自己前面。",
    shareLine: "测试把我分到参号机：普通配置，承担的事不普通。",
    theme: THEMES.unit03,
  },
  SACR03: {
    displayName: "EVA 参号机 侵蚀态",
    modelName: "EVANGELION-03 CONTAMINATION LOG",
    jpName: "エヴァンゲリオン参号機 侵食記録",
    marker: "03",
    route: "侵蚀态 / 高责任阈值",
    lore: "以下数据提取自侵蚀发生后的残留记录。参号机最重要的剧情不是性能，而是被侵蚀后的不可逆处境。机体变成敌人时，驾驶员还困在系统里面。",
    reading: "你的责任感过高，同时同步率和独立性也不低。这意味着局面已经不公平时，你仍然倾向于留在里面解决。",
    tension: "你不会轻易退出。风险是你太晚才承认自己也需要撤离。",
    shareLine: "测试把我分到参号机 侵蚀态：不是不怕，是没退出。",
    theme: THEMES.unit03,
  },
  VAN04: {
    displayName: "EVA 四号机",
    modelName: "EVANGELION-04 EXPERIMENTAL",
    jpName: "エヴァンゲリオン四号機",
    marker: "04",
    route: "试验机 / S2 机关",
    lore: "四号机几乎没有实战记录可查。S2 机关试验报告显示，它和第二支部消失这类资料性事件连在一起。",
    reading: "你的数据偏向理论稳定和低可见度。匹配四号机不是因为空白，而是因为你的很多关键反应不会在日常场景里被看到。",
    tension: "你能在复杂系统里保持冷静。但你的存在感容易被误判成缺席。",
    shareLine: "测试把我分到四号机：记录很少，但不是没有发生。",
    theme: THEMES.unit04,
  },
  SIG04: {
    displayName: "EVA 四号机 S2 试验",
    modelName: "EVANGELION-04 S2 TEST LOG",
    jpName: "エヴァンゲリオン四号機 S2実験",
    marker: "04",
    route: "S2 试验 / 高理性低表征",
    lore: "四号机的 S2 机关试验是 EVA 世界观里少见的技术性灾难。危险来自看似精确的系统边界被突破。",
    reading: "你的计划性高，情绪开放度低。系统把你归到 S2 试验，是因为你习惯先算后感受，甚至会把感受从记录里删掉。",
    tension: "你很精确。但精确到最后只剩结论，没人知道过程。",
    shareLine: "测试把我分到四号机 S2 试验：看起来冷静，其实只是记录方式不同。",
    theme: THEMES.unit04,
  },
  BEAST5: {
    displayName: "EVA 五号机",
    modelName: "EVANGELION-05 PROVISIONAL",
    jpName: "エヴァンゲリオン五号機",
    marker: "05",
    route: "临时机 / 局地作战",
    lore: "五号机是临时、局地、不完整感很强的机体。它的重点不是标准化，而是在有限条件下把任务完成。",
    reading: "你的攻击性和决断力高，战术上不一定会走常规路线。五号机适合你这种反应——装备不完美，但会先把入口守住。",
    tension: "你的临场反应很强。风险是长期把粗糙当成唯一可用的方式。",
    shareLine: "测试把我分到五号机：配置不满，照样开打。",
    theme: THEMES.unit05,
  },
  GUARD5: {
    displayName: "EVA 五号机临时配置",
    modelName: "EVANGELION-05 DEFENSE CONFIG",
    jpName: "エヴァンゲリオン五号機 暫定装備",
    marker: "05",
    route: "临时配置 / 阵地防御",
    lore: "五号机的临时感让它更像一台被推上前线的工程系统。它的意义在于够用，而不是完美。",
    reading: "你的同步率和独立性偏高，攻击性中等。结果指向防守型临时配置——你不主动夸张，但阵地交给你时会守住。",
    tension: "你很可靠。但要小心太习惯在资源不足的情况下硬撑。",
    shareLine: "测试把我分到五号机临时配置：没有满配，但会守线。",
    theme: THEMES.unit05,
  },
  DESC06: {
    displayName: "EVA Mark.06",
    modelName: "EVANGELION Mark.06",
    jpName: "エヴァンゲリオン Mark.06",
    marker: "06",
    route: "月面机体 / 非 NERV 标准线",
    lore: "Mark.06 来自月面，和 SEELE 有关系，带着接近使徒的暧昧气质。它在原作里更冷、更远，像是被提前安排好的一枚棋子。",
    reading: "你的共情阈和心理韧性高，但攻击性不突出。这个组合指向 Mark.06——你能理解局面，但不急着证明自己在场。",
    tension: "距离感让你看得清楚，但也容易把真心藏成礼貌。",
    shareLine: "测试把我分到 Mark.06：离得远，但看得很清楚。",
    theme: THEMES.mark06,
  },
  ANGEL06: {
    displayName: "EVA Mark.06 使徒侧",
    modelName: "EVANGELION Mark.06 ANGELIC TRACE",
    jpName: "エヴァンゲリオン Mark.06 使徒側記録",
    marker: "06",
    route: "使徒侧 / 高共情阈",
    lore: "追踪档案显示 Mark.06 一直带着接近使徒的暧昧感。它不是普通量产线的延伸，而是一台带着更高层目的的机体。",
    reading: "高同步加上高共情阈，让你的结果偏向 Mark.06 使徒侧。你对情绪和气氛的捕捉很快，但行动不一定会跟着出来。",
    tension: "你能读懂没说出口的东西。但容易把理解误认为已经解决。",
    shareLine: "测试把我分到 Mark.06 使徒侧：感知很准，行动很慢。",
    theme: THEMES.mark06,
  },
  SNIP08: {
    displayName: "EVA 八号机",
    modelName: "EVANGELION-08 WILLE CUSTOM",
    jpName: "エヴァンゲリオン八号機",
    marker: "08",
    route: "WILLE 机体 / 远程支援",
    lore: "八号机属于 WILLE 阵营，粉色机体和多眼设计让人过目不忘。它更多承担远程支援和战场观察的角色。",
    reading: "你的计划性高，攻击性不一定高。八号机对应的是距离、观察和精确介入，而不是一开始就冲进中心。",
    tension: "你看得全面。但太习惯站在远处，容易错过需要直接表态的时刻。",
    shareLine: "测试把我分到八号机：不站最前，但会瞄准。",
    theme: THEMES.unit08,
  },
  REB08: {
    displayName: "EVA 八号机 WILLE 配置",
    modelName: "EVANGELION-08 WILLE FIELD CONFIG",
    jpName: "エヴァンゲリオン八号機 WILLE装備",
    marker: "08",
    route: "WILLE 配置 / 反 NERV 线路",
    lore: "八号机的立场不属于传统 NERV 系统。它的故事重点是脱离原指挥链之后，仍然保持作战能力。",
    reading: "你的独立性和计划性都高，信任度偏低。这不是简单的叛逆，而是你更愿意先验证系统，再决定要不要服从。",
    tension: "你不容易被话术带走。但长期把怀疑当成唯一安全感，会累。",
    shareLine: "测试把我分到八号机 WILLE 配置：不是不合作，是先看指挥权给谁。",
    theme: THEMES.unit08,
  },
  CLONE09: {
    displayName: "EVA 九号机",
    modelName: "EVANGELION Mark.09 / ADAMS VESSEL",
    jpName: "エヴァンゲリオン九号機",
    marker: "09",
    route: "Adams之器 / 复制线路",
    lore: "容器分析表明九号机带着容器和复制的意味。它借用了零号机的视觉记忆，却不是同一台机体。",
    reading: "你的责任感高，自我参照度低。九号机对应的是编号、替代和任务优先，而不是强烈的个人叙事。",
    tension: "你能很快进入角色。风险是进入得太彻底，忘了角色不是自己。",
    shareLine: "测试把我分到九号机：名字不重要，编号会工作。",
    theme: THEMES.unit09,
  },
  ECHO09: {
    displayName: "EVA 九号机 Adams之器",
    modelName: "EVANGELION Mark.09 ADAMS VESSEL",
    jpName: "エヴァンゲリオン九号機 Adamsの器",
    marker: "09",
    route: "Adams之器 / 零号机回声",
    lore: "九号机看起来像零号机的延续，但在剧情里承担的是另一套系统目的。熟悉的外观不等于熟悉的核心。",
    reading: "你的同步反应稳定，但心理韧性和自我表达没有同等外放。结果落在 Adams之器线，因为你更像是在承载某种安排，而不是主动宣布自己。",
    tension: "你的适应性很强。但别人给出的定义容易占用太多你的空间。",
    shareLine: "测试把我分到九号机 Adams之器：像旧档案，但核心已经换了。",
    theme: THEMES.unit09,
  },
  DUAL13: {
    displayName: "EVA 十三号机",
    modelName: "EVANGELION-13",
    jpName: "エヴァンゲリオン第13号機",
    marker: "13",
    route: "双插入栓 / 双重驾驶",
    lore: "十三号机用双插入栓系统，和第四次冲击有关。它的重点不是强，而是两套意识被放进同一个结构里。",
    reading: "你的同步率和共情阈都很高。你容易同时理解两个方向，也容易在两套判断之间承担过多。",
    tension: "你能容纳复杂性。但复杂性最后容易都压到你一个人身上。",
    shareLine: "测试把我分到十三号机：两个判断同时在线。",
    theme: THEMES.unit13,
  },
  AWAKE13: {
    displayName: "EVA 十三号机觉醒",
    modelName: "EVANGELION-13 AWAKENED",
    jpName: "エヴァンゲリオン第13号機 覚醒",
    marker: "13",
    route: "觉醒态 / 冲击节点",
    lore: "事件日志将十三号机的觉醒和冲击事件绑在一起。它不是普通的作战升级，而是被设计成触发节点的机体。",
    reading: "你的同步率、心理韧性和存在敏感度都偏高。你会把问题追到结构本身，而不只是解决表面冲突。",
    tension: "你能看到根因。但在你解决根因之前，周围的人可能已经被卷进来了。",
    shareLine: "测试把我分到十三号机觉醒：不是升级，是触发。",
    theme: THEMES.unit13,
  },
  FUS82: {
    displayName: "EVA 8+2号机",
    modelName: "EVANGELION-08+02 FUSION",
    jpName: "エヴァンゲリオン改8号機＋弐号機",
    marker: "8+2",
    route: "合体方案 / 双系统作战",
    lore: "8+2 号机来自八号机和贰号机的合体构想。它的视觉重点就是不对称——远程支援和近战输出被塞进同一套系统。",
    reading: "你的结果同时出现强行动和强判断。它不追求统一人格，而是让两种作战逻辑并行：一边观察，一边推进。",
    tension: "你可以随时切换。但切换太快，别人跟不上你的节奏。",
    shareLine: "测试把我分到 8+2号机：一半瞄准，一半冲锋。",
    theme: THEMES.unit82,
  },
  ASYM82: {
    displayName: "EVA 8+2号机非对称配置",
    modelName: "EVANGELION-08+02 ASYMMETRIC CONFIG",
    jpName: "エヴァンゲリオン改8号機＋弐号機 非対称装備",
    marker: "8+2",
    route: "非对称配置 / 混合作战",
    lore: "8+2 号机的重点不是融合成一种风格，而是承认两边系统都存在。红与粉、近战与远程，本来就不需要完全调和。",
    reading: "你的决断力、情绪开放度和责任感同时靠前。你的优势来自混合结构，而不是均衡。",
    tension: "你的覆盖面很大。但没人能简单概括你，于是你也懒得解释。",
    shareLine: "测试把我分到 8+2号机非对称配置：不均衡，但有效。",
    theme: THEMES.unit82,
  },
  CMPL: {
    displayName: "人类补完计划",
    modelName: "HUMAN INSTRUMENTALITY PROJECT",
    jpName: "人類補完計画",
    marker: "LCL",
    route: "特殊结果 / AT 力场溶解",
    lore: "这份特殊档案不在任何单一机体分类下。补完计划是 EVA 世界观里关于个体边界的终极设定，把孤独、误解和自我边界放进了同一个问题。",
    reading: "你触发了补完线，说明测试读到的是高共情阈加上低边界的组合。你更在意隔阂能不能消除，而不是每个人都保持完整距离。",
    tension: "你能靠近别人。但靠近到最后，自己的轮廓会变得不清楚。",
    shareLine: "测试把我分到人类补完计划：边界感很低，理解欲很高。",
    theme: THEMES.special,
  },
  U13G: {
    displayName: "EVA 十三号机觉醒",
    modelName: "EVANGELION-13 GOD STATE",
    jpName: "エヴァンゲリオン第13号機 覚醒",
    marker: "13",
    route: "特殊结果 / 冲击触发",
    lore: "系统将十三号机觉醒线和双插入栓、使徒、冲击事件归入同一组异常档案。它代表的不是更强的驾驶，而是系统被推进到无法回退的阶段。",
    reading: "这个特殊结果来自高同步和高存在敏感度。测试读到的不是普通的好奇心，而是你会把问题一直追到边界之外。",
    tension: "你能推动变化。但变化一旦启动，很难只影响你自己。",
    shareLine: "测试把我分到十三号机觉醒：系统已经过阈值。",
    theme: THEMES.unit13,
  },
  ADAM: {
    displayName: "第一使徒 Adam",
    modelName: "FIRST ANGEL / OUT-OF-UNIT RESULT",
    jpName: "第一使徒 アダム",
    marker: "A",
    route: "特殊结果 / 非机体适格",
    lore: "Adam 不在常规机体谱系内。这份非机体分类报告表示数据无法稳定归入任何已知机体档案。",
    reading: "你的结果没有落在普通机体上，说明测试向量过于分散，或者距离所有模板都很远。它不是稀有夸奖，更像系统无法归档。",
    tension: "你很难被现成标签限制。但别人也很难快速理解你的运行方式。",
    shareLine: "测试把我分到第一使徒 Adam：系统没有找到合适机体。",
    theme: THEMES.special,
  },
  REI0: {
    displayName: "EVA 零号机共鸣",
    modelName: "EVANGELION-00 RESONANCE",
    jpName: "エヴァンゲリオン零号機 共鳴",
    marker: "00",
    route: "特殊结果 / 原型机共鸣",
    lore: "共鸣波形显示零号机共鸣线把原型机的容器感和绫波相关的存在主题放在一起。它不是战斗配置，而是核心反应。",
    reading: "这个结果来自低外放、高责任感和对被需要的反应。测试读到的是一种安静的连接需求，而不是强烈的占有欲。",
    tension: "你能长期保持温和的稳定。但太容易把被需要当成存在证明。",
    shareLine: "测试把我分到零号机共鸣：安静地连接，安静地承担。",
    theme: THEMES.unit00,
  },
};

const DEFAULT_PROFILE: ResultProfile = {
  displayName: "EVA 未确认机体",
  modelName: "UNCLASSIFIED EVANGELION RECORD",
  jpName: "未確認エヴァンゲリオン",
  marker: "?",
  route: "未分类",
  lore: "当前结果不在本地机体档案中。系统会保留匹配率和维度记录，但不强行套入常规机体。",
  reading: "这通常表示数据版本和展示档案不一致，或者结果来自新增机体。",
  tension: "优势和风险需要根据详细维度重新判读。",
  shareLine: "测试给了我一个未确认机体结果。",
  theme: THEMES.special,
};

const FALLBACK_PROFILE_BY_UNIT: Record<string, string> = {
  unit00: "VOID00",
  unit01: "SYNC01",
  unit02: "COM02",
  unit03: "GRD03",
  unit04: "VAN04",
  unit05: "BEAST5",
  mark06: "DESC06",
  unit08: "SNIP08",
  unit09: "CLONE09",
  unit13: "DUAL13",
  unit82: "FUS82",
};

function getUnitKey(match: MatchResult): string {
  const raw = `${match.evaUnit ?? ""} ${match.name} ${match.code}`.toLowerCase();
  if (match.code === "ADAM" || match.code === "CMPL") return "special";
  if (raw.includes("8+2") || raw.includes("08+02")) return "unit82";
  if (raw.includes("十三") || raw.includes("13")) return "unit13";
  if (raw.includes("mark.06") || raw.includes("mark06") || raw.includes("06")) return "mark06";
  if (raw.includes("九号") || raw.includes("09")) return "unit09";
  if (raw.includes("八号") || raw.includes("08")) return "unit08";
  if (raw.includes("五号") || raw.includes("05")) return "unit05";
  if (raw.includes("四号") || raw.includes("04")) return "unit04";
  if (raw.includes("参号") || raw.includes("三号") || raw.includes("03")) return "unit03";
  if (raw.includes("贰号") || raw.includes("二号") || raw.includes("02")) return "unit02";
  if (raw.includes("初号") || raw.includes("01")) return "unit01";
  if (raw.includes("零号") || raw.includes("00")) return "unit00";
  return "special";
}

function inferDisplayName(match: MatchResult, unitKey: string, baseName: string): string {
  const name = match.name.replace(/[型系]/g, "");

  if (unitKey === "unit01") {
    if (/暴走|bers/i.test(name) || match.code === "BERS") return "EVA 初号机暴走";
    if (/觉醒|醒|reso/i.test(name) || match.code === "RESO") return "EVA 初号机觉醒";
    if (/进化|evo/i.test(name) || match.code === "EVOU") return "EVA 初号机 进化态";
    return "EVA 初号机";
  }

  if (unitKey === "unit02") {
    if (/反击|rebu/i.test(name) || match.code === "REBU") return "EVA 贰号机反击配置";
    if (/怒火|烈焰|fury/i.test(name) || match.code === "FURY") return "EVA 贰号机 火力型";
    return "EVA 贰号机";
  }

  if (unitKey === "unit00") {
    if (/人偶|doll/i.test(name) || match.code === "DOLL") return "EVA 零号机 人偶";
    if (/微笑|绫波|rei|smi/i.test(name) || match.code === "SMIY" || match.code === "REII") return "EVA 零号机共鸣";
    if (/虚无|void/i.test(name) || match.code === "VOID") return "EVA 零号机 虚無";
    return "EVA 零号机";
  }

  if (unitKey === "unit03") {
    if (/献身|牺牲|sacr/i.test(name) || match.code === "SACR") return "EVA 参号机 侵蚀态";
    if (/守护|gard/i.test(name) || match.code === "GARD") return "EVA 参号机守护配置";
    if (/领袖|lead/i.test(name) || match.code === "LEAD") return "EVA 参号机 指挥型";
    return "EVA 参号机";
  }

  if (unitKey === "mark06") {
    if (/天使|使徒|angl/i.test(name) || match.code === "ANGL") return "EVA Mark.06 使徒侧";
    if (/宿命|fate/i.test(name) || match.code === "FATE") return "EVA Mark.06 月面型";
    if (/自由|free/i.test(name) || match.code === "FREE") return "EVA Mark.06 自由型";
    return "EVA Mark.06";
  }

  if (match.evaUnit && match.evaUnit !== "综合评定") return match.evaUnit;
  if (match.code === "BALA") return "MAGI 平衡型";
  if (match.code === "ADPT") return "MAGI 适应型";
  if (match.code === "FLUX") return "MAGI 流变型";
  if (match.code === "WATC") return "MAGI 观察型";
  return baseName;
}

function inferRoute(match: MatchResult, displayName: string, baseRoute: string): string {
  if (displayName.includes("MAGI")) return "综合评定 / 未指定机体";
  if (displayName.includes("暴走")) return "暴走状态 / 临界同步";
  if (displayName.includes("觉醒")) return "觉醒态 / 高同步阈值";
  if (displayName.includes("反击")) return "反击配置 / 实战适格";
  if (displayName.includes("火力")) return "火力型 / 高压推进";
  if (displayName.includes("人偶")) return "人偶 / 原型机谱系";
  if (displayName.includes("虚無")) return "虚無 / 低表征适格";
  if (displayName.includes("侵蚀")) return "侵蚀态 / 高责任阈值";
  if (displayName.includes("守护")) return "守护配置 / 防御适格";
  if (displayName.includes("指挥")) return "指挥型 / 战场判断";
  if (displayName.includes("使徒侧")) return "使徒侧 / 高共情阈";
  return baseRoute;
}

function getProfile(match: MatchResult): ResultProfile {
  const exact = PROFILES[match.code];
  if (exact) return exact;

  const unitKey = getUnitKey(match);
  const base = PROFILES[FALLBACK_PROFILE_BY_UNIT[unitKey]] ?? DEFAULT_PROFILE;
  const displayName = inferDisplayName(match, unitKey, base.displayName);

  return {
    ...base,
    displayName,
    route: inferRoute(match, displayName, base.route),
    shareLine: `测试把我分到${displayName}：${displayName.includes("MAGI") ? "系统没有指定单一机体。" : "机体适格记录已生成。"}`,
  };
}

function parseFormationCode(code?: string): FormationSignature | null {
  if (!code) return null;
  const [marker, typeCode, ...dimensions] = code
    .trim()
    .toUpperCase()
    .split("-")
    .filter(Boolean);

  if (!marker || !typeCode) return null;

  const dimensionCodes = dimensions
    .map((dimension) => dimension.match(/^([A-E][1-3])[LMHX]?$/)?.[1])
    .filter((dimension): dimension is string => Boolean(dimension));

  return { marker, typeCode, dimensionCodes };
}

function formatDimensionNote(sharedDimensionCodes: string[]) {
  if (sharedDimensionCodes.length === 0) return "高位指标没有重叠，差异会比较明显";
  const labels = sharedDimensionCodes
    .map((code) => `${code}${DIMENSION_NAMES.get(code) ? ` ${DIMENSION_NAMES.get(code)}` : ""}`)
    .join(" / ");
  return `共同高位：${labels}`;
}

function getRelayRelation(currentCode: string, upstreamCode?: string): RelayRelation | null {
  const current = parseFormationCode(currentCode);
  const upstream = parseFormationCode(upstreamCode);
  if (!current || !upstream) return null;

  const sharedDimensionCodes = current.dimensionCodes.filter((code) => upstream.dimensionCodes.includes(code));
  const upstreamLabel = `${upstream.marker}-${upstream.typeCode}`;
  const currentLabel = `${current.marker}-${current.typeCode}`;
  const dimensionNote = formatDimensionNote(sharedDimensionCodes);

  if (current.typeCode === upstream.typeCode) {
    return {
      label: "同档回声",
      description: "结果代码一致，主反应模式很接近；差异重点看高位指标。",
      dimensionNote,
      upstreamLabel,
      currentLabel,
      sharedDimensionCodes,
    };
  }

  if (current.marker === upstream.marker) {
    return {
      label: "同机分支",
      description: "机体编号相同，但结果代码不同；适合比较同一条机体线的两种用法。",
      dimensionNote,
      upstreamLabel,
      currentLabel,
      sharedDimensionCodes,
    };
  }

  if (sharedDimensionCodes.length >= 2) {
    return {
      label: "同轴支援",
      description: "高位指标重叠较多，比较像能互相接住节奏的支援位。",
      dimensionNote,
      upstreamLabel,
      currentLabel,
      sharedDimensionCodes,
    };
  }

  if (sharedDimensionCodes.length === 1) {
    return {
      label: "单点交集",
      description: "你们能对上一个关键点，但处理方式会明显分开。",
      dimensionNote,
      upstreamLabel,
      currentLabel,
      sharedDimensionCodes,
    };
  }

  return {
    label: "反差编队",
    description: "高位指标几乎不重叠，适合看谁补上对方的盲区。",
    dimensionNote,
    upstreamLabel,
    currentLabel,
    sharedDimensionCodes,
  };
}

export default function ResultScreen({
  result,
  onRestart,
  dimScores,
  userGrades,
  relaySourceCode,
  relaySourceUnit,
  relayRootCode,
  relayDepth,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedInviteKey, setCopiedInviteKey] = useState<RelayInviteKey | null>(null);
  const [returnCopied, setReturnCopied] = useState(false);
  const [inviteNameInput, setInviteNameInput] = useState("");
  const [relayBranchCount, setRelayBranchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const successfulInviteKeysRef = useRef<Set<RelayInviteKey>>(new Set());
  const trackedRelayBranchReadyRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (containerRef.current) {
        await containerRef.current.requestFullscreen();
      }
    } catch {}
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const top = result.top;
  const profile = getProfile(top);
  const topDimensions = useMemo(() => {
    return rankTopDimensions(userGrades, dimScores, 4);
  }, [dimScores, userGrades]);
  const topDimensionLabels = getFormationDimensionLabels(topDimensions, GRADE_LABELS);
  const primaryDimension = topDimensions[0];
  const invitePrompt = primaryDimension
    ? DIMENSION_CHAIN_PROMPTS[primaryDimension.index]
    : "让一个和你差异很大的人测一次，结果最容易拉开。";
  const formationCode = buildFormationCodeFromDimensions(profile.marker, top.code, topDimensions);
  const effectiveRelayRootCode = relayRootCode ?? relaySourceCode;
  const currentRelayDepth = normalizeRelayDepth(relayDepth);
  const relayNodeLabel = currentRelayDepth.toString().padStart(2, "0");
  const upstreamLabel = relaySourceCode ?? "DIRECT";
  const upstreamUnitLabel = relaySourceUnit ?? "上一站机体未记录";
  const relayPrompt = relaySourceCode
    ? "继续转给一个和你风格不同的人，让下一站接在你的编队后面。"
    : "发给一个和你风格不同的人，让 TA 接出下一站。";
  const relayLine = relaySourceCode
    ? `我接入了 ${relaySourceUnit ? `${relaySourceUnit} / ` : ""}${relaySourceCode} 的编队，现在作为第 ${currentRelayDepth} 站回传。`
    : "";
  const relayRelation = getRelayRelation(formationCode, relaySourceCode);
  const resultShareId = useMemo(() => createShareId("result"), []);
  const returnShareId = useMemo(() => createShareId("return"), []);
  const shareUrl = buildShareUrl(formationCode, relaySourceCode, effectiveRelayRootCode, currentRelayDepth, {
    shareId: resultShareId,
    shareUnit: profile.displayName,
    relayRelation: relayRelation?.label,
  });
  const primaryDimensionCode = primaryDimension ? DIMENSIONS[primaryDimension.index].code : "CORE";
  const primaryDimensionName = primaryDimension ? DIMENSIONS[primaryDimension.index].name : "核心指标";
  const inviteName = cleanInviteName(inviteNameInput);
  const hasNamedInvite = inviteName.length > 0;
  const inviteAddress = hasNamedInvite ? `${inviteName}，` : "";
  const inviteSubject = hasNamedInvite ? inviteName : "TA";
  const inviteShareIds = useMemo(() => ({
    general: createShareId(hasNamedInvite ? "invite_general_named" : "invite_general"),
    contrast: createShareId(hasNamedInvite ? "invite_contrast_named" : "invite_contrast"),
    same_axis: createShareId(hasNamedInvite ? "invite_same_axis_named" : "invite_same_axis"),
    verify: createShareId(hasNamedInvite ? "invite_verify_named" : "invite_verify"),
  } satisfies Record<RelayInviteKey, string>), [hasNamedInvite]);
  const buildInviteShareUrl = (inviteTarget: RelayInviteKey, inviteLabel: string, shareId: string) =>
    buildShareUrl(formationCode, relaySourceCode, effectiveRelayRootCode, currentRelayDepth, {
      shareId,
      shareUnit: profile.displayName,
      inviteTarget,
      inviteLabel,
      relayRelation: relayRelation?.label,
      inviteNamed: hasNamedInvite,
    });
  const generalInviteUrl = buildInviteShareUrl("general", "下一站", inviteShareIds.general);
  const contrastInviteUrl = buildInviteShareUrl("contrast", "反差位", inviteShareIds.contrast);
  const sameAxisInviteUrl = buildInviteShareUrl("same_axis", "同轴位", inviteShareIds.same_axis);
  const verifyInviteUrl = buildInviteShareUrl("verify", "校验位", inviteShareIds.verify);
  const returnUrl = buildShareUrl(formationCode, relaySourceCode, effectiveRelayRootCode, currentRelayDepth, {
    shareId: returnShareId,
    shareUnit: profile.displayName,
    inviteTarget: "general",
    inviteLabel: "回传下一站",
    relayRelation: relayRelation?.label,
  });
  const shareText = [
    `我测到：${profile.displayName}`,
    profile.shareLine,
    relayLine,
    `编队码：${formationCode}`,
    `接力站位：第 ${currentRelayDepth} 站`,
    relayRelation ? `编队关系：${relayRelation.label}，${relayRelation.dimensionNote}。` : "",
    topDimensionLabels ? `高位指标：${topDimensionLabels}` : "",
    invitePrompt,
    relayPrompt,
    shareUrl,
  ].filter(Boolean).join("\n");
  const relayInviteOptions: RelayInviteOption[] = [
    {
      key: "general",
      shareId: inviteShareIds.general,
      label: "GENERAL",
      title: "下一站",
      target: "发给一个你想对照的人。",
      reason: "测完把机体和编队码发回来，就能接上这条编队。",
      url: generalInviteUrl,
      nativeText: [
        `我这站是 ${profile.displayName} / NODE ${relayNodeLabel}。`,
        `${inviteAddress}你测完把机体和编队码发我，看看你会接到哪一站。`,
      ].join("\n"),
      message: [
        `我这站是 ${profile.displayName} / NODE ${relayNodeLabel}。`,
        `${inviteAddress}你测完把机体和编队码发我，看看你会接到哪一站：`,
        generalInviteUrl,
      ].join("\n"),
    },
    {
      key: "contrast",
      shareId: inviteShareIds.contrast,
      label: "CONTRAST",
      title: "反差位",
      target: "找一个做事节奏和你明显不同的人。",
      reason: "反差越清楚，机体编号和高位指标越容易聊起来。",
      url: contrastInviteUrl,
      nativeText: [
        `我这站是 ${profile.displayName} / NODE ${relayNodeLabel}。`,
        `想找 ${inviteSubject} 接反差位：你测完把机体和编队码发我。`,
        "看我们是同轴、分支，还是完全反差。",
      ].join("\n"),
      message: [
        `我这站是 ${profile.displayName} / NODE ${relayNodeLabel}。`,
        `想找 ${inviteSubject} 接反差位：你测完把机体和编队码发我。`,
        "看我们是同轴、分支，还是完全反差：",
        contrastInviteUrl,
      ].join("\n"),
    },
    {
      key: "same_axis",
      shareId: inviteShareIds.same_axis,
      label: "SAME AXIS",
      title: "同轴位",
      target: `找一个在「${primaryDimensionName}」上可能和你很像的人。`,
      reason: `同一个 ${primaryDimensionCode} 指标，可能会落到完全不同的机体。`,
      url: sameAxisInviteUrl,
      nativeText: [
        `我这站是 ${profile.displayName}，高位指标里有 ${primaryDimensionCode}「${primaryDimensionName}」。`,
        `${inviteAddress}你可能和我有同一个轴，测完把机体和编队码发我对一下。`,
      ].join("\n"),
      message: [
        `我这站是 ${profile.displayName}，高位指标里有 ${primaryDimensionCode}「${primaryDimensionName}」。`,
        `${inviteAddress}你可能和我有同一个轴，测完把机体和编队码发我对一下：`,
        sameAxisInviteUrl,
      ].join("\n"),
    },
    {
      key: "verify",
      shareId: inviteShareIds.verify,
      label: "VERIFY",
      title: "校验位",
      target: "找一个很了解你的人。",
      reason: "让熟人也测一次，最容易出现互相校验和反驳。",
      url: verifyInviteUrl,
      nativeText: [
        `我测到 ${profile.displayName}，编队码是 ${formationCode}。`,
        `${inviteAddress}你比较了解我，测一次看看你会站到哪台机体；测完把结果发我校验一下。`,
      ].join("\n"),
      message: [
        `我测到 ${profile.displayName}，编队码是 ${formationCode}。`,
        `${inviteAddress}你比较了解我，测一次看看你会站到哪台机体；测完把结果发我校验一下：`,
        verifyInviteUrl,
      ].join("\n"),
    },
  ];
  const generalInvite = relayInviteOptions[0];
  const returnText = relayRelation
    ? [
      `我接完你的 EVA 编队了：${relaySourceCode} -> ${formationCode}`,
      relaySourceUnit ? `上一站：${relaySourceUnit}` : "",
      `我的结果：${profile.displayName} / NODE ${relayNodeLabel}`,
      `编队关系：${relayRelation.label}。${relayRelation.dimensionNote}。`,
      relayRelation.description,
      "你可以再找一个和我们都不太一样的人接下一站。",
      returnUrl,
    ].filter(Boolean).join("\n")
    : "";

  const themeStyle = {
    "--unit-bg": profile.theme.bg,
    "--unit-panel": profile.theme.panel,
    "--unit-primary": profile.theme.primary,
    "--unit-secondary": profile.theme.secondary,
    "--unit-accent": profile.theme.accent,
    "--unit-muted": profile.theme.muted,
    "--unit-glow": profile.theme.glow,
  } as CSSProperties;

  const copyResult = async (channel: "copy" | "fallback" = "copy") => {
    trackEvent("share_click", {
      channel,
      shareId: resultShareId,
      code: top.code,
      unit: profile.displayName,
      shareUnit: profile.displayName,
      formationCode,
      relayFrom: relaySourceCode,
      sourceShareUnit: relaySourceUnit,
      relayRoot: effectiveRelayRootCode,
      relayDepth: currentRelayDepth,
      relayRelation: relayRelation?.label,
    });

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      trackEvent("share_success", {
        channel,
        shareId: resultShareId,
        code: top.code,
        unit: profile.displayName,
        shareUnit: profile.displayName,
        formationCode,
        relayFrom: relaySourceCode,
        sourceShareUnit: relaySourceUnit,
        relayRoot: effectiveRelayRootCode,
        relayDepth: currentRelayDepth,
        relayRelation: relayRelation?.label,
      });
    } catch {
      setCopied(false);
    }
  };

  const shareResult = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        trackEvent("share_click", {
          channel: "native",
          shareId: resultShareId,
          code: top.code,
          unit: profile.displayName,
          shareUnit: profile.displayName,
          formationCode,
          relayFrom: relaySourceCode,
          sourceShareUnit: relaySourceUnit,
          relayRoot: effectiveRelayRootCode,
          relayDepth: currentRelayDepth,
          relayRelation: relayRelation?.label,
        });
        await navigator.share({
          title: "EVA 适格机体测试",
          text: shareText,
          url: shareUrl || undefined,
        });
        trackEvent("share_success", {
          channel: "native",
          shareId: resultShareId,
          code: top.code,
          unit: profile.displayName,
          shareUnit: profile.displayName,
          formationCode,
          relayFrom: relaySourceCode,
          sourceShareUnit: relaySourceUnit,
          relayRoot: effectiveRelayRootCode,
          relayDepth: currentRelayDepth,
          relayRelation: relayRelation?.label,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyResult("fallback");
  };

  const trackInviteShare = (
    event: "share_click" | "share_success",
    invite: RelayInviteOption,
    channel: InviteShareChannel
  ) => {
    trackEvent(event, {
      channel,
      shareId: invite.shareId,
      code: top.code,
      unit: profile.displayName,
      shareUnit: profile.displayName,
      formationCode,
      relayFrom: relaySourceCode,
      sourceShareUnit: relaySourceUnit,
      relayRoot: effectiveRelayRootCode,
      relayDepth: currentRelayDepth,
      relayRelation: relayRelation?.label,
      inviteTarget: invite.key,
      inviteLabel: invite.title,
      inviteNamed: hasNamedInvite,
    });
  };

  const markInviteSuccess = (invite: RelayInviteOption) => {
    const nextInviteKeys = new Set(successfulInviteKeysRef.current);
    nextInviteKeys.add(invite.key);
    successfulInviteKeysRef.current = nextInviteKeys;
    setRelayBranchCount(Math.min(nextInviteKeys.size, 2));

    if (nextInviteKeys.size >= 2 && !trackedRelayBranchReadyRef.current) {
      trackedRelayBranchReadyRef.current = true;
      trackEvent("relay_branch_ready", {
        code: top.code,
        unit: profile.displayName,
        shareUnit: profile.displayName,
        formationCode,
        relayFrom: relaySourceCode,
        sourceShareUnit: relaySourceUnit,
        relayRoot: effectiveRelayRootCode,
        relayDepth: currentRelayDepth,
        relayRelation: relayRelation?.label,
        inviteNamed: hasNamedInvite,
        inviteTargets: Array.from(nextInviteKeys).join(","),
        shareIds: Array.from(nextInviteKeys).map((key) => inviteShareIds[key]).join(","),
      });
    }
  };

  const getInviteShareChannel = (
    invite: RelayInviteOption,
    transport: InviteShareTransport,
    placement: InviteSharePlacement = "detail"
  ) => {
    const invitePrefix = invite.key === "general" ? "invite" : "target_invite";
    const placementPrefix = placement === "quick" ? `quick_${invitePrefix}` : invitePrefix;
    return `${placementPrefix}_${transport}` as InviteShareChannel;
  };

  const copyInvite = async (
    invite: RelayInviteOption = generalInvite,
    channel: InviteShareChannel = getInviteShareChannel(invite, "copy"),
    trackClick = true
  ) => {
    if (trackClick) {
      trackInviteShare("share_click", invite, channel);
    }

    try {
      await navigator.clipboard.writeText(invite.message);
      setCopiedInviteKey(invite.key);
      window.setTimeout(() => setCopiedInviteKey(null), 1600);
      trackInviteShare("share_success", invite, channel);
      markInviteSuccess(invite);
    } catch {
      setCopiedInviteKey(null);
    }
  };

  const shareInvite = async (invite: RelayInviteOption = generalInvite, placement: InviteSharePlacement = "detail") => {
    const nativeChannel = getInviteShareChannel(invite, "native", placement);
    const fallbackChannel = getInviteShareChannel(invite, "fallback", placement);

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        trackInviteShare("share_click", invite, nativeChannel);
        await navigator.share({
          title: `EVA 编队接力：${invite.title}`,
          text: invite.nativeText,
          url: invite.url || undefined,
        });
        setCopiedInviteKey(invite.key);
        window.setTimeout(() => setCopiedInviteKey(null), 1600);
        trackInviteShare("share_success", invite, nativeChannel);
        markInviteSuccess(invite);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyInvite(invite, fallbackChannel);
  };

  const trackReturnShare = (event: "share_click" | "share_success", channel: "return_copy" | "return_native" | "return_fallback") => {
    if (!relayRelation) return;

    trackEvent(event, {
      channel,
      shareId: returnShareId,
      code: top.code,
      unit: profile.displayName,
      shareUnit: profile.displayName,
      formationCode,
      relayFrom: relaySourceCode,
      sourceShareUnit: relaySourceUnit,
      relayRoot: effectiveRelayRootCode,
      relayDepth: currentRelayDepth,
      relayRelation: relayRelation.label,
      inviteTarget: generalInvite.key,
      inviteLabel: "回传下一站",
    });
  };

  const copyReturn = async (channel: "return_copy" | "return_fallback" = "return_copy", trackClick = true) => {
    if (!returnText || !relayRelation) return;

    if (trackClick) trackReturnShare("share_click", channel);

    try {
      await navigator.clipboard.writeText(returnText);
      setReturnCopied(true);
      window.setTimeout(() => setReturnCopied(false), 1600);
      trackReturnShare("share_success", channel);
    } catch {
      setReturnCopied(false);
    }
  };

  const shareReturn = async () => {
    if (!returnText || !relayRelation) return;

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        trackReturnShare("share_click", "return_native");
        await navigator.share({
          title: "EVA 编队回传",
          text: returnText,
          url: returnUrl || undefined,
        });
        setReturnCopied(true);
        window.setTimeout(() => setReturnCopied(false), 1600);
        trackReturnShare("share_success", "return_native");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyReturn("return_fallback");
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar"
      style={{
        ...themeStyle,
        background:
          "radial-gradient(circle at 80% 0%, var(--unit-glow), transparent 34%), linear-gradient(180deg, var(--unit-bg), #050505 72%)",
      }}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
        <span className="text-[0.68rem] text-[#777] tracking-[0.18em]" style={{ fontFamily: "var(--font-tech)" }}>
          RESULT FILE
        </span>
        <span className="text-[0.72rem] tracking-[0.14em]" style={{ color: "var(--unit-secondary)", fontFamily: "var(--font-tech)" }}>
          SYNC {top.similarity.toFixed(1)}%
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="text-[#777] transition-colors hover:text-white"
            aria-label={isFullscreen ? "退出全屏" : "全屏"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <span className="text-[0.68rem] text-[#777] tracking-[0.18em]" style={{ fontFamily: "var(--font-tech)" }}>
            {top.isSpecial ? "SPECIAL" : top.isBoundary ? "BOUNDARY" : "MATCH"}
          </span>
        </div>
      </div>

      <motion.section
        className="relative min-h-[360px] sm:min-h-[260px] px-5 pt-6 pb-7 overflow-hidden border-b border-white/10"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div
          className="absolute right-[-14px] top-[-18px] select-none text-[8rem] leading-none font-black opacity-[0.13]"
          style={{ color: "var(--unit-primary)", fontFamily: "var(--font-num)" }}
          aria-hidden="true"
        >
          {profile.marker}
        </div>
        <div
          className="absolute inset-x-5 bottom-0 h-px"
          style={{ background: "linear-gradient(90deg, var(--unit-primary), transparent)" }}
        />

        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_112px] gap-5 sm:gap-4 mb-5 sm:items-start">
            <div className="min-w-0 order-2 sm:order-1">
              <p className="text-[0.68rem] tracking-[0.22em] mb-2" style={{ color: "var(--unit-muted)", fontFamily: "var(--font-tech)" }}>
                {profile.route}
              </p>
              <h1
                className="text-[2.05rem] min-[430px]:text-[2.35rem] sm:text-[2.55rem] md:text-[3rem] leading-[1.02] text-white break-words"
                style={{ fontFamily: "var(--font-title)", textShadow: "2px 2px 0 rgba(0,0,0,0.75)" }}
              >
                {profile.displayName}
              </h1>
            </div>
            <div
              className="order-1 sm:order-2 w-[128px] sm:w-[112px] aspect-square border relative overflow-hidden flex flex-col justify-center px-3"
              style={{
                borderColor: "var(--unit-primary)",
                background: "linear-gradient(135deg, var(--unit-panel), rgba(0,0,0,0.28))",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 28px var(--unit-glow)",
              }}
            >
              <span
                className="text-[0.56rem] tracking-[0.18em] text-[#777]"
                style={{ fontFamily: "var(--font-tech)" }}
              >
                EVA UNIT
              </span>
              <span
                className="text-[4.2rem] sm:text-[3.7rem] leading-[0.82] font-black"
                style={{ color: "var(--unit-secondary)", fontFamily: "var(--font-num)" }}
              >
                {profile.marker}
              </span>
              <span
                className="text-[0.56rem] tracking-[0.16em]"
                style={{ color: "var(--unit-muted)", fontFamily: "var(--font-tech)" }}
              >
                CLASSIFIED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:items-end">
            <div>
              <p className="text-[0.78rem] tracking-[0.12em] text-[#aaa]" style={{ fontFamily: "var(--font-tech)" }}>
                {profile.modelName}
              </p>
              <p className="mt-1 text-[0.76rem] text-[#777]" style={{ fontFamily: "var(--font-title)" }}>
                {profile.jpName}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-[0.62rem] tracking-[0.18em] text-[#777]" style={{ fontFamily: "var(--font-tech)" }}>
                MATCH RATE
              </p>
              <p className="text-[2.05rem] leading-none font-black" style={{ color: "var(--unit-secondary)", fontFamily: "var(--font-num)" }}>
                {top.similarity.toFixed(1)}
                <span className="text-[0.9rem] ml-1">%</span>
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="px-5 py-5 border-b border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-white/10 p-3" style={{ background: "rgba(0,0,0,0.2)" }}>
            <p className="text-[0.62rem] tracking-[0.18em] mb-3" style={{ color: "var(--unit-muted)", fontFamily: "var(--font-tech)" }}>
              ORIGIN
            </p>
            <p className="text-[0.9rem] leading-[1.75] text-[#d6d6d6]" style={{ fontFamily: "var(--font-title)" }}>
              {profile.lore}
            </p>
          </div>
          <div className="border border-white/10 p-3" style={{ background: "var(--unit-panel)" }}>
            <p className="text-[0.62rem] tracking-[0.18em] mb-3" style={{ color: "var(--unit-secondary)", fontFamily: "var(--font-tech)" }}>
              READING
            </p>
            <p className="text-[0.9rem] leading-[1.75] text-[#d6d6d6]" style={{ fontFamily: "var(--font-title)" }}>
              {profile.reading}
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="px-5 py-5 border-b border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[0.72rem] tracking-[0.2em]" style={{ color: "var(--unit-accent)", fontFamily: "var(--font-tech)" }}>
            CORE INDEX
          </h2>
          <span className="text-[0.66rem] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
            {top.code}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topDimensions.map((d, index) => (
            <div key={DIMENSIONS[d.index].code} className="border border-white/10 p-3" style={{ background: "rgba(0,0,0,0.22)" }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-[0.68rem] tracking-[0.16em]" style={{ color: "var(--unit-secondary)", fontFamily: "var(--font-tech)" }}>
                    {DIMENSIONS[d.index].code}
                  </p>
                  <p className="text-[0.78rem] text-[#cfcfcf]" style={{ fontFamily: "var(--font-title)" }}>
                    {DIMENSIONS[d.index].name}
                  </p>
                </div>
                <span className="text-[0.9rem] text-white font-bold">{GRADE_LABELS[d.grade]}</span>
              </div>
              <div className="h-[5px] bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${GRADE_WIDTH[d.grade]}%` }}
                  transition={{ delay: 0.28 + index * 0.08, duration: 0.45 }}
                  style={{ background: "linear-gradient(90deg, var(--unit-primary), var(--unit-secondary))" }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="px-5 py-5 border-b border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="border-l-[3px] pl-4" style={{ borderColor: "var(--unit-primary)" }}>
          <p className="text-[0.68rem] tracking-[0.18em] mb-2" style={{ color: "var(--unit-muted)", fontFamily: "var(--font-tech)" }}>
            SYNC NOTE
          </p>
          <p className="text-[1rem] leading-[1.8] text-[#ddd]" style={{ fontFamily: "var(--font-title)" }}>
            {profile.tension}
          </p>
        </div>
      </motion.section>

      <motion.section
        className="px-5 py-5 border-b border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <div
          className="border border-white/10 p-4"
          style={{
            background: "linear-gradient(135deg, var(--unit-panel), rgba(0,0,0,0.28))",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)",
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-[0.72rem] tracking-[0.2em]" style={{ color: "var(--unit-accent)", fontFamily: "var(--font-tech)" }}>
              FORMATION CODE
            </h2>
            <span className="text-[0.66rem] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
              COMPARE
            </span>
          </div>

          <div
            className="min-h-[48px] border border-white/10 px-3 py-2 flex items-center"
            style={{ background: "rgba(0,0,0,0.28)" }}
          >
            <p
              className="text-[1.05rem] min-[430px]:text-[1.18rem] leading-[1.25] break-all"
              style={{ color: "var(--unit-secondary)", fontFamily: "var(--font-tech)" }}
            >
              {formationCode}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-[78px_minmax(0,1fr)] gap-2">
            <div className="border border-white/10 px-3 py-2" style={{ background: "rgba(0,0,0,0.2)" }}>
              <p className="text-[0.55rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                YOUR NODE
              </p>
              <p className="mt-1 text-[1.35rem] leading-none" style={{ color: "var(--unit-secondary)", fontFamily: "var(--font-num)" }}>
                {relayNodeLabel}
              </p>
            </div>
            <div className="border border-white/10 px-3 py-2 min-w-0" style={{ background: "rgba(0,0,0,0.2)" }}>
              <p className="text-[0.55rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                UPSTREAM
              </p>
              <p
                className="mt-1 text-[0.72rem] leading-[1.35] break-all"
                style={{ color: "var(--unit-muted)", fontFamily: "var(--font-tech)" }}
              >
                {upstreamLabel}
              </p>
              {relaySourceUnit && (
                <p className="mt-1 text-[0.72rem] leading-[1.35] text-[#aaa] break-words" style={{ fontFamily: "var(--font-title)" }}>
                  {relaySourceUnit}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {relayRelation ? (
        <motion.section
          className="px-5 py-5 border-b border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div
            className="border border-white/10 p-4"
            style={{
              background: "rgba(0,0,0,0.22)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)",
            }}
          >
            <div className="flex flex-col gap-3 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between mb-4">
              <div>
                <h2 className="text-[0.72rem] tracking-[0.2em]" style={{ color: "var(--unit-accent)", fontFamily: "var(--font-tech)" }}>
                  UPSTREAM MATCH
                </h2>
                <p className="mt-1 text-[0.66rem] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                  RETURN LINK
                </p>
              </div>
              <button
                onClick={shareReturn}
                className="h-9 px-3 border border-white/15 text-[0.62rem] tracking-[0.14em] text-[#aaa] flex items-center justify-center gap-1.5 transition-colors hover:text-white hover:border-white/30"
                style={{ fontFamily: "var(--font-tech)" }}
              >
                <Share2 size={13} aria-hidden="true" />
                {returnCopied ? "READY" : "SEND RETURN"}
              </button>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] gap-2 items-center mb-4">
              <div className="min-w-0">
                <p className="text-[0.55rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                  UPSTREAM
                </p>
                <p className="mt-1 text-[0.78rem] leading-[1.35] break-all" style={{ color: "var(--unit-muted)", fontFamily: "var(--font-tech)" }}>
                  {relayRelation.upstreamLabel}
                </p>
                <p className="mt-1 text-[0.72rem] leading-[1.35] text-[#aaa] break-words" style={{ fontFamily: "var(--font-title)" }}>
                  {upstreamUnitLabel}
                </p>
              </div>
              <div
                className="h-px"
                style={{ background: "linear-gradient(90deg, transparent, var(--unit-primary), transparent)" }}
                aria-hidden="true"
              />
              <div className="min-w-0 text-right">
                <p className="text-[0.55rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                  YOUR NODE
                </p>
                <p className="mt-1 text-[0.78rem] leading-[1.35] break-all" style={{ color: "var(--unit-secondary)", fontFamily: "var(--font-tech)" }}>
                  {relayRelation.currentLabel}
                </p>
              </div>
            </div>

            <div className="border-l-[3px] pl-4" style={{ borderColor: "var(--unit-primary)" }}>
              <p className="text-[1.3rem] leading-none text-white" style={{ fontFamily: "var(--font-title)" }}>
                {relayRelation.label}
              </p>
              <p className="mt-3 text-[0.9rem] leading-[1.75] text-[#d6d6d6]" style={{ fontFamily: "var(--font-title)" }}>
                {relayRelation.description}
                <span className="block mt-1 text-[#aaa]">{relayRelation.dimensionNote}。</span>
              </p>
            </div>
          </div>
        </motion.section>
      ) : null}

      <motion.section
        className="px-5 py-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[0.72rem] tracking-[0.2em]" style={{ color: "var(--unit-accent)", fontFamily: "var(--font-tech)" }}>
            CANDIDATE UNITS
          </h2>
          <span className="text-[0.66rem] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
            TOP 3
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {result.top3.map((match, index) => {
            const candidate = getProfile(match);
            return (
              <div
                key={`${match.code}-${index}`}
                className="grid grid-cols-[36px_1fr_auto] gap-3 items-center border border-white/10 p-3"
                style={{
                  background: index === 0 ? "var(--unit-panel)" : "rgba(0,0,0,0.2)",
                  borderLeft: `3px solid ${index === 0 ? "var(--unit-primary)" : "rgba(255,255,255,0.18)"}`,
                }}
              >
                <span className="text-[0.8rem] font-bold" style={{ color: "var(--unit-secondary)", fontFamily: "var(--font-tech)" }}>
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[0.92rem] text-white" style={{ fontFamily: "var(--font-title)" }}>
                    {candidate.displayName}
                  </p>
                  <p className="truncate text-[0.62rem] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                    {candidate.modelName} / {match.code}
                  </p>
                </div>
                <span className="text-[0.86rem] font-bold" style={{ color: "var(--unit-secondary)" }}>
                  {match.similarity.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        className="px-5 pt-5 pb-8 border-t border-white/10"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
      >
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button
            onClick={shareResult}
            className="h-12 border text-[0.74rem] tracking-[0.14em] uppercase flex items-center justify-center gap-2 transition-colors"
            style={{ borderColor: "var(--unit-primary)", color: "var(--unit-secondary)", fontFamily: "var(--font-tech)" }}
          >
            <Share2 size={15} aria-hidden="true" />
            SHARE
          </button>
          <button
            onClick={() => copyResult("copy")}
            className="h-12 border border-white/15 text-[#aaa] text-[0.74rem] tracking-[0.14em] uppercase flex items-center justify-center gap-2 transition-colors hover:text-white hover:border-white/30"
            style={{ fontFamily: "var(--font-tech)" }}
          >
            <Copy size={15} aria-hidden="true" />
            {copied ? "COPIED" : "COPY"}
          </button>
          <button
            onClick={onRestart}
            className="h-12 border border-white/15 text-[#888] text-[0.74rem] tracking-[0.14em] uppercase flex items-center justify-center gap-2 transition-colors hover:text-white hover:border-white/30"
            style={{ fontFamily: "var(--font-tech)" }}
          >
            <RotateCcw size={15} aria-hidden="true" />
            RETEST
          </button>
        </div>

        <div
          className="border border-white/10 p-4"
          style={{
            background: "linear-gradient(135deg, var(--unit-panel), rgba(0,0,0,0.28))",
          }}
        >
          <div className="mb-3">
            <h2 className="text-[0.72rem] tracking-[0.2em]" style={{ color: "var(--unit-accent)", fontFamily: "var(--font-tech)" }}>
              NEXT RELAY
            </h2>
            <p className="mt-2 text-[0.9rem] leading-[1.75] text-[#d6d6d6]" style={{ fontFamily: "var(--font-title)" }}>
              {invitePrompt}
              <span className="block mt-1 text-[#aaa]">{relayPrompt}</span>
            </p>
          </div>

          <label className="mb-3 block border border-white/10 px-3 py-2" style={{ background: "rgba(0,0,0,0.18)" }}>
            <span className="block text-[0.54rem] tracking-[0.16em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
              DIRECT CALL
            </span>
            <input
              value={inviteNameInput}
              onChange={(event) => setInviteNameInput(event.target.value.slice(0, 12))}
              maxLength={12}
              placeholder="填一个称呼，分享会更像点名"
              className="mt-2 h-9 w-full border border-white/10 bg-black/30 px-3 text-[0.85rem] text-[#e5e5e5] outline-none transition-colors placeholder:text-[#555] focus:border-white/30"
              style={{ fontFamily: "var(--font-title)" }}
            />
            <span className="block mt-1 text-[0.68rem] text-[#666]">
              {hasNamedInvite ? "已切换为点名接力。" : "不填也可以直接发送。"}
            </span>
          </label>

          <div className="grid grid-cols-2 min-[430px]:grid-cols-4 gap-2">
            {relayInviteOptions.map((invite) => (
              <button
                key={invite.key}
                onClick={() => shareInvite(invite)}
                className="min-h-[56px] border border-white/10 px-2 py-2 text-left transition-colors hover:border-white/30 flex flex-col justify-between"
                style={{ background: "rgba(0,0,0,0.2)" }}
              >
                <span className="text-[0.56rem] tracking-[0.14em] text-[#666]" style={{ fontFamily: "var(--font-tech)" }}>
                  {invite.label}
                </span>
                <span className="mt-1 text-[0.88rem] leading-tight text-[#e5e5e5]" style={{ fontFamily: "var(--font-title)" }}>
                  {copiedInviteKey === invite.key ? "READY" : invite.title}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[0.72rem] leading-[1.55] text-[#888]" style={{ fontFamily: "var(--font-title)" }}>
              {relayBranchCount >= 2
                ? "两条邀请已发出，编队开始分支。"
                : "建议发给两个不同位置的人，让编队分出去。"}
            </span>
            <span className="text-[0.72rem]" style={{ color: "var(--unit-secondary)", fontFamily: "var(--font-tech)" }}>
              {relayBranchCount}/2
            </span>
          </div>
        </div>

        {relayRelation ? (
          <button
            onClick={shareReturn}
            className="mt-3 w-full h-10 border border-white/15 text-[0.62rem] tracking-[0.14em] text-[#aaa] flex items-center justify-center gap-1.5 transition-colors hover:text-white hover:border-white/30"
            style={{ fontFamily: "var(--font-tech)" }}
          >
            <Share2 size={13} aria-hidden="true" />
            {returnCopied ? "READY" : "SEND RETURN TO UPSTREAM"}
          </button>
        ) : null}
      </motion.section>
    </div>
  );
}
