import type { Metadata } from "next";
import { Suspense } from "react";
import { ShotsTool } from "@/components/tools/ShotsTool";

export const metadata: Metadata = { title: "Shot Planner" };

export default function ShotsPage() {
  return (
    <Suspense>
      <ShotsTool />
    </Suspense>
  );
}
