"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";
import { cn } from "./ui";

async function writeClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for non-secure contexts (e.g. LAN IP during development)
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(el);
  if (!ok) throw new Error("Copy failed");
}

export function CopyButton({
  getText,
  label = "Copy",
  compact = false,
  className,
}: {
  getText: () => string;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await writeClipboard(getText());
      setState("copied");
    } catch {
      setState("error");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1800);
  }

  const text = state === "copied" ? "Copied" : state === "error" ? "Copy failed" : label;

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={compact ? text : undefined}
      title={compact ? text : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md text-xs font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        compact ? "size-7 justify-center" : "h-8 border border-border bg-background px-2.5 hover:border-border-strong hover:bg-surface-2",
        state === "copied" ? "text-accent-fg" : state === "error" ? "text-danger" : "text-muted hover:text-foreground",
        compact && "hover:bg-surface-2",
        className,
      )}
    >
      {state === "copied" ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      {!compact && <span aria-live="polite">{text}</span>}
    </button>
  );
}
