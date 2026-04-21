import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    recentRecords,
  });
}
