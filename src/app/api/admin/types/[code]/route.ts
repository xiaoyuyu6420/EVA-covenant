import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // 验证管理员身份
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { code } = await params;

  const pt = await prisma.personalityType.findUnique({ where: { code } });
  if (pt) return NextResponse.json(pt);

  const st = await prisma.specialType.findUnique({ where: { code } });
  if (st) return NextResponse.json(st);

  return NextResponse.json({ error: "Type not found" }, { status: 404 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // 验证管理员身份
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { code } = await params;
    const body = await req.json();

    // Try PersonalityType first
    const pt = await prisma.personalityType.findUnique({ where: { code } });
    if (pt) {
      const data: Record<string, unknown> = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.group !== undefined) data.group = body.group;
      if (body.vector !== undefined) data.vector = body.vector;
      if (body.slogan !== undefined) data.slogan = body.slogan;
      if (body.desc !== undefined) data.desc = body.desc;
      if (body.evaUnit !== undefined) data.evaUnit = body.evaUnit;
      if (body.emoji !== undefined) data.emoji = body.emoji;
      if (body.translations !== undefined) data.translations = typeof body.translations === "string" ? body.translations : JSON.stringify(body.translations);

      const updated = await prisma.personalityType.update({
        where: { code },
        data,
      });
      return NextResponse.json(updated);
    }

    // Try SpecialType
    const st = await prisma.specialType.findUnique({ where: { code } });
    if (st) {
      const data: Record<string, unknown> = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.slogan !== undefined) data.slogan = body.slogan;
      if (body.desc !== undefined) data.desc = body.desc;
      if (body.emoji !== undefined) data.emoji = body.emoji;
      if (body.translations !== undefined) data.translations = typeof body.translations === "string" ? body.translations : JSON.stringify(body.translations);

      const updated = await prisma.specialType.update({
        where: { code },
        data,
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Type not found" }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update type" }, { status: 500 });
  }
}
