"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/admin";
      } else {
        setError("密码错误");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-[#333] bg-[#0a0a0a] p-8"
      >
        <h1
          className="text-lg font-bold mb-1 tracking-[2px]"
          style={{ fontFamily: "var(--font-tech)", color: "var(--nerv-orange)" }}
        >
          NERV — 管理系统鉴权
        </h1>
        <p className="text-[#666] text-xs mb-6" style={{ fontFamily: "var(--font-tech)" }}>
          AUTHENTICATION REQUIRED
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="输入管理密码"
          className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 text-sm mb-4 focus:outline-none focus:border-[#e65100]"
          style={{ fontFamily: "var(--font-tech)" }}
          autoFocus
        />

        {error && (
          <p className="text-red-500 text-xs mb-3" style={{ fontFamily: "var(--font-tech)" }}>
            ✕ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-3 text-sm font-bold tracking-[2px] border border-[#e65100] text-[#e65100] bg-transparent cursor-pointer uppercase hover:bg-[#e65100] hover:text-black transition-colors disabled:opacity-40"
          style={{ fontFamily: "var(--font-tech)" }}
        >
          {loading ? "验证中..." : "登录"}
        </button>
      </form>
    </div>
  );
}
