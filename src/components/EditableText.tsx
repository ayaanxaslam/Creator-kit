"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "./ui";

/**
 * A textarea styled to look like plain text. It grows with its content so
 * generated results read naturally but can be edited in place.
 */
export function EditableText({
  value,
  onChange,
  label,
  className,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      aria-label={label}
      placeholder={placeholder}
      spellCheck
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "block w-full resize-none overflow-hidden rounded-md bg-transparent px-1.5 py-1 -mx-1.5 leading-relaxed text-foreground",
        "transition-colors hover:bg-surface-2 focus:bg-surface-2 focus:outline-none focus:ring-1 focus:ring-border-strong",
        "placeholder:text-muted/60",
        className,
      )}
    />
  );
}
