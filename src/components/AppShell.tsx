"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TOOLS } from "@/lib/tools";
import { HomeIcon } from "./icons";
import { Logo } from "./Logo";
import { cn } from "./ui";

export function AppShell({ children, userMenu }: { children: ReactNode; userMenu: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh">
      {/* Desktop / tablet sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav aria-label="Tools" className="mt-8 flex flex-col gap-0.5">
          <p className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted">Tools</p>
          {TOOLS.map(({ href, name, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  active
                    ? "bg-background font-medium text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4 transition-colors", active ? "text-accent" : "text-muted group-hover:text-foreground")} />
                {name}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-muted">
          <span className="font-medium text-foreground">Tip:</span> every result is editable — click any text to tweak it before copying.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: logo on mobile, signed-in user menu on every size */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6 md:justify-end md:px-10">
          <div className="md:hidden">
            <Logo />
          </div>
          {userMenu}
        </header>

        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 md:px-10 md:pb-16 md:pt-8">{children}</main>

        {/* Mobile bottom navigation */}
        <nav
          aria-label="Tools"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
          {[{ href: "/", short: "Home", Icon: HomeIcon }, ...TOOLS].map(({ href, short, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "text-accent")} />
                {short}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
