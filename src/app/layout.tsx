import type { Metadata, Viewport } from "next";
import { Noto_Serif_SC, Share_Tech_Mono, Teko, JetBrains_Mono } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const notoSerif = Noto_Serif_SC({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-tech",
  subsets: ["latin"],
  weight: "400",
});

const teko = Teko({
  variable: "--font-num",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const title = "EVA 驾驶员适格测试 | NERV-HQ";
const description = "NERV紧急征召——你的适格率是多少？15维度心理测绘，24种人格匹配，测出你的EVA驾驶员类型。新世纪福音战士人格测试";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title,
  description,
  keywords: ["EVA", "新世纪福音战士", "人格测试", "适格者", "NERV", "驾驶员", "personality test", "Evangelion"],
  authors: [{ name: "NERV-HQ" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title,
    description,
    type: "website",
    locale: "zh_CN",
    alternateLocale: ["en_US", "ja_JP", "ko_KR"],
    siteName: "EVA-Covenant",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSerif.variable} ${shareTechMono.variable} ${teko.variable} ${jetbrainsMono.variable} h-dvh antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="min-h-dvh overscroll-none bg-[#0a0a0a]">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
