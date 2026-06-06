import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

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

export async function generateMetadata(
  { searchParams }: { searchParams: SearchParams }
): Promise<Metadata> {
  const params = await searchParams;
  const shareBy = cleanParam(params.share_by);
  const sourceDepth = cleanRelayDepth(params.relay_depth);

  if (!shareBy) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    };
  }

  const nextDepth = Math.min((sourceDepth ?? 1) + 1, 99);
  const title = "EVA 编队接力 | NERV-HQ";
  const description = `来自编队码 ${shareBy} 的接力邀请。完成测试后生成你的机体和第 ${nextDepth} 站编队码。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "zh_CN",
      siteName: "EVA-Covenant",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function Home() {
  return <HomeClient />;
}
