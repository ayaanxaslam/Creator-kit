import type { Metadata } from "next";
import { Suspense } from "react";
import { ScriptTool } from "@/components/tools/ScriptTool";

export const metadata: Metadata = { title: "Script Generator" };

export default function ScriptPage() {
  return (
    <Suspense>
      <ScriptTool />
    </Suspense>
  );
}
