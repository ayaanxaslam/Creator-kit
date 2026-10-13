"use client";

import { useRef, type FormEvent, type ReactNode } from "react";
import { RefreshIcon, SparkleIcon } from "./icons";
import { Button, Card, Spinner } from "./ui";

export function ToolPage({
  icon,
  title,
  description,
  form,
  results,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  form: ReactNode;
  results: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <header className="mb-8">
        <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-accent">{icon}</div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-8">
        <div className="lg:sticky lg:top-10 lg:self-start">{form}</div>
        <section id="results" aria-label="Results" className="min-w-0 scroll-mt-20">
          {results}
        </section>
      </div>
    </div>
  );
}

export function ToolForm({
  onSubmit,
  loading,
  hasResult,
  children,
}: {
  onSubmit: () => void;
  loading: boolean;
  hasResult: boolean;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handle(e: FormEvent) {
    e.preventDefault();
    onSubmit();
    requestAnimationFrame(() => {
      // Move focus to the first invalid field once errors have rendered
      const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (invalid) return invalid.focus();
      // On stacked (mobile/tablet) layouts, bring the results into view
      if (window.matchMedia("(max-width: 1023px)").matches) {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
  return (
    <Card className="p-5 sm:p-6">
      <form ref={formRef} onSubmit={handle} noValidate className="space-y-5">
        {children}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Spinner /> Generating…
            </>
          ) : hasResult ? (
            <>
              <RefreshIcon className="size-4" /> Regenerate
            </>
          ) : (
            <>
              <SparkleIcon className="size-4" /> Generate
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}

export function ResultsToolbar({
  title,
  meta,
  onRegenerate,
  loading,
  actions,
}: {
  title: string;
  meta?: string;
  onRegenerate: () => void;
  loading: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-foreground">{title}</h2>
        {meta && <p className="text-xs text-muted">{meta}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" className="h-8 px-2.5 text-xs" onClick={onRegenerate} disabled={loading}>
          <RefreshIcon className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
          Regenerate
        </Button>
        {actions}
      </div>
    </div>
  );
}
