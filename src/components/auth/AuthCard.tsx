import type { ReactNode } from "react";

export function AuthCard({ title, description, children, footer }: { title: string; description?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="rounded-xl border border-border bg-background p-6 shadow-sm">{children}</div>
      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}

export function Notice({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-danger/30 bg-danger-soft text-foreground",
    success: "border-accent/30 bg-accent-soft text-foreground",
    info: "border-border bg-surface text-foreground",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`animate-fade-up rounded-lg border px-3.5 py-3 text-sm leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}
