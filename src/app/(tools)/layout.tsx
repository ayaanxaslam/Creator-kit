import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { SidebarAccount } from "@/components/SidebarAccount";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      account={
        <Suspense fallback={<div className="h-[49px] border-t border-border" />}>
          <SidebarAccount />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
