import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const total = await prisma.testRecord.count();
  return NextResponse.json({ total });
}
