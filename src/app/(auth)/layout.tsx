import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Logo />
        <Link href="/" className="rounded-md px-2 py-1 text-sm text-muted transition-colors hover:text-foreground">
          Back to home
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:items-center sm:pt-0">{children}</main>
    </div>
  );
}
