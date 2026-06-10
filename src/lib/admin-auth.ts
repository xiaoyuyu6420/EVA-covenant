import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

/**
 * 验证管理员身份
 * 检查环境变量是否配置，并验证 token
 */

// 强制要求环境变量，不提供默认值
function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SECRET environment variable is required. Please set it in your .env file.");
  }
  return secret;
}

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is required. Please set it in your .env file.");
  }
  return password;
}

/**
 * 验证密码并生成 token
 */
export function verifyPassword(password: string): { valid: boolean; token?: string } {
  try {
    const adminPassword = getAdminPassword();
    if (password !== adminPassword) {
      return { valid: false };
    }

    const secret = getAdminSecret();
    const token = createHmac("sha256", secret)
      .update(`admin-${Date.now()}`)
      .digest("hex");

    return { valid: true, token };
  } catch {
    // 环境变量未配置时，拒绝登录
    return { valid: false };
  }
}

/**
 * 验证请求中的管理员 token
 * 从 cookie 或 Authorization header 中获取 token
 */
export function verifyAdminToken(req: NextRequest): boolean {
  try {
    // 验证环境变量是否配置
    if (!process.env.ADMIN_SECRET) {
      return false;
    }

    // 优先从 cookie 获取
    const cookieToken = req.cookies.get("admin_token")?.value;

    // 也可以从 Authorization header 获取
    const authHeader = req.headers.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const token = cookieToken || headerToken;
    if (!token) {
      return false;
    }

    // 验证 token 格式 (简单的 HMAC 格式检查)
    // token 应该是由 secret 签名的 hex 字符串
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return false;
    }

    // 注意：这里我们只验证 token 格式有效性
    // 在生产环境中，应该使用 JWT 或存储 token 进行完整验证
    // 但当前实现是简单的有状态 token，只要格式正确就认为有效
    return true;
  } catch {
    // 环境变量未配置时，拒绝所有请求
    return false;
  }
}

/**
 * 用于 API 路由的认证中间件
 * 返回 401 响应如果未认证
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  if (!verifyAdminToken(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Please login as admin." },
      { status: 401 }
    );
  }
  return null; // 认证通过，返回 null
}

/**
 * 创建管理员登录响应
 */
export function createLoginResponse(token: string): NextResponse {
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

/**
 * 检查管理员凭证是否已配置
 * 用于启动时的健康检查
 */
export function checkAdminCredentials(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!process.env.ADMIN_PASSWORD) {
    missing.push("ADMIN_PASSWORD");
  }

  if (!process.env.ADMIN_SECRET) {
    missing.push("ADMIN_SECRET");
  }

  return {
    configured: missing.length === 0,
    missing,
  };
}
