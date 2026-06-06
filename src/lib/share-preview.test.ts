import { describe, expect, it } from "vitest";
import { DEFAULT_SHARE_DESCRIPTION, DEFAULT_SHARE_TITLE, getSharePreview } from "./share-preview";

describe("share preview copy", () => {
  it("returns default non-relay preview copy", () => {
    const preview = getSharePreview();

    expect(preview.isRelay).toBe(false);
    expect(preview.title).toBe(DEFAULT_SHARE_TITLE);
    expect(preview.description).toBe(DEFAULT_SHARE_DESCRIPTION);
    expect(preview.headline).toContain("EVA");
    expect(preview.footerLabel).toBe("START TEST");
  });

  it("creates specific contrast relay preview copy", () => {
    const preview = getSharePreview({
      shareBy: "EVA01-CORE-A1",
      shareUnit: "EVA 初号机",
      relayDepth: 4,
      inviteTarget: "contrast",
      inviteLabel: "反差位",
      relayRelation: "反差编队",
      shareId: "invite_contrast_123!@#",
    });

    expect(preview.isRelay).toBe(true);
    expect(preview.target).toBe("contrast");
    expect(preview.title).toBe("EVA 编队接力 | 反差位邀请");
    expect(preview.headline).toContain("不一样");
    expect(preview.description).toContain("EVA 初号机 发起 反差位 接力");
    expect(preview.description).toContain("NODE 05");
    expect(preview.relation).toBe("反差编队");
    expect(preview.nodeLabel).toBe("05");
    expect(preview.shareId).toBe("invite_contrast_123");
  });

  it("marks named verification invites as direct calls", () => {
    const preview = getSharePreview({
      shareBy: "MK06-CORE-X2",
      relayDepth: 98,
      inviteTarget: "verify",
      inviteNamed: true,
    });

    expect(preview.title).toBe("EVA 编队接力 | 点名");
    expect(preview.badge).toBe("DIRECT CALL");
    expect(preview.description).toContain("这次是点名邀请");
    expect(preview.nodeLabel).toBe("99");
  });
});
