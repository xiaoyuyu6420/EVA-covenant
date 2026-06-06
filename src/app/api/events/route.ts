import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "relay_entry",
  "quiz_start",
  "quiz_complete",
  "share_click",
  "share_success",
  "relay_branch_ready",
]);

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = cleanString(body.event, 48);

    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const meta = body.meta && typeof body.meta === "object"
      ? JSON.stringify(body.meta).slice(0, 2000)
      : null;

    await prisma.eventLog.create({
      data: {
        event,
        page: cleanString(body.page, 160),
        meta,
        utmSource: cleanString(body.utmSource, 80),
        sessionId: cleanString(body.sessionId, 120),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
