import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const questions = await prisma.question.findMany({
    include: { options: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(questions);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, text, dimCode, options, translations } = body;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (text !== undefined) updateData.text = text;
    if (dimCode !== undefined) updateData.dimCode = dimCode;
    if (translations !== undefined) updateData.translations = typeof translations === "string" ? translations : JSON.stringify(translations);

    // Update question fields
    if (Object.keys(updateData).length > 0) {
      await prisma.question.update({ where: { id }, data: updateData });
    }

    // Update options if provided
    if (options && Array.isArray(options)) {
      for (const opt of options) {
        if (!opt.id) continue;
        const optData: Record<string, unknown> = {};
        if (opt.label !== undefined) optData.label = opt.label;
        if (opt.score !== undefined) optData.score = opt.score;
        if (opt.value !== undefined) optData.value = opt.value;
        if (opt.trigger !== undefined) optData.trigger = opt.trigger;
        if (opt.translations !== undefined) optData.translations = typeof opt.translations === "string" ? opt.translations : JSON.stringify(opt.translations);
        if (Object.keys(optData).length > 0) {
          await prisma.option.update({ where: { id: opt.id }, data: optData });
        }
      }
    }

    const updated = await prisma.question.findUnique({
      where: { id },
      include: { options: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dimCode, text, order, isGate, isTrigger, options } = body;

    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const question = await prisma.question.create({
      data: {
        dimCode: dimCode ?? "A1",
        text,
        order: order ?? 0,
        isGate: isGate ?? false,
        isTrigger: isTrigger ?? false,
        options: options
          ? {
              create: options.map((o: { label: string; score: number; value?: string; trigger?: string; order: number }) => ({
                label: o.label,
                score: o.score ?? 0,
                value: o.value,
                trigger: o.trigger,
                order: o.order ?? 0,
              })),
            }
          : undefined,
      },
      include: { options: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(question);
  } catch (e) {
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") ?? "");
    if (Number.isNaN(id) || id <= 0) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });

    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
