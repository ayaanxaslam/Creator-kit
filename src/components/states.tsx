"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertIcon, RefreshIcon } from "./icons";
import { Button, Card } from "./ui";

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-background text-muted shadow-sm">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry, retryable = true }: { message: string; onRetry?: () => void; retryable?: boolean }) {
  return (
    <div role="alert" className="animate-fade-up rounded-xl border border-danger/30 bg-danger-soft p-5">
      <div className="flex gap-3">
        <AlertIcon className="mt-0.5 size-5 shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">Generation failed</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{message}</p>
          {onRetry && retryable && (
            <Button variant="secondary" className="mt-4 h-9" onClick={onRetry}>
              <RefreshIcon className="size-3.5" />
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoadingState({ messages, rows = 4 }: { messages: string[]; rows?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 2600);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div aria-busy="true" aria-live="polite" className="space-y-3">
      <div className="flex items-center gap-2.5 text-sm text-muted">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-accent" />
        </span>
        <span key={i} className="animate-fade-up">
          {messages[i]}
        </span>
      </div>
      {Array.from({ length: rows }).map((_, n) => (
        <Card key={n} className="p-5">
          <div className="animate-shimmer space-y-3" style={{ animationDelay: `${n * 120}ms` }}>
            <div className="h-3.5 w-2/5 rounded bg-surface-2" />
            <div className="h-3 w-full rounded bg-surface-2" />
            <div className="h-3 w-4/5 rounded bg-surface-2" />
          </div>
        </Card>
      ))}
    </div>
  );
}
