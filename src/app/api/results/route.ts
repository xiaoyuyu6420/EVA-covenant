import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ResultBody = {
  code?: unknown;
  similarity?: unknown;
  isSpecial?: unknown;
  isBoundary?: unknown;
  scores?: unknown;
  vector?: unknown;
  gateAnswer?: unknown;
  triggerAnswer?: unknown;
  answers?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  shareBy?: unknown;
  attribution?: unknown;
};

type AnswerBody = {
  dim?: unknown;
  text?: unknown;
  label?: unknown;
  score?: unknown;
};

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getRefererParam(referer: string | null, key: string) {
  if (!referer) return undefined;
  try {
    return new URL(referer).searchParams.get(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanString(value, 120);
    if (cleaned) return cleaned;
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ResultBody;
    const code = cleanString(body.code, 80);
    const similarity = Number(body.similarity);
    const vector = cleanString(body.vector, 80);

    if (!code || !Number.isFinite(similarity) || !vector || !Array.isArray(body.scores)) {
      return NextResponse.json({ error: "Invalid result payload" }, { status: 400 });
    }

    const params = req.nextUrl.searchParams;
    const referer = req.headers.get("referer");
    const attribution = getObject(body.attribution);

    const rawAnswers = Array.isArray(body.answers) ? body.answers as AnswerBody[] : [];
    const answers = rawAnswers
      .map((answer) => ({
        questionDim: cleanString(answer.dim, 16),
        questionText: cleanString(answer.text, 500),
        selectedLabel: cleanString(answer.label, 240),
        selectedScore: Number(answer.score),
      }))
      .filter((answer) =>
        answer.questionDim &&
        answer.questionText &&
        answer.selectedLabel &&
        Number.isFinite(answer.selectedScore)
      );

    const record = await prisma.testRecord.create({
      data: {
        code,
        similarity,
        isSpecial: Boolean(body.isSpecial),
        isBoundary: Boolean(body.isBoundary),
        scores: JSON.stringify(body.scores),
        vector,
        gateAnswer: cleanString(body.gateAnswer, 80),
        triggerAnswer: cleanString(body.triggerAnswer, 80),
        userAgent: req.headers.get("user-agent"),
        referer,
        utmSource: firstString(
          params.get("utm_source"),
          body.utmSource,
          attribution.utmSource,
          attribution.utm_source,
          getRefererParam(referer, "utm_source"),
        ),
        utmMedium: firstString(
          params.get("utm_medium"),
          body.utmMedium,
          attribution.utmMedium,
          attribution.utm_medium,
          getRefererParam(referer, "utm_medium"),
        ),
        shareBy: firstString(
          params.get("share_by"),
          body.shareBy,
          attribution.shareBy,
          attribution.share_by,
          getRefererParam(referer, "share_by"),
        ),
        answers: answers.length > 0
          ? {
              create: answers.map((answer) => ({
                questionDim: answer.questionDim!,
                questionText: answer.questionText!,
                selectedLabel: answer.selectedLabel!,
                selectedScore: answer.selectedScore,
              })),
            }
          : undefined,
      },
    });

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
  } catch {
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }
}
