import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="relative flex size-7 items-center justify-center rounded-lg bg-inverse text-inverse-fg shadow-sm transition-transform duration-200 group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
          <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.7L9.5 4.6A1 1 0 0 0 8 5.5Z" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent ring-2 ring-background" />
      </span>
      CreatorKit
    </Link>
  );
}
