import { NextRequest, NextResponse } from "next/server";
import { matchPersonality } from "@/lib/match-engine";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scores, gateValue, triggerValue } = body;

    if (!scores || !Array.isArray(scores) || scores.length !== 15) {
      return NextResponse.json(
        { error: "Invalid scores: expected array of 15 numbers" },
        { status: 400 }
      );
    }

    const [dbPersonalities, dbSpecials] = await Promise.all([
      prisma.personalityType.findMany(),
      prisma.specialType.findMany(),
    ]);

    const result = matchPersonality(scores, gateValue, triggerValue, {
      personalityTypes: dbPersonalities,
      specialTypes: dbSpecials,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: "Match computation failed" },
      { status: 500 }
    );
  }
}
