export const DEFAULT_SHARE_TITLE = "EVA 驾驶员适格测试 | NERV-HQ";
export const DEFAULT_SHARE_DESCRIPTION = "32 道 EVA 主题心理题，生成你的机体、同步率和编队码。测完可以拉朋友接下一站。";

const RELAY_TARGETS = ["general", "contrast", "same_axis", "verify", "history"] as const;

export type RelayPreviewTarget = (typeof RELAY_TARGETS)[number];

export type SharePreviewInput = {
  shareBy?: string;
  shareUnit?: string;
  relayDepth?: number;
  inviteTarget?: string;
  inviteLabel?: string;
  relayRelation?: string;
  inviteNamed?: boolean;
  shareId?: string;
};

export type SharePreview = {
  isRelay: boolean;
  target: RelayPreviewTarget;
  title: string;
  description: string;
  headline: string;
  body: string;
  challenge: string;
  inviteLabel: string;
  sourceCode: string;
  sourceUnit: string;
  relation: string;
  sourceDepth: number;
  nextDepth: number;
  nodeLabel: string;
  badge: string;
  accent: string;
  secondary: string;
  shareId?: string;
  ogAlt: string;
  footerLabel: string;
};

const TARGET_COPY: Record<RelayPreviewTarget, {
  label: string;
  titleLabel: string;
  headline: string;
  body: string;
  challenge: string;
  descriptionTail: string;
  accent: string;
  secondary: string;
}> = {
  general: {
    label: "下一站",
    titleLabel: "下一站邀请",
    headline: "你是这条编队的下一站",
    body: "测完把机体和编队码发回去，这条链才算接上。",
    challenge: "上一站想看你会接到哪台机体。",
    descriptionTail: "测完回传机体和编队码，再找下一站接上。",
    accent: "#7cff00",
    secondary: "#f27405",
  },
  contrast: {
    label: "反差位",
    titleLabel: "反差位邀请",
    headline: "上一站想看你们有多不一样",
    body: "结果越拉开，越容易看出盲区和互补点。",
    challenge: "上一站把你放在反差位。",
    descriptionTail: "测完对照你们是同轴、分支还是反差。",
    accent: "#f97316",
    secondary: "#7cff00",
  },
  same_axis: {
    label: "同轴位",
    titleLabel: "同轴位邀请",
    headline: "你们可能有同一条高位轴",
    body: "同一个指标可能会落到完全不同的 EVA 机体。",
    challenge: "上一站猜你们可能同轴。",
    descriptionTail: "测完看同一条轴线会不会落到不同机体。",
    accent: "#38bdf8",
    secondary: "#7cff00",
  },
  verify: {
    label: "校验位",
    titleLabel: "校验位邀请",
    headline: "上一站想让你反向校验结果",
    body: "越了解对方，越适合用自己的结果验证这次匹配。",
    challenge: "上一站让你做校验位。",
    descriptionTail: "测完把机体和编队码发回去，看看匹配是否站得住。",
    accent: "#a78bfa",
    secondary: "#38bdf8",
  },
  history: {
    label: "历史再发",
    titleLabel: "历史再发邀请",
    headline: "接回一条旧编队",
    body: "新结果接回旧编队，看链路和站位有没有变化。",
    challenge: "上一站从历史结果重启接力。",
    descriptionTail: "测完把新结果接回旧编队。",
    accent: "#facc15",
    secondary: "#7cff00",
  },
};

function cleanString(value: string | undefined, maxLength: number) {
  const cleanValue = value?.trim().replace(/\s+/g, " ");
  return cleanValue ? cleanValue.slice(0, maxLength) : undefined;
}

function cleanShareId(value: string | undefined) {
  const cleanValue = value?.trim().replace(/[^a-zA-Z0-9_-]/g, "");
  return cleanValue ? cleanValue.slice(0, 64) : undefined;
}

function normalizeTarget(value: string | undefined): RelayPreviewTarget {
  return RELAY_TARGETS.includes(value as RelayPreviewTarget) ? (value as RelayPreviewTarget) : "general";
}

function normalizeDepth(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.trunc(value), 99);
}

export function getSharePreview(input: SharePreviewInput = {}): SharePreview {
  const sourceCode = cleanString(input.shareBy, 96) ?? "DIRECT";
  const isRelay = sourceCode !== "DIRECT";
  const target = normalizeTarget(cleanString(input.inviteTarget, 40));
  const copy = TARGET_COPY[target];
  const sourceDepth = isRelay ? normalizeDepth(input.relayDepth, 1) : 0;
  const nextDepth = isRelay ? Math.min(sourceDepth + 1, 99) : 1;
  const nodeLabel = nextDepth.toString().padStart(2, "0");
  const inviteLabel = cleanString(input.inviteLabel, 32) ?? copy.label;
  const sourceUnit = cleanString(input.shareUnit, 80) ?? (isRelay ? "上一站机体未记录" : "EVA UNIT");
  const relation = cleanString(input.relayRelation, 40) ?? (isRelay ? "待对照" : "FORMATION OPEN");
  const shareId = cleanShareId(input.shareId);

  if (!isRelay) {
    return {
      isRelay,
      target,
      title: DEFAULT_SHARE_TITLE,
      description: DEFAULT_SHARE_DESCRIPTION,
      headline: "测出你的 EVA 机体",
      body: "完成心理测绘后生成机体、同步率和编队码，适合直接发给朋友对照。",
      challenge: "先完成一次评定，再发给一个你想对照的人。",
      inviteLabel: "自由测试",
      sourceCode,
      sourceUnit,
      relation,
      sourceDepth,
      nextDepth,
      nodeLabel,
      badge: "PILOT TEST",
      accent: "#7cff00",
      secondary: "#f27405",
      shareId,
      ogAlt: "EVA 驾驶员适格测试分享卡片",
      footerLabel: "START TEST",
    };
  }

  const directCall = input.inviteNamed ? "这次是点名邀请。" : "";
  const sourceLabel = sourceUnit === "上一站机体未记录" ? sourceCode : sourceUnit;
  const description = `${sourceLabel} 发起 ${inviteLabel} 接力。${directCall}完成测试后生成你的机体和 NODE ${nodeLabel} 编队码，${copy.descriptionTail}`;

  return {
    isRelay,
    target,
    title: `EVA 编队接力 | ${input.inviteNamed ? "点名" : copy.titleLabel}`,
    description,
    headline: copy.headline,
    body: copy.body,
    challenge: copy.challenge,
    inviteLabel,
    sourceCode,
    sourceUnit,
    relation,
    sourceDepth,
    nextDepth,
    nodeLabel,
    badge: input.inviteNamed ? "DIRECT CALL" : "FORMATION RELAY",
    accent: copy.accent,
    secondary: copy.secondary,
    shareId,
    ogAlt: `EVA 编队接力分享卡片：${inviteLabel}`,
    footerLabel: "JOIN TEST",
  };
}
