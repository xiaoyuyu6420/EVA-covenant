import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseMeta(raw: string | null) {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function GET() {
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
        channel: typeof meta.channel === "string" ? meta.channel : null,
        formationCode: typeof meta.formationCode === "string" ? meta.formationCode : null,
        shareBy: typeof meta.shareBy === "string" ? meta.shareBy : null,
        relayFrom: typeof meta.relayFrom === "string" ? meta.relayFrom : null,
        relayRoot: typeof meta.relayRoot === "string" ? meta.relayRoot : null,
        createdAt: e.createdAt,
      };
    }),
    recentRecords,
  });
}
