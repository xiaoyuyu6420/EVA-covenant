"use client";

type EventName = "page_view" | "quiz_start" | "quiz_complete" | "share_click" | "share_success";

const SESSION_KEY = "eva-covenant-session";

function getSessionId() {
  if (typeof window === "undefined") return undefined;

  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(SESSION_KEY, id);
  return id;
}

function getAttribution() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: params.get("utm_source") ?? undefined,
    shareBy: params.get("share_by") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
  };
}

export function buildShareUrl(shareBy: string) {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.origin);
  url.searchParams.set("utm_source", "result_share");
  url.searchParams.set("utm_medium", "share");
  url.searchParams.set("share_by", shareBy);
  return url.toString();
}

export function trackEvent(event: EventName, meta?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const attribution = getAttribution();
  const payload = {
    event,
    page: `${window.location.pathname}${window.location.search}`,
    utmSource: attribution.utmSource,
    sessionId: getSessionId(),
    meta: {
      ...meta,
      shareBy: attribution.shareBy,
      utmMedium: attribution.utmMedium,
    },
  };

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
