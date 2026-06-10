import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdmin) return NextResponse.next();

  // Allow login routes through
  if (pathname === "/api/admin/login" || pathname === "/admin/login") return NextResponse.next();

  // 检查环境变量是否配置
  if (!process.env.ADMIN_SECRET || !process.env.ADMIN_PASSWORD) {
    // 环境变量未配置时，拒绝所有管理请求
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Server configuration error. Admin credentials not configured." },
        { status: 500 }
      );
    }
    return NextResponse.redirect(new URL("/admin/login?error=config", req.url));
  }

  const token = req.cookies.get("admin_token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Validate token: must be a valid HMAC output (64 hex chars)
  if (!/^[0-9a-f]{64}$/.test(token)) {
    const res = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/admin/login", req.url));
    res.cookies.delete("admin_token");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};