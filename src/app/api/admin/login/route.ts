import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const SECRET = process.env.ADMIN_SECRET || "eva-covenant-secret";

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }
  const token = sign(`admin-${Date.now()}`);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });
  return res;
}
