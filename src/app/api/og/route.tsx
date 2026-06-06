import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

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
  const shareUnit = getParam(params, "share_unit", "EVA UNIT", 80);
  const inviteLabel = getParam(params, "invite_label", "下一站", 32);
  const relayRelation = getParam(params, "relay_relation", "FORMATION OPEN", 40);
  const nextDepth = Math.min(getRelayDepth(params) + 1, 99);
  const nodeLabel = nextDepth.toString().padStart(2, "0");
  const nodeText = `NODE ${nodeLabel}`;
  const detailRows = [
    { label: "INVITE MODE", value: inviteLabel, color: "#7cff00" },
    { label: "SOURCE UNIT", value: shareUnit, color: "#f5f5f5" },
    { label: "SOURCE CODE", value: shareBy, color: "#f27405" },
    { label: "RELATION", value: relayRelation, color: "#a78bfa" },
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
              "radial-gradient(circle at 82% 16%, rgba(82,255,0,0.2), transparent 28%), linear-gradient(135deg, rgba(124,58,237,0.2), transparent 48%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            right: -28,
            top: -18,
            color: "rgba(82,255,0,0.12)",
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
          <div style={{ display: "flex", color: "#7cff00", fontSize: 24, fontWeight: 800, letterSpacing: 4 }}>
            {nodeText}
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, position: "relative", paddingTop: 48, gap: 42 }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", color: "#7cff00", fontSize: 28, fontWeight: 800, letterSpacing: 6 }}>
                FORMATION RELAY
              </div>
            <div
              style={{
                marginTop: 24,
                color: "#fff",
                fontSize: 64,
                lineHeight: 1.02,
                fontWeight: 900,
                maxWidth: 690,
                display: "flex",
              }}
            >
              接入 EVA 编队测试
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
              完成测试后生成你的机体和编队码，把下一站接到这条链路上。
            </div>
          </div>

          <div
            style={{
              width: 362,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {detailRows.map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  border: "2px solid rgba(255,255,255,0.12)",
                  borderLeft: `8px solid ${color}`,
                  background: "rgba(0,0,0,0.42)",
                  padding: "14px 18px",
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
                    fontSize: value.length > 28 ? 21 : 25,
                    lineHeight: 1.18,
                    marginTop: 10,
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
          <span style={{ display: "flex", color: "#7cff00" }}>JOIN TEST</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
