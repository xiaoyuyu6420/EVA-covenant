import { afterEach, describe, expect, it, vi } from "vitest";
import { buildShareUrl, getAttribution } from "./analytics";

function mockWindow(url: string) {
  const localStorage = new Map<string, string>();

  vi.stubGlobal("window", {
    location: new URL(url),
  });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => localStorage.get(key) ?? null,
    setItem: (key: string, value: string) => { localStorage.set(key, value); },
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
  });

  it("reads source unit attribution from incoming relay links", () => {
    mockWindow("https://eva.example/?share_by=EVA01-CORE-A1&share_unit=EVA%20%E5%88%9D%E5%8F%B7%E6%9C%BA&relay_depth=3");

    expect(getAttribution()).toMatchObject({
      shareBy: "EVA01-CORE-A1",
      shareUnit: "EVA 初号机",
      relayDepth: 3,
    });
  });
});
