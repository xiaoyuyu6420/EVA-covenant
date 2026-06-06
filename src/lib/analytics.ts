"use client";

export type EventName =
  | "page_view"
  | "relay_entry"
  | "quiz_start"
  | "quiz_complete"
  | "share_click"
  | "share_success"
  | "relay_branch_ready";

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
  inviteNamed?: boolean;
};

export type ShareUrlOptions = {
  shareUnit?: string;
  inviteTarget?: string;
  inviteLabel?: string;
  relayRelation?: string;
  inviteNamed?: boolean;
};

const SESSION_KEY = "eva-covenant-session";
const ATTRIBUTION_KEY = "eva-covenant-attribution";
const ATTRIBUTION_CAPTURE_STATE_KEY = "evaAttributionCaptured";
const ATTRIBUTION_TTL_MS = 6 * 60 * 60 * 1000;
const ATTRIBUTION_QUERY_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "share_by",
  "share_unit",
  "relay_from",
  "relay_root",
  "relay_depth",
  "invite_target",
  "invite_label",
  "relay_relation",
  "invite_named",
] as const;

type StoredAttribution = AttributionContext & {
  capturedAt?: number;
};

function getBrowserStorage(kind: "local" | "session") {
  if (typeof window === "undefined") return undefined;
  try {
    return kind === "local"
      ? (typeof localStorage === "undefined" ? undefined : localStorage)
      : (typeof sessionStorage === "undefined" ? undefined : sessionStorage);
  } catch {
    return undefined;
  }
}

function safeGetItem(storage: Storage | undefined, key: string) {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(storage: Storage | undefined, key: string, value: string) {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(storage: Storage | undefined, key: string) {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    return;
  }
}

function getSessionId() {
  if (typeof window === "undefined") return undefined;

  const storage = getBrowserStorage("local");
  const existing = safeGetItem(storage, SESSION_KEY);
  if (existing) return existing;

  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  safeSetItem(storage, SESSION_KEY, id);
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

function getBooleanParam(params: URLSearchParams, key: string) {
  const raw = params.get(key);
  return raw === "1" || raw === "true" ? true : undefined;
}

function readAttributionFromParams(params: URLSearchParams): AttributionContext {
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
    inviteNamed: getBooleanParam(params, "invite_named"),
  };
}

function hasAttributionValue(attribution: AttributionContext) {
  return Object.values(attribution).some((value) => value !== undefined);
}

function cleanStoredString(value: unknown, maxLength = 120) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function cleanStoredDepth(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) return undefined;
  return Math.min(Math.trunc(value), 99);
}

function persistAttribution(attribution: AttributionContext) {
  if (!hasAttributionValue(attribution)) return false;
  return safeSetItem(
    getBrowserStorage("session"),
    ATTRIBUTION_KEY,
    JSON.stringify({ ...attribution, capturedAt: Date.now() } satisfies StoredAttribution)
  );
}

function readPersistedAttribution(): AttributionContext {
  const storage = getBrowserStorage("session");
  const raw = safeGetItem(storage, ATTRIBUTION_KEY);
  if (!raw) return {};

  try {
    const stored = JSON.parse(raw) as StoredAttribution;
    const capturedAt = typeof stored.capturedAt === "number" ? stored.capturedAt : 0;
    if (!capturedAt || Date.now() - capturedAt > ATTRIBUTION_TTL_MS) {
      safeRemoveItem(storage, ATTRIBUTION_KEY);
      return {};
    }

    const attribution = {
      utmSource: cleanStoredString(stored.utmSource, 80),
      shareBy: cleanStoredString(stored.shareBy),
      shareUnit: cleanStoredString(stored.shareUnit, 80),
      utmMedium: cleanStoredString(stored.utmMedium, 80),
      relayFrom: cleanStoredString(stored.relayFrom),
      relayRoot: cleanStoredString(stored.relayRoot),
      relayDepth: cleanStoredDepth(stored.relayDepth),
      inviteTarget: cleanStoredString(stored.inviteTarget, 80),
      inviteLabel: cleanStoredString(stored.inviteLabel, 80),
      relayRelation: cleanStoredString(stored.relayRelation, 80),
      inviteNamed: stored.inviteNamed === true ? true : undefined,
    };

    return hasAttributionValue(attribution) ? attribution : {};
  } catch {
    safeRemoveItem(storage, ATTRIBUTION_KEY);
    return {};
  }
}

function hasCapturedAttributionState() {
  if (typeof window === "undefined") return false;
  const state = window.history?.state;
  return Boolean(
    state &&
    typeof state === "object" &&
    (state as Record<string, unknown>)[ATTRIBUTION_CAPTURE_STATE_KEY] === true
  );
}

export function getAttribution(): AttributionContext {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const liveAttribution = readAttributionFromParams(params);

  if (hasAttributionValue(liveAttribution)) {
    persistAttribution(liveAttribution);
    return liveAttribution;
  }

  if (!hasCapturedAttributionState()) {
    safeRemoveItem(getBrowserStorage("session"), ATTRIBUTION_KEY);
    return {};
  }

  return readPersistedAttribution();
}

export function normalizeAttributionUrl() {
  if (typeof window === "undefined") return false;

  const url = new URL(window.location.href);
  const liveAttribution = readAttributionFromParams(url.searchParams);
  let changed = false;

  for (const key of ATTRIBUTION_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (!changed) return false;
  if (hasAttributionValue(liveAttribution) && !persistAttribution(liveAttribution)) {
    return false;
  }

  const currentState = window.history.state;
  const nextState = currentState && typeof currentState === "object"
    ? { ...currentState, [ATTRIBUTION_CAPTURE_STATE_KEY]: true }
    : { [ATTRIBUTION_CAPTURE_STATE_KEY]: true };

  window.history.replaceState(nextState, "", `${url.pathname}${url.search}${url.hash}`);
  return true;
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
  if (options?.inviteNamed) url.searchParams.set("invite_named", "1");
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
      sourceInviteNamed: attribution.inviteNamed,
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
