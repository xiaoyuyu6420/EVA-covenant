import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

function parseMeta(raw: string | null) {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseRelayDepth(value: unknown) {
  const depth = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(depth) || depth < 1) return null;
  return Math.min(Math.trunc(depth), 99);
}

function getMetaString(meta: Record<string, unknown>, key: string) {
  const value = meta[key];
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : null;
}

function getMetaBoolean(meta: Record<string, unknown>, key: string) {
  const value = meta[key];
  return value === true || value === "true" || value === "1";
}

function incrementShareStat(
  map: Map<string, { clicks: number; successes: number }>,
  key: string,
  event: string,
) {
  const stat = map.get(key) ?? { clicks: 0, successes: 0 };
  if (event === "share_click") stat.clicks++;
  if (event === "share_success") stat.successes++;
  map.set(key, stat);
}

function toShareStatRows(map: Map<string, { clicks: number; successes: number }>) {
  return Array.from(map.entries())
    .map(([key, value]) => ({
      key,
      clicks: value.clicks,
      successes: value.successes,
      successRate: value.clicks > 0 ? Math.round((value.successes / value.clicks) * 1000) / 10 : null,
    }))
    .sort((a, b) => b.successes - a.successes || b.clicks - a.clicks);
}

function toRate(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

function toRatio(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) / 100 : null;
}

type ConversionStat = {
  label: string;
  relayEntries: number;
  starts: number;
  completes: number;
  reshares: number;
  branchReady: number;
};

type ShareLinkConversionStat = ConversionStat & {
  linkId: string;
  clicks: number;
  successes: number;
  channel: string | null;
  shareUnit: string | null;
  formationCode: string | null;
  inviteTarget: string | null;
  inviteLabel: string | null;
  relayRelation: string | null;
  relayDepth: number | null;
};

type RelayHealth = {
  shareSuccesses: number;
  relayEntries: number;
  relayStarts: number;
  relayCompletes: number;
  relayReshares: number;
  relayBranchReady: number;
  activeRoots: number;
  maxDepth: number;
  entryPerShare: number | null;
  startRate: number | null;
  completionRate: number | null;
  reshareRate: number | null;
  branchReadyRate: number | null;
};

function createConversionStat(label: string): ConversionStat {
  return {
    label,
    relayEntries: 0,
    starts: 0,
    completes: 0,
    reshares: 0,
    branchReady: 0,
  };
}

function createShareLinkConversionStat(linkId: string): ShareLinkConversionStat {
  return {
    ...createConversionStat(linkId),
    linkId,
    clicks: 0,
    successes: 0,
    channel: null,
    shareUnit: null,
    formationCode: null,
    inviteTarget: null,
    inviteLabel: null,
    relayRelation: null,
    relayDepth: null,
  };
}

function getShareLinkConversionStat(map: Map<string, ShareLinkConversionStat>, linkId: string) {
  const current = map.get(linkId) ?? createShareLinkConversionStat(linkId);
  map.set(linkId, current);
  return current;
}

function applyShareLinkOwnMeta(stat: ShareLinkConversionStat, meta: Record<string, unknown>) {
  const inviteLabel = getMetaString(meta, "inviteLabel");
  const shareUnit = getMetaString(meta, "shareUnit");

  stat.channel ??= getMetaString(meta, "channel");
  stat.shareUnit ??= shareUnit;
  stat.formationCode ??= getMetaString(meta, "formationCode");
  stat.inviteTarget ??= getMetaString(meta, "inviteTarget");
  stat.inviteLabel ??= inviteLabel;
  stat.relayRelation ??= getMetaString(meta, "relayRelation");
  stat.relayDepth ??= parseRelayDepth(meta.relayDepth);
  stat.label = inviteLabel ?? shareUnit ?? stat.label;
}

function applyShareLinkSourceMeta(stat: ShareLinkConversionStat, meta: Record<string, unknown>) {
  const sourceInviteLabel = getMetaString(meta, "sourceInviteLabel");
  const sourceShareUnit = getMetaString(meta, "sourceShareUnit");

  stat.shareUnit ??= sourceShareUnit;
  stat.formationCode ??= getMetaString(meta, "shareBy");
  stat.inviteTarget ??= getMetaString(meta, "sourceInviteTarget");
  stat.inviteLabel ??= sourceInviteLabel;
  stat.relayRelation ??= getMetaString(meta, "sourceRelayRelation");
  stat.relayDepth ??= parseRelayDepth(meta.relayDepth);
  stat.label = sourceInviteLabel ?? sourceShareUnit ?? stat.label;
}

function incrementConversionStat(stat: ConversionStat, event: string) {
  if (event === "relay_entry") stat.relayEntries++;
  if (event === "quiz_start") stat.starts++;
  if (event === "quiz_complete") stat.completes++;
  if (event === "share_success") stat.reshares++;
  if (event === "relay_branch_ready") stat.branchReady++;
}

function toConversionRows(map: Map<string, ConversionStat>) {
  return Array.from(map.entries())
    .map(([key, value]) => ({
      key,
      label: value.label,
      relayEntries: value.relayEntries,
      starts: value.starts,
      completes: value.completes,
      reshares: value.reshares,
      branchReady: value.branchReady,
      completionRate: toRate(value.completes, value.starts),
      reshareRate: toRate(value.reshares, value.completes),
      branchReadyRate: toRate(value.branchReady, value.completes),
    }))
    .sort((a, b) =>
      b.completes - a.completes ||
      b.starts - a.starts ||
      b.relayEntries - a.relayEntries ||
      b.reshares - a.reshares
    );
}

function toShareLinkConversionRows(map: Map<string, ShareLinkConversionStat>) {
  return Array.from(map.values())
    .map((value) => ({
      shareId: value.linkId,
      label: value.label,
      channel: value.channel,
      shareUnit: value.shareUnit,
      formationCode: value.formationCode,
      inviteTarget: value.inviteTarget,
      inviteLabel: value.inviteLabel,
      relayRelation: value.relayRelation,
      relayDepth: value.relayDepth,
      clicks: value.clicks,
      successes: value.successes,
      relayEntries: value.relayEntries,
      starts: value.starts,
      completes: value.completes,
      reshares: value.reshares,
      branchReady: value.branchReady,
      entryRate: toRate(value.relayEntries, value.successes),
      startRate: toRate(value.starts, value.relayEntries),
      completionRate: toRate(value.completes, value.starts),
      reshareRate: toRate(value.reshares, value.completes),
      branchReadyRate: toRate(value.branchReady, value.completes),
    }))
    .sort((a, b) =>
      b.completes - a.completes ||
      b.relayEntries - a.relayEntries ||
      b.successes - a.successes ||
      b.clicks - a.clicks
    );
}

export async function GET(req: NextRequest) {
  // 验证管理员身份
  const authError = requireAdmin(req);
  if (authError) return authError;

  // 来源渠道统计
  const utmStats = await prisma.testRecord.groupBy({
    by: ["utmSource"],
    _count: { utmSource: true },
    where: { utmSource: { not: null } },
  });

  // 设备分布 (简化：从 userAgent 提取)
  const records = await prisma.testRecord.findMany({
    select: { userAgent: true },
    take: 500,
  });
  const deviceCounts = { mobile: 0, desktop: 0, other: 0 };
  for (const r of records) {
    const ua = r.userAgent?.toLowerCase() ?? "";
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      deviceCounts.mobile++;
    } else if (ua.includes("windows") || ua.includes("mac") || ua.includes("linux")) {
      deviceCounts.desktop++;
    } else {
      deviceCounts.other++;
    }
  }

  // 事件统计
  const eventCounts = await prisma.eventLog.groupBy({
    by: ["event"],
    _count: { event: true },
  });

  // 传播来源统计：看分享链接带来的访问/完成/再次分享
  const eventUtmStats = await prisma.eventLog.groupBy({
    by: ["utmSource", "event"],
    _count: { event: true },
    where: { utmSource: { not: null } },
    orderBy: { _count: { event: "desc" } },
  });

  const recentEvents = await prisma.eventLog.findMany({
    take: 30,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      event: true,
      page: true,
      meta: true,
      utmSource: true,
      sessionId: true,
      createdAt: true,
    },
  });

  const relayDepthEvents = await prisma.eventLog.findMany({
    take: 500,
    orderBy: { createdAt: "desc" },
    select: {
      event: true,
      meta: true,
    },
  });

  const relayDepthMap = new Map<number, number>();
  for (const event of relayDepthEvents) {
    const meta = parseMeta(event.meta);
    const depth = event.event === "relay_entry"
      ? parseRelayDepth(meta.nextRelayDepth) ?? parseRelayDepth(meta.relayDepth)
      : parseRelayDepth(meta.relayDepth);
    if (!depth) continue;
    relayDepthMap.set(depth, (relayDepthMap.get(depth) ?? 0) + 1);
  }

  const shareEvents = await prisma.eventLog.findMany({
    take: 1000,
    orderBy: { createdAt: "desc" },
    where: { event: { in: ["share_click", "share_success"] } },
    select: {
      event: true,
      meta: true,
    },
  });

  const shareChannelMap = new Map<string, { clicks: number; successes: number }>();
  const inviteTargetMap = new Map<string, { label: string; clicks: number; successes: number }>();
  const relayRelationMap = new Map<string, { clicks: number; successes: number }>();
  const namedInviteMap = new Map<string, { clicks: number; successes: number }>();
  const shareLinkConversionMap = new Map<string, ShareLinkConversionStat>();

  for (const event of shareEvents) {
    const meta = parseMeta(event.meta);
    const channel = getMetaString(meta, "channel") ?? "unknown";
    incrementShareStat(shareChannelMap, channel, event.event);

    const shareId = getMetaString(meta, "shareId");
    if (shareId) {
      const current = getShareLinkConversionStat(shareLinkConversionMap, shareId);
      applyShareLinkOwnMeta(current, meta);
      if (event.event === "share_click") current.clicks++;
      if (event.event === "share_success") current.successes++;
    }

    const inviteTarget = getMetaString(meta, "inviteTarget");
    if (inviteTarget) {
      const current = inviteTargetMap.get(inviteTarget) ?? {
        label: getMetaString(meta, "inviteLabel") ?? inviteTarget,
        clicks: 0,
        successes: 0,
      };
      if (event.event === "share_click") current.clicks++;
      if (event.event === "share_success") current.successes++;
      inviteTargetMap.set(inviteTarget, current);
    }

    const relayRelation = getMetaString(meta, "relayRelation");
    if (relayRelation) {
      incrementShareStat(relayRelationMap, relayRelation, event.event);
    }

    if (getMetaBoolean(meta, "inviteNamed")) {
      incrementShareStat(namedInviteMap, "named", event.event);
    }
  }

  const inviteConversionEvents = await prisma.eventLog.findMany({
    take: 1500,
    orderBy: { createdAt: "desc" },
    where: { event: { in: ["relay_entry", "quiz_start", "quiz_complete", "share_success", "relay_branch_ready"] } },
    select: {
      event: true,
      meta: true,
    },
  });

  const inviteConversionMap = new Map<string, ConversionStat>();
  const sourceUnitConversionMap = new Map<string, ConversionStat>();
  const namedInviteConversionMap = new Map<string, ConversionStat>();
  const activeRelayRoots = new Set<string>();
  const relayHealth: RelayHealth = {
    shareSuccesses: 0,
    relayEntries: 0,
    relayStarts: 0,
    relayCompletes: 0,
    relayReshares: 0,
    relayBranchReady: 0,
    activeRoots: 0,
    maxDepth: 1,
    entryPerShare: null,
    startRate: null,
    completionRate: null,
    reshareRate: null,
    branchReadyRate: null,
  };

  for (const event of inviteConversionEvents) {
    const meta = parseMeta(event.meta);
    const relayDepth = event.event === "relay_entry"
      ? parseRelayDepth(meta.nextRelayDepth) ?? parseRelayDepth(meta.relayDepth)
      : parseRelayDepth(meta.relayDepth);
    if (relayDepth) relayHealth.maxDepth = Math.max(relayHealth.maxDepth, relayDepth);

    const relayRoot = getMetaString(meta, "relayRoot") ?? getMetaString(meta, "shareBy");
    if (relayRoot && relayDepth && relayDepth > 1) activeRelayRoots.add(relayRoot);

    const isRelayEvent = Boolean(getMetaString(meta, "shareBy"));
    if (event.event === "share_success") {
      relayHealth.shareSuccesses++;
      if (isRelayEvent) relayHealth.relayReshares++;
    }
    if (event.event === "relay_entry") relayHealth.relayEntries++;
    if (event.event === "quiz_start" && isRelayEvent) relayHealth.relayStarts++;
    if (event.event === "quiz_complete" && isRelayEvent) relayHealth.relayCompletes++;
    if (event.event === "relay_branch_ready" && isRelayEvent) relayHealth.relayBranchReady++;

    const target = getMetaString(meta, "sourceInviteTarget");
    if (target) {
      const current = inviteConversionMap.get(target) ?? createConversionStat(getMetaString(meta, "sourceInviteLabel") ?? target);
      current.label = getMetaString(meta, "sourceInviteLabel") ?? current.label;
      incrementConversionStat(current, event.event);
      inviteConversionMap.set(target, current);
    }

    const sourceUnit = getMetaString(meta, "sourceShareUnit");
    if (sourceUnit) {
      const current = sourceUnitConversionMap.get(sourceUnit) ?? createConversionStat(sourceUnit);
      incrementConversionStat(current, event.event);
      sourceUnitConversionMap.set(sourceUnit, current);
    }

    if (getMetaBoolean(meta, "sourceInviteNamed")) {
      const current = namedInviteConversionMap.get("named") ?? createConversionStat("点名接力");
      incrementConversionStat(current, event.event);
      namedInviteConversionMap.set("named", current);
    }

    const sourceShareId = getMetaString(meta, "sourceShareId");
    if (sourceShareId) {
      const current = getShareLinkConversionStat(shareLinkConversionMap, sourceShareId);
      applyShareLinkSourceMeta(current, meta);
      incrementConversionStat(current, event.event);
    }
  }

  relayHealth.activeRoots = activeRelayRoots.size;
  relayHealth.entryPerShare = toRatio(relayHealth.relayEntries, relayHealth.shareSuccesses);
  relayHealth.startRate = toRate(relayHealth.relayStarts, relayHealth.relayEntries);
  relayHealth.completionRate = toRate(relayHealth.relayCompletes, relayHealth.relayStarts);
  relayHealth.reshareRate = toRate(relayHealth.relayReshares, relayHealth.relayCompletes);
  relayHealth.branchReadyRate = toRate(relayHealth.relayBranchReady, relayHealth.relayCompletes);

  // 最近记录
  const recentRecords = await prisma.testRecord.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      similarity: true,
      isSpecial: true,
      isBoundary: true,
      utmSource: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    utmStats: utmStats.map((u) => ({ source: u.utmSource, count: u._count.utmSource })),
    deviceCounts,
    eventCounts: eventCounts.map((e) => ({ event: e.event, count: e._count.event })),
    eventUtmStats: eventUtmStats.map((e) => ({
      source: e.utmSource,
      event: e.event,
      count: e._count.event,
    })),
    relayDepthStats: Array.from(relayDepthMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([depth, count]) => ({ depth, count })),
    relayHealth,
    shareLinkConversionStats: toShareLinkConversionRows(shareLinkConversionMap).slice(0, 50),
    shareChannelStats: toShareStatRows(shareChannelMap).map((item) => ({
      channel: item.key,
      clicks: item.clicks,
      successes: item.successes,
      successRate: item.successRate,
    })),
    inviteTargetStats: Array.from(inviteTargetMap.entries())
      .map(([target, value]) => ({
        target,
        label: value.label,
        clicks: value.clicks,
        successes: value.successes,
        successRate: value.clicks > 0 ? Math.round((value.successes / value.clicks) * 1000) / 10 : null,
      }))
      .sort((a, b) => b.successes - a.successes || b.clicks - a.clicks),
    namedInviteStats: toShareStatRows(namedInviteMap).map((item) => ({
      key: item.key,
      label: "点名接力",
      clicks: item.clicks,
      successes: item.successes,
      successRate: item.successRate,
    })),
    inviteConversionStats: toConversionRows(inviteConversionMap).map((item) => ({
      target: item.key,
      label: item.label,
      relayEntries: item.relayEntries,
      starts: item.starts,
      completes: item.completes,
      reshares: item.reshares,
      branchReady: item.branchReady,
      completionRate: item.completionRate,
      reshareRate: item.reshareRate,
      branchReadyRate: item.branchReadyRate,
    })),
    namedInviteConversionStats: toConversionRows(namedInviteConversionMap).map((item) => ({
      key: item.key,
      label: item.label,
      relayEntries: item.relayEntries,
      starts: item.starts,
      completes: item.completes,
      reshares: item.reshares,
      branchReady: item.branchReady,
      completionRate: item.completionRate,
      reshareRate: item.reshareRate,
      branchReadyRate: item.branchReadyRate,
    })),
    sourceUnitConversionStats: toConversionRows(sourceUnitConversionMap).map((item) => ({
      unit: item.key,
      label: item.label,
      relayEntries: item.relayEntries,
      starts: item.starts,
      completes: item.completes,
      reshares: item.reshares,
      branchReady: item.branchReady,
      completionRate: item.completionRate,
      reshareRate: item.reshareRate,
      branchReadyRate: item.branchReadyRate,
    })),
    relayRelationStats: toShareStatRows(relayRelationMap).map((item) => ({
      relation: item.key,
      clicks: item.clicks,
      successes: item.successes,
      successRate: item.successRate,
    })),
    recentEvents: recentEvents.map((e) => {
      const meta = parseMeta(e.meta);
      return {
        id: e.id,
        event: e.event,
        page: e.page,
        utmSource: e.utmSource,
        sessionId: e.sessionId,
        code: typeof meta.code === "string" ? meta.code : null,
        unit: typeof meta.unit === "string" ? meta.unit : null,
        shareUnit: typeof meta.shareUnit === "string" ? meta.shareUnit : null,
        sourceShareUnit: typeof meta.sourceShareUnit === "string" ? meta.sourceShareUnit : null,
        shareId: getMetaString(meta, "shareId"),
        sourceShareId: getMetaString(meta, "sourceShareId"),
        channel: typeof meta.channel === "string" ? meta.channel : null,
        formationCode: typeof meta.formationCode === "string" ? meta.formationCode : null,
        inviteTarget: typeof meta.inviteTarget === "string" ? meta.inviteTarget : null,
        inviteLabel: typeof meta.inviteLabel === "string" ? meta.inviteLabel : null,
        relayRelation: typeof meta.relayRelation === "string" ? meta.relayRelation : null,
        sourceInviteTarget: typeof meta.sourceInviteTarget === "string" ? meta.sourceInviteTarget : null,
        sourceInviteLabel: typeof meta.sourceInviteLabel === "string" ? meta.sourceInviteLabel : null,
        sourceRelayRelation: typeof meta.sourceRelayRelation === "string" ? meta.sourceRelayRelation : null,
        inviteNamed: getMetaBoolean(meta, "inviteNamed"),
        sourceInviteNamed: getMetaBoolean(meta, "sourceInviteNamed"),
        inviteTargets: typeof meta.inviteTargets === "string" ? meta.inviteTargets : null,
        shareBy: typeof meta.shareBy === "string" ? meta.shareBy : null,
        relayFrom: typeof meta.relayFrom === "string" ? meta.relayFrom : null,
        relayRoot: typeof meta.relayRoot === "string" ? meta.relayRoot : null,
        relayDepth: parseRelayDepth(meta.relayDepth),
        nextRelayDepth: parseRelayDepth(meta.nextRelayDepth),
        createdAt: e.createdAt,
      };
    }),
    recentRecords,
  });
}
