import type { Metadata } from "next";
import { IdeasTool } from "@/components/tools/IdeasTool";

export const metadata: Metadata = { title: "Video Idea Generator" };

export default function IdeasPage() {
  return <IdeasTool />;
}
