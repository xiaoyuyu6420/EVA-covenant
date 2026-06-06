import type { Metadata } from "next";
import HistoryClient from "@/components/HistoryClient";

export const metadata: Metadata = {
  title: "历史适格记录 | EVA 编队接力",
  description: "查看本机保存的 EVA 适格测试结果，并重新复制编队接力邀请。",
};

export default function HistoryPage() {
  return <HistoryClient />;
}
