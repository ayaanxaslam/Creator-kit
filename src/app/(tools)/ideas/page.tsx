import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileSection, ProfileSkeleton } from "@/components/ProfileSection";
import { IdeasTool } from "@/components/tools/IdeasTool";

export const metadata: Metadata = { title: "Video Idea Generator" };

export default function IdeasPage() {
  return (
    <Suspense>
      <IdeasTool
        profile={
          <Suspense fallback={<ProfileSkeleton />}>
            <ProfileSection collapsible />
          </Suspense>
        }
      />
    </Suspense>
  );
}
