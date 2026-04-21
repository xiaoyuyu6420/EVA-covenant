import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, similarity, isSpecial, isBoundary, scores, vector, gateAnswer, triggerAnswer, answers } = body;

    const record = await prisma.testRecord.create({
      data: {
        code,
        similarity,
        isSpecial: isSpecial ?? false,
        isBoundary: isBoundary ?? false,
        scores: JSON.stringify(scores),
        vector,
        gateAnswer,
        triggerAnswer,
        userAgent: req.headers.get("user-agent"),
        referer: req.headers.get("referer"),
        utmSource: new URL(req.url).searchParams.get("utm_source") ?? undefined,
        utmMedium: new URL(req.url).searchParams.get("utm_medium") ?? undefined,
        shareBy: new URL(req.url).searchParams.get("share_by") ?? undefined,
        answers: answers
          ? {
              create: answers.map((a: { dim: string; text: string; label: string; score: number }) => ({
                questionDim: a.dim,
                questionText: a.text,
                selectedLabel: a.label,
                selectedScore: a.score,
              })),
            }
          : undefined,
      },
    });

    // 统计群体定位
    const totalRecords = await prisma.testRecord.count();
    const sameTypeCount = await prisma.testRecord.count({ where: { code } });
    const rank = await prisma.testRecord.count({
      where: { code, createdAt: { lte: record.createdAt } },
    });

    return NextResponse.json({
      id: record.id,
      groupPosition: {
        rank,
        total: totalRecords,
        percentage: totalRecords > 0 ? `${((sameTypeCount / totalRecords) * 100).toFixed(1)}%` : "0%",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }
}
