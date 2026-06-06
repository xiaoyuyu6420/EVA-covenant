"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { Copy, RotateCcw, Share2 } from "lucide-react";
import type { FullResult, Grade, MatchResult } from "@/lib/types";
import { DIMENSIONS } from "@/lib/types";
import { buildShareUrl, trackEvent } from "@/lib/analytics";

interface Props {
  result: FullResult;
  onRestart: () => void;
  dimScores: number[];
  userGrades: Grade[] | null;
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

const GRADE_LABELS: Record<Grade, string> = { L: "低", M: "中", H: "高", X: "极高" };
const GRADE_WIDTH: Record<Grade, number> = { L: 28, M: 52, H: 76, X: 100 };
const GRADE_VALUE: Record<Grade, number> = { L: 0, M: 1, H: 2, X: 3 };
const DIMENSION_CHAIN_PROMPTS = [
  "同步感很强的人，测完通常会有完全不同的机体解释。",
  "压力越大越冷静的人，结果很容易和你形成反差。",
  "边界感很明显的人，适合拿来对照 AT 力场。",
  "遇事先推进的人，能看出你们谁更像前锋。",
  "先看方案和数据的人，适合对照作战风格。",
  "关键时刻会拍板的人，结果通常很有辨识度。",
  "能听出别人没说出口的人，适合对照共鸣侧。",
  "一个人也能待很久的人，孤独倾向会拉开差距。",
  "情绪表达很直接的人，能测出完全不同的外显方式。",
  "习惯把责任扛起来的人，适合看谁会先上机。",
  "很在意自我边界的人，适合对照适格样本感。",
  "总会追问意义的人，容易测到高存在追问。",
  "习惯自己解决问题的人，适合看独立性差异。",
  "不轻易相信系统的人，适合对照 NERV 信任度。",
  "场面一乱就会接管的人，适合看谁更像指挥位。",
];

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
    lore: "初号机在原作中不是稳定的武器平台。它经常和同步率异常、核心中的亲子关系、以及关键战斗中的失控行动绑定在一起。",
    reading: "你的结果落在初号机，是因为同步倾向和存在追问同时偏高。这个组合更像是在压力中被迫建立连接，而不是单纯追求胜利。",
    tension: "优势是临界点很高；问题是任务、关系和自我证明容易被绑在一起。",
    shareLine: "测试把我分到初号机：能启动，但不一定好控制。",
    theme: THEMES.unit01,
  },
  BERS01: {
    displayName: "EVA 初号机暴走",
    modelName: "EVANGELION-01 BERSERK STATE",
    jpName: "エヴァンゲリオン初号機 暴走",
    marker: "01",
    route: "暴走记录 / 临界同步",
    lore: "初号机的暴走不是普通故障。原作把它处理成机体意志、驾驶员崩溃和核心反应同时出现的事件。",
    reading: "你的高同步、高抗压和高攻击反应把结果推到暴走记录。这里的重点不是情绪大，而是外部压力超过阈值后，系统会直接接管行动。",
    tension: "最强处在于危机中会自己动起来；最危险处也在这里，事后未必能解释每一步。",
    shareLine: "测试把我分到初号机暴走：不是稳定输出，是临界反应。",
    theme: THEMES.unit01,
  },
  COM02: {
    displayName: "EVA 贰号机",
    modelName: "EVANGELION-02 PRODUCTION MODEL",
    jpName: "エヴァンゲリオン弐号機",
    marker: "02",
    route: "正式量产机 / 实战适格",
    lore: "贰号机是第一台正式实战用 EVA。红色机体、武器适应性和驾驶员的强自尊，是它在原作里的主要记忆点。",
    reading: "你的攻击性、决断力和自我意识都偏前列。结果不是在说脾气，而是行动优先级非常清楚：先进入战场，再修正细节。",
    tension: "优势是不用等别人推你；代价是失败会很难被当成普通失误。",
    shareLine: "测试把我分到贰号机：能打，且很难假装不在意。",
    theme: THEMES.unit02,
  },
  FURY02: {
    displayName: "EVA 贰号机近战配置",
    modelName: "EVANGELION-02 ASSAULT CONFIG",
    jpName: "エヴァンゲリオン弐号機 近接戦闘",
    marker: "02",
    route: "近战配置 / 高压推进",
    lore: "贰号机在系列中承担了大量正面战斗。它的美感不在神秘，而在明确、锋利、带着自尊的进攻姿态。",
    reading: "测试显示你的战斗判断比情绪表达更快。你适合短时间高压推进，但不适合长时间解释自己为什么这么做。",
    tension: "优势是出手干净；风险是把休息也理解成退让。",
    shareLine: "测试把我分到贰号机近战配置：先处理问题，再处理感受。",
    theme: THEMES.unit02,
  },
  VOID00: {
    displayName: "EVA 零号机",
    modelName: "EVANGELION-00 PROTOTYPE",
    jpName: "エヴァンゲリオン零号機",
    marker: "00",
    route: "原型机 / 低表征适格",
    lore: "零号机是最早投入测试的原型机。它的存在感偏冷，和试验、替换、沉默的执行感联系更紧。",
    reading: "你的结果更接近零号机，是因为责任感和独立性高，但表达与自我需求偏低。系统能读到执行力，却读不到太多外放信号。",
    tension: "优势是稳定承担；风险是长期把自己当成可替换部件。",
    shareLine: "测试把我分到零号机：安静，不代表没有反应。",
    theme: THEMES.unit00,
  },
  SACR00: {
    displayName: "EVA 零号机改",
    modelName: "EVANGELION-00 REFIT",
    jpName: "エヴァンゲリオン零号機 改",
    marker: "00",
    route: "改装原型机 / 防御记录",
    lore: "零号机改在视觉上更接近正式机体，但它仍保留原型机的冷感。原作中它常被放在保护、测试和牺牲的位置上。",
    reading: "你的 AT 力场和责任感都很高，但同步与共情的外显并不强。你更像先完成保护，再决定要不要说明原因。",
    tension: "优势是边界清楚；风险是别人只看见你的克制，看不见背后的投入。",
    shareLine: "测试把我分到零号机改：边界很硬，选择很少说出口。",
    theme: THEMES.unit00,
  },
  GRD03: {
    displayName: "EVA 参号机",
    modelName: "EVANGELION-03 PRODUCTION MODEL",
    jpName: "エヴァンゲリオン参号機",
    marker: "03",
    route: "正式机 / 普通人的战场",
    lore: "参号机原本是正式量产路线上的机体，却在原作里被使徒侵蚀，成为一段很具体的悲剧。",
    reading: "你的高责任感和较均衡的基础数据更接近参号机。它不像初号机那样神秘，也不像贰号机那样张扬，但它承担的是具体的人和具体的后果。",
    tension: "优势是能把责任落到现实里；风险是太容易把别人的安全放在自己前面。",
    shareLine: "测试把我分到参号机：普通配置，承担的事不普通。",
    theme: THEMES.unit03,
  },
  SACR03: {
    displayName: "EVA 参号机侵蚀记录",
    modelName: "EVANGELION-03 CONTAMINATION LOG",
    jpName: "エヴァンゲリオン参号機 侵食記録",
    marker: "03",
    route: "侵蚀记录 / 高责任阈值",
    lore: "参号机最重要的剧情不是性能，而是被侵蚀后的不可逆处境。机体成为敌人时，驾驶员仍被困在系统内部。",
    reading: "你的责任感过高，同时保留较强同步和独立性。这个结果指向一种问题：即使局面已经不公平，你仍倾向于留在里面解决。",
    tension: "优势是不会轻易退出；风险是太晚承认自己也需要撤离。",
    shareLine: "测试把我分到参号机侵蚀记录：不是不怕，是没退出。",
    theme: THEMES.unit03,
  },
  VAN04: {
    displayName: "EVA 四号机",
    modelName: "EVANGELION-04 EXPERIMENTAL",
    jpName: "エヴァンゲリオン四号機",
    marker: "04",
    route: "试验机 / S2 机关记录",
    lore: "四号机在原作中几乎没有实战记录。它和 S2 机关试验、第二支部消失这类资料性事件联系在一起。",
    reading: "你的数据偏向理论稳定和低可见度。匹配四号机不是因为空白，而是因为很多关键反应不会在日常场景里被看见。",
    tension: "优势是能在复杂系统里保持冷静；风险是存在感被误判成缺席。",
    shareLine: "测试把我分到四号机：记录很少，但不是没有发生。",
    theme: THEMES.unit04,
  },
  SIG04: {
    displayName: "EVA 四号机 S2 试验",
    modelName: "EVANGELION-04 S2 TEST LOG",
    jpName: "エヴァンゲリオン四号機 S2実験",
    marker: "04",
    route: "S2 试验 / 高理性低表征",
    lore: "四号机的 S2 机关试验是 EVA 世界观里少见的技术性灾难。它的危险来自看似精确的系统边界被突破。",
    reading: "你的战术性高，情绪表达低。系统把你归到四号机 S2 试验，是因为你习惯先计算后感受，甚至会把感受从记录中删掉。",
    tension: "优势是精确；风险是精确到最后只剩结论，没有人知道过程。",
    shareLine: "测试把我分到四号机 S2 试验：看起来冷静，其实只是记录方式不同。",
    theme: THEMES.unit04,
  },
  BEAST5: {
    displayName: "EVA 五号机",
    modelName: "EVANGELION-05 PROVISIONAL",
    jpName: "エヴァンゲリオン五号機",
    marker: "05",
    route: "临时机 / 局地作战",
    lore: "五号机是临时、局地、非完整感很强的机体。它的重点不是标准化，而是在有限条件下完成任务。",
    reading: "你的攻击性和决断力高，战术性不一定走常规路径。五号机适合这种反应：装备不完美，但会先把入口守住。",
    tension: "优势是临场强；风险是长期把粗糙当成唯一可用的方式。",
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
    reading: "你的同步率和独立性偏高，攻击性中等。结果指向防守型临时配置：不主动夸张，但阵地交给你时会守住。",
    tension: "优势是可靠；风险是太习惯在资源不足的情况下硬撑。",
    shareLine: "测试把我分到五号机临时配置：没有满配，但会守线。",
    theme: THEMES.unit05,
  },
  DESC06: {
    displayName: "EVA Mark.06",
    modelName: "EVANGELION Mark.06",
    jpName: "エヴァンゲリオン Mark.06",
    marker: "06",
    route: "月面机体 / 非 NERV 标准线",
    lore: "Mark.06 与月面、SEELE 和更接近使徒侧的暗示相连。它在原作里的气质更冷、更远，也更像被提前安排好的节点。",
    reading: "你的共情力和精神韧性高，但攻击欲不突出。这个组合让结果落在 Mark.06：能理解局面，却不急着证明自己在场。",
    tension: "优势是距离感带来判断力；风险是太容易把真实意图藏成礼貌。",
    shareLine: "测试把我分到 Mark.06：离得远，但看得很清楚。",
    theme: THEMES.mark06,
  },
  ANGEL06: {
    displayName: "EVA Mark.06 使徒侧记录",
    modelName: "EVANGELION Mark.06 ANGELIC TRACE",
    jpName: "エヴァンゲリオン Mark.06 使徒側記録",
    marker: "06",
    route: "使徒侧记录 / 高共感",
    lore: "Mark.06 在设定上一直带着接近使徒的暧昧感。它不是普通量产线的延伸，而是一台带有更高层安排的机体。",
    reading: "高同步和高共情让你的结果偏向 Mark.06 的使徒侧记录。你对情绪和气氛的捕捉很快，但行动不一定外放。",
    tension: "优势是能读懂未说出口的东西；风险是把理解误认为已经解决。",
    shareLine: "测试把我分到 Mark.06 使徒侧记录：感知很准，行动很慢。",
    theme: THEMES.mark06,
  },
  SNIP08: {
    displayName: "EVA 八号机",
    modelName: "EVANGELION-08 WILLE CUSTOM",
    jpName: "エヴァンゲリオン八号機",
    marker: "08",
    route: "WILLE 机体 / 远程支援",
    lore: "八号机属于 WILLE 阵营，粉色机体和多眼设计让它很容易被记住。它更常承担远程支援和战场观察。",
    reading: "你的战术性高，攻击性不一定高。八号机对应的是距离、观察和精确介入，而不是一开始就冲进中心。",
    tension: "优势是看得全；风险是太习惯站在远处，错过需要直接表态的时刻。",
    shareLine: "测试把我分到八号机：不站最前，但会瞄准。",
    theme: THEMES.unit08,
  },
  REB08: {
    displayName: "EVA 八号机 WILLE 配置",
    modelName: "EVANGELION-08 WILLE FIELD CONFIG",
    jpName: "エヴァンゲリオン八号機 WILLE装備",
    marker: "08",
    route: "WILLE 配置 / 反 NERV 线路",
    lore: "八号机的立场不属于传统 NERV 系统。它的叙事重点是脱离原指挥链后，仍然保持作战能力。",
    reading: "你的独立性和战术性都高，信任度偏低。结果不是简单叛逆，而是你更愿意先验证系统，再决定是否服从。",
    tension: "优势是不容易被话术带走；风险是长期把怀疑当成唯一安全感。",
    shareLine: "测试把我分到八号机 WILLE 配置：不是不合作，是先看指挥权给谁。",
    theme: THEMES.unit08,
  },
  CLONE09: {
    displayName: "EVA 九号机",
    modelName: "EVANGELION Mark.09 / ADAMS VESSEL",
    jpName: "エヴァンゲリオン九号機",
    marker: "09",
    route: "Adams 容器 / 复制线路",
    lore: "九号机在新剧场版中带有容器和复制的意味。它借用零号机的视觉记忆，却不是同一台机体。",
    reading: "你的责任感高，外显自我低。九号机对应的是编号、替代和任务优先，而不是强烈的个人叙述。",
    tension: "优势是能进入角色；风险是进入得太彻底，忘了角色不是本人。",
    shareLine: "测试把我分到九号机：名字不重要，编号会工作。",
    theme: THEMES.unit09,
  },
  ECHO09: {
    displayName: "EVA 九号机 Adams 容器",
    modelName: "EVANGELION Mark.09 ADAMS VESSEL",
    jpName: "エヴァンゲリオン九号機 Adamsの器",
    marker: "09",
    route: "Adams 容器 / 零号机回声",
    lore: "九号机看起来像零号机的延续，但它在剧情中承担的是另一套系统目的。熟悉的外观并不等于熟悉的核心。",
    reading: "你的同步反应稳定，但精神韧性和自我表达没有同等外放。结果落在九号机容器线，是因为你更像承载某种安排，而不是主动宣布自己。",
    tension: "优势是适应性强；风险是别人给出的定义会占用太多空间。",
    shareLine: "测试把我分到九号机 Adams 容器：像旧档案，但核心已经换了。",
    theme: THEMES.unit09,
  },
  DUAL13: {
    displayName: "EVA 十三号机",
    modelName: "EVANGELION-13",
    jpName: "エヴァンゲリオン第13号機",
    marker: "13",
    route: "双插入栓 / 双重驾驶",
    lore: "十三号机采用双插入栓系统，并和第四次冲击相关。它的关键不是强，而是两套意识被安排进入同一个结构。",
    reading: "你的高同步和高共情让结果落在十三号机。你容易同时理解两个方向，也容易在两套判断之间承担过多。",
    tension: "优势是能容纳复杂性；风险是复杂性最后都压到你一个人身上。",
    shareLine: "测试把我分到十三号机：两个判断同时在线。",
    theme: THEMES.unit13,
  },
  AWAKE13: {
    displayName: "EVA 十三号机觉醒",
    modelName: "EVANGELION-13 AWAKENED",
    jpName: "エヴァンゲリオン第13号機 覚醒",
    marker: "13",
    route: "觉醒记录 / 冲击节点",
    lore: "十三号机的觉醒和冲击事件绑定。它不是普通作战升级，而是剧情结构中被设计成触发节点的机体。",
    reading: "你的同步率、精神韧性和存在追问都偏高。测试把你推向觉醒记录，是因为你会把问题追到结构本身，而不只解决表面冲突。",
    tension: "优势是能看见根因；风险是解决根因之前，周围的人已经被卷进来。",
    shareLine: "测试把我分到十三号机觉醒：不是升级，是触发。",
    theme: THEMES.unit13,
  },
  FUS82: {
    displayName: "EVA 8+2号机",
    modelName: "EVANGELION-08+02 FUSION",
    jpName: "エヴァンゲリオン改8号機＋弐号機",
    marker: "8+2",
    route: "合体方案 / 双系统作战",
    lore: "8+2号机来自八号机与贰号机的合体构想。它的视觉重点就是不对称：远程支援和近战输出被放进同一套系统。",
    reading: "你的结果同时出现强行动和强判断。它不追求统一人格，而是让两种作战逻辑并行：一边观察，一边推进。",
    tension: "优势是可切换；风险是切换太快，别人跟不上你的节奏。",
    shareLine: "测试把我分到 8+2号机：一半瞄准，一半冲锋。",
    theme: THEMES.unit82,
  },
  ASYM82: {
    displayName: "EVA 8+2号机非对称配置",
    modelName: "EVANGELION-08+02 ASYMMETRIC CONFIG",
    jpName: "エヴァンゲリオン改8号機＋弐号機 非対称装備",
    marker: "8+2",
    route: "非对称配置 / 混合作战",
    lore: "8+2号机的重点不是融合成一种风格，而是承认两边系统都存在。红与粉、近战与远程，本来就不需要完全调和。",
    reading: "你的决断力、表达和责任感同时靠前。这个结果说明你的优势来自混合结构，而不是均衡。",
    tension: "优势是覆盖面大；风险是没有人能简单概括你，于是你也懒得解释。",
    shareLine: "测试把我分到 8+2号机非对称配置：不均衡，但有效。",
    theme: THEMES.unit82,
  },
  CMPL: {
    displayName: "人类补完计划",
    modelName: "HUMAN INSTRUMENTALITY PROJECT",
    jpName: "人類補完計画",
    marker: "LCL",
    route: "特殊结果 / AT 力场溶解",
    lore: "补完计划不是某一台 EVA，而是 EVA 世界观里关于个体边界的终点设定。它把孤独、误解和自我边界放到同一个问题里。",
    reading: "你的结果触发补完线，说明测试读到的是高共情和低边界的组合。你更在意隔阂被消除，而不是每个人都保持完整距离。",
    tension: "优势是能靠近别人；风险是靠近到最后，自己的轮廓变得不清楚。",
    shareLine: "测试把我分到人类补完计划：边界感很低，理解欲很高。",
    theme: THEMES.special,
  },
  U13G: {
    displayName: "EVA 十三号机觉醒",
    modelName: "EVANGELION-13 GOD STATE",
    jpName: "エヴァンゲリオン第13号機 覚醒",
    marker: "13",
    route: "特殊结果 / 冲击触发",
    lore: "十三号机觉醒线和双插入栓、使徒、冲击事件绑定。它代表的不是更强的驾驶，而是系统被推进到无法回退的阶段。",
    reading: "这个特殊结果来自高同步和高存在追问。测试读到的不是普通好奇心，而是会把问题一直追到边界之外。",
    tension: "优势是能推动变化；风险是变化一旦启动，很难只影响你自己。",
    shareLine: "测试把我分到十三号机觉醒：系统已经过阈值。",
    theme: THEMES.unit13,
  },
  ADAM: {
    displayName: "第一使徒 Adam",
    modelName: "FIRST ANGEL / OUT-OF-UNIT RESULT",
    jpName: "第一使徒 アダム",
    marker: "A",
    route: "特殊结果 / 非机体适格",
    lore: "Adam 不是 EVA 机体，而是 EVA 世界观中的起源性存在。这个结果用于表示数据无法稳定归入常规机体谱系。",
    reading: "你的结果没有落在普通机体上，说明测试向量过于分散或距离模板都很远。它不是稀有夸奖，更像系统无法归档。",
    tension: "优势是很难被现成标签限制；风险是别人也很难快速理解你的运行方式。",
    shareLine: "测试把我分到第一使徒 Adam：系统没有找到合适机体。",
    theme: THEMES.special,
  },
  REI0: {
    displayName: "EVA 零号机共鸣",
    modelName: "EVANGELION-00 RESONANCE",
    jpName: "エヴァンゲリオン零号機 共鳴",
    marker: "00",
    route: "特殊结果 / 原型机共鸣",
    lore: "零号机共鸣线把原型机的容器感和绫波相关的存在主题放在一起。它不是战斗配置，而是核心反应。",
    reading: "这个结果来自低外显、高责任和对被需要感的反应。测试读到的是一种安静的连接需求，而不是强烈占有。",
    tension: "优势是能长期保持温和的稳定；风险是太容易把被需要当成存在证明。",
    shareLine: "测试把我分到零号机共鸣：安静地连接，安静地承担。",
    theme: THEMES.unit00,
  },
};

const DEFAULT_PROFILE: ResultProfile = {
  displayName: "EVA 未确认机体",
  modelName: "UNCLASSIFIED EVANGELION RECORD",
  jpName: "未確認エヴァンゲリオン",
  marker: "?",
  route: "未确认记录",
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
    if (/进化|evo/i.test(name) || match.code === "EVOU") return "EVA 初号机进化记录";
    return "EVA 初号机";
  }

  if (unitKey === "unit02") {
    if (/反击|rebu/i.test(name) || match.code === "REBU") return "EVA 贰号机反击配置";
    if (/怒火|烈焰|fury/i.test(name) || match.code === "FURY") return "EVA 贰号机火力记录";
    return "EVA 贰号机";
  }

  if (unitKey === "unit00") {
    if (/人偶|doll/i.test(name) || match.code === "DOLL") return "EVA 零号机容器记录";
    if (/微笑|绫波|rei|smi/i.test(name) || match.code === "SMIY" || match.code === "REII") return "EVA 零号机共鸣";
    if (/虚无|void/i.test(name) || match.code === "VOID") return "EVA 零号机静默记录";
    return "EVA 零号机";
  }

  if (unitKey === "unit03") {
    if (/献身|牺牲|sacr/i.test(name) || match.code === "SACR") return "EVA 参号机侵蚀记录";
    if (/守护|gard/i.test(name) || match.code === "GARD") return "EVA 参号机守护配置";
    if (/领袖|lead/i.test(name) || match.code === "LEAD") return "EVA 参号机指挥记录";
    return "EVA 参号机";
  }

  if (unitKey === "mark06") {
    if (/天使|使徒|angl/i.test(name) || match.code === "ANGL") return "EVA Mark.06 使徒侧记录";
    if (/宿命|fate/i.test(name) || match.code === "FATE") return "EVA Mark.06 月面记录";
    if (/自由|free/i.test(name) || match.code === "FREE") return "EVA Mark.06 自由配置";
    return "EVA Mark.06";
  }

  if (match.evaUnit && match.evaUnit !== "综合评定") return match.evaUnit;
  if (match.code === "BALA") return "MAGI 平衡适格记录";
  if (match.code === "ADPT") return "MAGI 适应适格记录";
  if (match.code === "FLUX") return "MAGI 流变适格记录";
  if (match.code === "WATC") return "MAGI 观察适格记录";
  return baseName;
}

function inferRoute(match: MatchResult, displayName: string, baseRoute: string): string {
  if (displayName.includes("MAGI")) return "综合评定 / 未指定机体";
  if (displayName.includes("暴走")) return "暴走记录 / 临界同步";
  if (displayName.includes("觉醒")) return "觉醒记录 / 高同步阈值";
  if (displayName.includes("反击")) return "反击配置 / 实战适格";
  if (displayName.includes("火力")) return "火力记录 / 高压推进";
  if (displayName.includes("容器")) return "容器记录 / 原型机谱系";
  if (displayName.includes("静默")) return "静默记录 / 低表征适格";
  if (displayName.includes("侵蚀")) return "侵蚀记录 / 高责任阈值";
  if (displayName.includes("守护")) return "守护配置 / 防御适格";
  if (displayName.includes("指挥")) return "指挥记录 / 战场判断";
  if (displayName.includes("使徒侧")) return "使徒侧记录 / 高共感";
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

export default function ResultScreen({ result, onRestart, dimScores, userGrades }: Props) {
  const [copied, setCopied] = useState(false);
  const top = result.top;
  const profile = getProfile(top);
  const topDimensions = useMemo(() => {
    if (!userGrades) return [];
    return userGrades
      .map((grade, index) => ({ grade, index, score: dimScores[index] ?? 0 }))
      .sort((a, b) => {
        if (GRADE_VALUE[b.grade] !== GRADE_VALUE[a.grade]) {
          return GRADE_VALUE[b.grade] - GRADE_VALUE[a.grade];
        }
        return b.score - a.score;
      })
      .slice(0, 4);
  }, [dimScores, userGrades]);
  const topDimensionLabels = topDimensions
    .slice(0, 3)
    .map((d) => `${DIMENSIONS[d.index].code}${GRADE_LABELS[d.grade]}`)
    .join("/");
  const topDimensionCodes = topDimensions
    .slice(0, 3)
    .map((d) => `${DIMENSIONS[d.index].code}${d.grade}`)
    .join("-");
  const primaryDimension = topDimensions[0];
  const invitePrompt = primaryDimension
    ? DIMENSION_CHAIN_PROMPTS[primaryDimension.index]
    : "让一个和你差异很大的人测一次，结果最容易拉开。";
  const formationCode = `${profile.marker}-${top.code}-${topDimensionCodes || "SYNC"}`.replace(/\s+/g, "").toUpperCase();
  const shareUrl = buildShareUrl(formationCode);
  const shareText = [
    `我测到：${profile.displayName}`,
    profile.shareLine,
    `编队码：${formationCode}`,
    topDimensionLabels ? `高位指标：${topDimensionLabels}` : "",
    invitePrompt,
    "你测完把机体和编队码发我，看能不能凑一支 EVA 编队。",
    shareUrl,
  ].filter(Boolean).join("\n");

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
      code: top.code,
      unit: profile.displayName,
      formationCode,
    });

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      trackEvent("share_success", {
        channel,
        code: top.code,
        unit: profile.displayName,
        formationCode,
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
          code: top.code,
          unit: profile.displayName,
          formationCode,
        });
        await navigator.share({
          title: "EVA 适格机体测试",
          text: shareText,
          url: shareUrl || undefined,
        });
        trackEvent("share_success", {
          channel: "native",
          code: top.code,
          unit: profile.displayName,
          formationCode,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyResult("fallback");
  };

  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden"
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
        <span className="text-[0.68rem] text-[#777] tracking-[0.18em]" style={{ fontFamily: "var(--font-tech)" }}>
          {top.isSpecial ? "SPECIAL" : top.isBoundary ? "BOUNDARY" : "MATCH"}
        </span>
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
        transition={{ delay: 0.12, duration: 0.4 }}
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
        transition={{ delay: 0.2, duration: 0.4 }}
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
        transition={{ delay: 0.28, duration: 0.4 }}
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
        transition={{ delay: 0.32, duration: 0.4 }}
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

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:items-end">
            <p className="text-[0.92rem] leading-[1.7] text-[#d6d6d6]" style={{ fontFamily: "var(--font-title)" }}>
              {invitePrompt}
              <span className="block mt-1 text-[#aaa]">让对方回传机体和编队码，差异会比单看结果更明显。</span>
            </p>
            <div className="flex gap-2 sm:justify-end">
              {topDimensions.slice(0, 3).map((d) => (
                <span
                  key={`chain-${DIMENSIONS[d.index].code}`}
                  className="min-w-[52px] h-8 px-2 border border-white/10 flex items-center justify-center text-[0.68rem]"
                  style={{ color: "var(--unit-secondary)", background: "rgba(0,0,0,0.2)", fontFamily: "var(--font-tech)" }}
                >
                  {DIMENSIONS[d.index].code}
                  {GRADE_LABELS[d.grade]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="px-5 py-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.38, duration: 0.4 }}
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

      <motion.div
        className="grid grid-cols-1 min-[430px]:grid-cols-3 gap-3 px-5 pb-8 pt-2"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46, duration: 0.35 }}
      >
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
      </motion.div>
    </div>
  );
}
