import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { AppHeaderUser, HeaderUserSkeleton } from "@/components/HeaderUser";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      userMenu={
        <Suspense fallback={<HeaderUserSkeleton />}>
          <AppHeaderUser />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
