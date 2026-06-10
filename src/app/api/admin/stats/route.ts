import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  // 验证管理员身份
  const authError = requireAdmin(req);
  if (authError) return authError;
  const total = await prisma.testRecord.count();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.testRecord.count({
    where: { createdAt: { gte: today } },
  });

  // 人格分布
  const distribution = await prisma.testRecord.groupBy({
    by: ["code"],
    _count: { code: true },
    orderBy: { _count: { code: "desc" } },
  });

  // 最近7天每日参与数
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentRecords = await prisma.testRecord.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  });

  const dailyCounts: Record<string, number> = {};
  for (const r of recentRecords) {
    const day = r.createdAt.toISOString().slice(0, 10);
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  }

  // 平均相似度
  const avgResult = await prisma.testRecord.aggregate({
    _avg: { similarity: true },
  });

  return NextResponse.json({
    total,
    todayCount,
    distribution: distribution.map((d) => ({
      code: d.code,
      count: d._count.code,
    })),
    dailyCounts,
    avgSimilarity: Math.round((avgResult._avg.similarity ?? 0) * 10) / 10,
  });
}
