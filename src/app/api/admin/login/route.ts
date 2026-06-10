import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createLoginResponse, checkAdminCredentials } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  // 先检查凭证是否已配置
  const { configured, missing } = checkAdminCredentials();
  if (!configured) {
    console.error(`Admin login failed: Missing required environment variables: ${missing.join(", ")}`);
    return NextResponse.json(
      { error: "Server configuration error. Please contact administrator." },
      { status: 500 }
    );
  }

  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const result = verifyPassword(password);
  if (!result.valid) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  return createLoginResponse(result.token!);
}

// 检查管理员配置状态
export async function GET() {
  const { configured, missing } = checkAdminCredentials();
  return NextResponse.json({
    configured,
    missing: configured ? undefined : missing,
  });
}
