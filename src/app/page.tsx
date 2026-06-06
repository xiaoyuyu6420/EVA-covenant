import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { DEFAULT_SHARE_DESCRIPTION, DEFAULT_SHARE_TITLE, getSharePreview } from "@/lib/share-preview";
import { getSiteUrl } from "@/lib/site";

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

function cleanBooleanParam(value: string | string[] | undefined) {
  const raw = firstParam(value);
  return raw === "1" || raw === "true";
}

function buildRelayOgImageUrl(params: {
  shareBy: string;
  shareUnit?: string;
  relayDepth?: number;
  inviteTarget?: string;
  inviteLabel?: string;
  relayRelation?: string;
  inviteNamed?: boolean;
  shareId?: string;
}) {
  const url = new URL("/api/og", getSiteUrl());
  url.searchParams.set("share_by", params.shareBy);
  if (params.shareUnit) url.searchParams.set("share_unit", params.shareUnit);
  if (params.relayDepth) url.searchParams.set("relay_depth", params.relayDepth.toString());
  if (params.inviteTarget) url.searchParams.set("invite_target", params.inviteTarget);
  if (params.inviteLabel) url.searchParams.set("invite_label", params.inviteLabel);
  if (params.relayRelation) url.searchParams.set("relay_relation", params.relayRelation);
  if (params.inviteNamed) url.searchParams.set("invite_named", "1");
  if (params.shareId) url.searchParams.set("share_id", params.shareId);
  return url;
}

export async function generateMetadata(
  { searchParams }: { searchParams: SearchParams }
): Promise<Metadata> {
  const params = await searchParams;
  const shareBy = cleanParam(params.share_by);
  const shareUnit = cleanParam(params.share_unit, 80);
  const sourceDepth = cleanRelayDepth(params.relay_depth);
  const inviteTarget = cleanParam(params.invite_target, 40);
  const inviteLabel = cleanParam(params.invite_label, 40);
  const relayRelation = cleanParam(params.relay_relation, 40);
  const inviteNamed = cleanBooleanParam(params.invite_named);
  const shareId = cleanParam(params.share_id, 64);

  if (!shareBy) {
    return {
      title: DEFAULT_SHARE_TITLE,
      description: DEFAULT_SHARE_DESCRIPTION,
    };
  }

  const preview = getSharePreview({
    shareBy,
    shareUnit,
    relayDepth: sourceDepth,
    inviteTarget,
    inviteLabel,
    relayRelation,
    inviteNamed,
    shareId,
  });
  const ogImageUrl = buildRelayOgImageUrl({
    shareBy,
    shareUnit,
    relayDepth: sourceDepth,
    inviteTarget,
    inviteLabel,
    relayRelation,
    inviteNamed,
    shareId,
  });

  return {
    title: preview.title,
    description: preview.description,
    openGraph: {
      title: preview.title,
      description: preview.description,
      type: "website",
      locale: "zh_CN",
      siteName: "EVA-Covenant",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: preview.ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: preview.title,
      description: preview.description,
      images: [ogImageUrl],
    },
  };
}

export default function Home() {
  return <HomeClient />;
}
