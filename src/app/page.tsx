import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { getSiteUrl } from "@/lib/site";

const DEFAULT_TITLE = "EVA 驾驶员适格测试 | NERV-HQ";
const DEFAULT_DESCRIPTION = "NERV紧急征召——你的适格率是多少？15维度心理测绘，24种人格匹配，测出你的EVA驾驶员类型。新世纪福音战士人格测试";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanParam(value: string | string[] | undefined, maxLength = 120) {
  const raw = firstParam(value)?.trim();
  return raw ? raw.slice(0, maxLength) : undefined;
}

function cleanRelayDepth(value: string | string[] | undefined) {
  const raw = firstParam(value);
  if (!raw) return undefined;
  const depth = Number.parseInt(raw, 10);
  if (!Number.isFinite(depth) || depth < 1) return undefined;
  return Math.min(depth, 99);
}

function buildRelayOgImageUrl(params: {
  shareBy: string;
  relayDepth?: number;
  inviteLabel?: string;
  relayRelation?: string;
}) {
  const url = new URL("/api/og", getSiteUrl());
  url.searchParams.set("share_by", params.shareBy);
  if (params.relayDepth) url.searchParams.set("relay_depth", params.relayDepth.toString());
  if (params.inviteLabel) url.searchParams.set("invite_label", params.inviteLabel);
  if (params.relayRelation) url.searchParams.set("relay_relation", params.relayRelation);
  return url;
}

export async function generateMetadata(
  { searchParams }: { searchParams: SearchParams }
): Promise<Metadata> {
  const params = await searchParams;
  const shareBy = cleanParam(params.share_by);
  const sourceDepth = cleanRelayDepth(params.relay_depth);
  const inviteLabel = cleanParam(params.invite_label, 40);
  const relayRelation = cleanParam(params.relay_relation, 40);

  if (!shareBy) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    };
  }

  const nextDepth = Math.min((sourceDepth ?? 1) + 1, 99);
  const title = "EVA 编队接力 | NERV-HQ";
  const contextParts = [
    inviteLabel ? `${inviteLabel}邀请` : "",
    relayRelation ? `上一站关系：${relayRelation}` : "",
  ].filter(Boolean);
  const context = contextParts.length > 0 ? `${contextParts.join(" / ")}。` : "";
  const description = `来自编队码 ${shareBy} 的接力邀请。${context}完成测试后生成你的机体和第 ${nextDepth} 站编队码。`;
  const ogImageUrl = buildRelayOgImageUrl({
    shareBy,
    relayDepth: sourceDepth,
    inviteLabel,
    relayRelation,
  });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "zh_CN",
      siteName: "EVA-Covenant",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "EVA 编队接力分享卡片",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function Home() {
  return <HomeClient />;
}
