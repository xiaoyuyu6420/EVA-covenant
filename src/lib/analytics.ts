"use client";

export type EventName =
  | "page_view"
  | "relay_entry"
  | "quiz_start"
  | "quiz_complete"
  | "share_click"
  | "share_success";

export type AttributionContext = {
  utmSource?: string;
  utmMedium?: string;
  shareBy?: string;
  relayFrom?: string;
  relayRoot?: string;
};

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

function getParam(params: URLSearchParams, key: string, maxLength = 120) {
  const value = params.get(key)?.trim();
  return value ? value.slice(0, maxLength) : undefined;
}

export function getAttribution(): AttributionContext {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: getParam(params, "utm_source", 80),
    shareBy: getParam(params, "share_by"),
    utmMedium: getParam(params, "utm_medium", 80),
    relayFrom: getParam(params, "relay_from"),
    relayRoot: getParam(params, "relay_root"),
  };
}

export function buildShareUrl(shareBy: string, relayFrom?: string, relayRoot?: string) {
  if (typeof window === "undefined") return "";

  const upstream = relayFrom ?? getAttribution().shareBy;
  const root = relayRoot ?? getAttribution().relayRoot ?? upstream;
  const url = new URL(window.location.origin);
  url.searchParams.set("utm_source", "result_share");
  url.searchParams.set("utm_medium", "share");
  url.searchParams.set("utm_campaign", "formation_relay");
  url.searchParams.set("share_by", shareBy);
  if (upstream && upstream !== shareBy) url.searchParams.set("relay_from", upstream);
  if (root && root !== shareBy) url.searchParams.set("relay_root", root);
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
      shareBy: attribution.shareBy,
      utmMedium: attribution.utmMedium,
      relayFrom: attribution.relayFrom,
      relayRoot: attribution.relayRoot,
      ...meta,
    },
  };

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
