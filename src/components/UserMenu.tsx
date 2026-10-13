"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { logOut } from "@/lib/auth-actions";
import { initialsFor } from "@/lib/initials";
import { LogOutIcon, UserIcon } from "./icons";
import { cn } from "./ui";

/** Initials avatar in the top-right corner that opens an account menu. */
export function UserMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = initialsFor(name, email);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${name || email}`}
        title={name || email}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-full bg-inverse text-[13px] font-semibold tracking-wide text-inverse-fg transition-all duration-150",
          "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          open && "ring-2 ring-accent ring-offset-2 ring-offset-background",
        )}
      >
        {initials}
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-accent ring-2 ring-background" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-11 z-50 w-64 origin-top-right animate-fade-up overflow-hidden rounded-xl border border-border bg-background shadow-lg shadow-black/10"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-accent-fg">Logged in</p>
            {name && <p className="mt-1 truncate text-sm font-medium text-foreground">{name}</p>}
            <p className="truncate text-xs text-muted" title={email}>
              {email}
            </p>
          </div>
          <div className="p-1">
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
            >
              <UserIcon className="size-4 text-muted" />
              Account
            </Link>
            <form action={logOut}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
              >
                <LogOutIcon className="size-4 text-muted" />
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
