import { afterEach, describe, expect, it, vi } from "vitest";
import { buildShareUrl, getAttribution, normalizeAttributionUrl } from "./analytics";

function mockWindow(url: string) {
  const localStorage = new Map<string, string>();
  const sessionStorage = new Map<string, string>();
  const location = new URL(url);
  let historyState: Record<string, unknown> | null = null;

  vi.stubGlobal("window", {
    location,
    history: {
      get state() {
        return historyState;
      },
      replaceState: (state: Record<string, unknown>, _unused: string, nextUrl: string) => {
        historyState = state;
        const resolved = new URL(nextUrl, location.origin);
        location.pathname = resolved.pathname;
        location.search = resolved.search;
        location.hash = resolved.hash;
      },
    },
  });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => localStorage.get(key) ?? null,
    setItem: (key: string, value: string) => { localStorage.set(key, value); },
    removeItem: (key: string) => { localStorage.delete(key); },
  });
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => sessionStorage.get(key) ?? null,
    setItem: (key: string, value: string) => { sessionStorage.set(key, value); },
    removeItem: (key: string) => { sessionStorage.delete(key); },
  });
  vi.stubGlobal("crypto", { randomUUID: () => "test-session" });
}

describe("relay analytics urls", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds source unit context to share urls", () => {
    mockWindow("https://eva.example/?share_by=UPSTREAM-01&relay_root=ROOT-00&relay_depth=2");

    const url = new URL(buildShareUrl("EVA01-CORE-A1", undefined, undefined, 3, {
      shareUnit: "EVA 初号机",
      inviteTarget: "contrast",
      inviteLabel: "反差位",
      relayRelation: "反差编队",
      inviteNamed: true,
    }));

    expect(url.origin).toBe("https://eva.example");
    expect(url.searchParams.get("share_by")).toBe("EVA01-CORE-A1");
    expect(url.searchParams.get("share_unit")).toBe("EVA 初号机");
    expect(url.searchParams.get("relay_from")).toBe("UPSTREAM-01");
    expect(url.searchParams.get("relay_root")).toBe("ROOT-00");
    expect(url.searchParams.get("relay_depth")).toBe("3");
    expect(url.searchParams.get("invite_target")).toBe("contrast");
    expect(url.searchParams.get("invite_label")).toBe("反差位");
    expect(url.searchParams.get("relay_relation")).toBe("反差编队");
    expect(url.searchParams.get("invite_named")).toBe("1");
  });

  it("reads source unit attribution from incoming relay links", () => {
    mockWindow("https://eva.example/?share_by=EVA01-CORE-A1&share_unit=EVA%20%E5%88%9D%E5%8F%B7%E6%9C%BA&relay_depth=3");

    expect(getAttribution()).toMatchObject({
      shareBy: "EVA01-CORE-A1",
      shareUnit: "EVA 初号机",
      relayDepth: 3,
    });
  });

  it("keeps relay attribution after cleaning share params from the address bar", () => {
    mockWindow(
      "https://eva.example/?share_by=UPSTREAM-01&share_unit=EVA%20%E5%88%9D%E5%8F%B7%E6%9C%BA&relay_root=ROOT-00&relay_depth=2&invite_target=contrast&invite_label=%E5%8F%8D%E5%B7%AE%E4%BD%8D&relay_relation=%E5%8F%8D%E5%B7%AE%E7%BC%96%E9%98%9F&invite_named=1&keep=1"
    );

    expect(getAttribution().shareBy).toBe("UPSTREAM-01");
    expect(normalizeAttributionUrl()).toBe(true);

    expect(window.location.search).toBe("?keep=1");
    expect(getAttribution()).toMatchObject({
      shareBy: "UPSTREAM-01",
      shareUnit: "EVA 初号机",
      relayRoot: "ROOT-00",
      relayDepth: 2,
      inviteTarget: "contrast",
      inviteLabel: "反差位",
      relayRelation: "反差编队",
      inviteNamed: true,
    });

    const url = new URL(buildShareUrl("EVA01-CORE-A1", undefined, undefined, 3, {
      shareUnit: "EVA 初号机",
    }));

    expect(url.searchParams.get("relay_from")).toBe("UPSTREAM-01");
    expect(url.searchParams.get("relay_root")).toBe("ROOT-00");
    expect(url.searchParams.get("relay_depth")).toBe("3");
  });
});
