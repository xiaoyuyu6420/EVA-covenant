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
  shareUnit?: string;
  relayFrom?: string;
  relayRoot?: string;
  relayDepth?: number;
  inviteTarget?: string;
  inviteLabel?: string;
  relayRelation?: string;
};

export type ShareUrlOptions = {
  shareUnit?: string;
  inviteTarget?: string;
  inviteLabel?: string;
  relayRelation?: string;
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

function getPositiveIntParam(params: URLSearchParams, key: string) {
  const raw = params.get(key);
  if (!raw) return undefined;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1) return undefined;
  return Math.min(value, 99);
}

export function getAttribution(): AttributionContext {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: getParam(params, "utm_source", 80),
    shareBy: getParam(params, "share_by"),
    shareUnit: getParam(params, "share_unit", 80),
    utmMedium: getParam(params, "utm_medium", 80),
    relayFrom: getParam(params, "relay_from"),
    relayRoot: getParam(params, "relay_root"),
    relayDepth: getPositiveIntParam(params, "relay_depth"),
    inviteTarget: getParam(params, "invite_target", 80),
    inviteLabel: getParam(params, "invite_label", 80),
    relayRelation: getParam(params, "relay_relation", 80),
  };
}

export function normalizeRelayDepth(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.trunc(value), 1), 99);
}

export function buildShareUrl(
  shareBy: string,
  relayFrom?: string,
  relayRoot?: string,
  relayDepth?: number,
  options?: ShareUrlOptions
) {
  if (typeof window === "undefined") return "";

  const upstream = relayFrom ?? getAttribution().shareBy;
  const root = relayRoot ?? getAttribution().relayRoot ?? upstream;
  const depth = normalizeRelayDepth(relayDepth);
  const url = new URL(window.location.origin);
  url.searchParams.set("utm_source", "result_share");
  url.searchParams.set("utm_medium", "share");
  url.searchParams.set("utm_campaign", "formation_relay");
  url.searchParams.set("share_by", shareBy);
  url.searchParams.set("relay_depth", depth.toString());
  if (options?.shareUnit) url.searchParams.set("share_unit", options.shareUnit);
  if (upstream && upstream !== shareBy) url.searchParams.set("relay_from", upstream);
  if (root && root !== shareBy) url.searchParams.set("relay_root", root);
  if (options?.inviteTarget) url.searchParams.set("invite_target", options.inviteTarget);
  if (options?.inviteLabel) url.searchParams.set("invite_label", options.inviteLabel);
  if (options?.relayRelation) url.searchParams.set("relay_relation", options.relayRelation);
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
      sourceShareUnit: attribution.shareUnit,
      utmMedium: attribution.utmMedium,
      relayFrom: attribution.relayFrom,
      relayRoot: attribution.relayRoot,
      relayDepth: attribution.relayDepth,
      sourceInviteTarget: attribution.inviteTarget,
      sourceInviteLabel: attribution.inviteLabel,
      sourceRelayRelation: attribution.relayRelation,
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
