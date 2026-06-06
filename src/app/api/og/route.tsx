import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getSharePreview } from "@/lib/share-preview";

export const runtime = "edge";

const size = {
  width: 1200,
  height: 630,
};

function getParam(params: URLSearchParams, key: string, fallback: string, maxLength = 120) {
  const value = params.get(key)?.trim();
  return value ? value.slice(0, maxLength) : fallback;
}

function getRelayDepth(params: URLSearchParams) {
  const raw = params.get("relay_depth");
  if (!raw) return 1;
  const depth = Number.parseInt(raw, 10);
  if (!Number.isFinite(depth) || depth < 1) return 1;
  return Math.min(depth, 99);
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const shareBy = getParam(params, "share_by", "DIRECT", 96);
  const shareUnit = getParam(params, "share_unit", "", 80);
  const isNamedInvite = params.get("invite_named") === "1" || params.get("invite_named") === "true";
  const inviteLabel = getParam(params, "invite_label", "", 32);
  const relayRelation = getParam(params, "relay_relation", "", 40);
  const inviteTarget = getParam(params, "invite_target", "general", 40);
  const preview = getSharePreview({
    shareBy,
    shareUnit,
    relayDepth: getRelayDepth(params),
    inviteTarget,
    inviteLabel,
    relayRelation,
    inviteNamed: isNamedInvite,
    shareId: getParam(params, "share_id", "", 64),
  });
  const nodeText = `NODE ${preview.nodeLabel}`;
  const shareIdLabel = preview.shareId ? preview.shareId.slice(-12).toUpperCase() : "UNTRACKED";
  const detailRows = [
    { label: "INVITE MODE", value: preview.inviteLabel, color: preview.accent },
    { label: "CALL TYPE", value: isNamedInvite ? "DIRECT" : "OPEN", color: "#38bdf8" },
    { label: "SOURCE UNIT", value: preview.sourceUnit, color: "#f5f5f5" },
    { label: "SOURCE CODE", value: preview.sourceCode, color: preview.secondary },
    { label: "RELATION", value: preview.relation, color: "#a78bfa" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          background: "#090909",
          color: "#f4f4f4",
          fontFamily: "sans-serif",
          padding: 54,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              `radial-gradient(circle at 82% 16%, ${preview.accent}33, transparent 28%), linear-gradient(135deg, rgba(124,58,237,0.2), transparent 48%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            right: -28,
            top: -18,
            color: `${preview.accent}22`,
            fontSize: 210,
            fontWeight: 900,
            letterSpacing: -4,
          }}
        >
          EVA
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            borderBottom: "3px solid rgba(242,116,5,0.75)",
            paddingBottom: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 34,
                height: 34,
                display: "flex",
                background: "#f27405",
                transform: "skewX(-18deg)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ display: "flex", color: "#f27405", fontSize: 26, fontWeight: 800, letterSpacing: 5 }}>
                NERV-HQ
              </span>
              <span style={{ display: "flex", color: "#777", fontSize: 16, letterSpacing: 4, marginTop: 4 }}>
                PILOT COMPATIBILITY TEST
              </span>
            </div>
          </div>
          <div style={{ display: "flex", color: preview.accent, fontSize: 24, fontWeight: 800, letterSpacing: 4 }}>
            {nodeText}
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, position: "relative", paddingTop: 48, gap: 42 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", color: preview.accent, fontSize: 28, fontWeight: 800, letterSpacing: 6 }}>
              {preview.badge}
            </div>
            <div
              style={{
                marginTop: 24,
                color: "#fff",
                fontSize: preview.headline.length > 14 ? 56 : 64,
                lineHeight: 1.02,
                fontWeight: 900,
                maxWidth: 690,
                display: "flex",
              }}
            >
              {preview.headline}
            </div>
            <div
              style={{
                marginTop: 30,
                color: "#bbb",
                fontSize: 30,
                lineHeight: 1.35,
                maxWidth: 760,
                display: "flex",
              }}
            >
              {preview.body}
            </div>
            <div
              style={{
                marginTop: 26,
                borderLeft: `8px solid ${preview.accent}`,
                background: "rgba(0,0,0,0.38)",
                color: "#e5e5e5",
                fontSize: 24,
                lineHeight: 1.35,
                padding: "16px 20px",
                maxWidth: 760,
                display: "flex",
              }}
            >
              {preview.challenge}
            </div>
          </div>

          <div
            style={{
              width: 362,
              display: "flex",
              flexDirection: "column",
              gap: 9,
            }}
          >
            {detailRows.map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  border: "2px solid rgba(255,255,255,0.12)",
                  borderLeft: `8px solid ${color}`,
                  background: "rgba(0,0,0,0.42)",
                  padding: "12px 18px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span style={{ display: "flex", color: "#777", fontSize: 15, letterSpacing: 4, fontWeight: 800 }}>
                  {label}
                </span>
                <span
                  style={{
                    display: "flex",
                    color: "#f5f5f5",
                    fontSize: value.length > 28 ? 20 : 23,
                    lineHeight: 1.18,
                    marginTop: 8,
                    fontWeight: 800,
                    wordBreak: "break-all",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#777",
            fontSize: 18,
            letterSpacing: 4,
            borderTop: "2px solid rgba(255,255,255,0.1)",
            paddingTop: 22,
          }}
        >
          <span style={{ display: "flex" }}>EVA-COVENANT / FORMATION_RELAY</span>
          <span style={{ display: "flex", color: "#777" }}>LINK {shareIdLabel}</span>
          <span style={{ display: "flex", color: preview.accent }}>{preview.footerLabel}</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
