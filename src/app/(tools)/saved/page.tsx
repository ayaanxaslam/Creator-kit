import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DeleteSavedButton } from "@/components/DeleteSavedButton";
import { BookmarkIcon } from "@/components/icons";
import { EmptyState } from "@/components/states";
import { Card, cn } from "@/components/ui";
import { StorageNotSetUpError, listGenerations, type Tool } from "@/lib/generations";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = { title: "Saved" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TOOL_LABELS: Record<Tool, string> = { ideas: "Ideas", script: "Script", shots: "Shot list" };
const FILTERS: { value: Tool | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ideas", label: "Ideas" },
  { value: "script", label: "Scripts" },
  { value: "shots", label: "Shot lists" },
];

export default function SavedPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-4xl animate-fade-up">
      <header className="mb-6">
        <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-accent">
          <BookmarkIcon className="size-[18px]" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Saved</h1>
        <p className="mt-1.5 text-[15px] text-muted">Everything you generate is saved here automatically, including your edits.</p>
      </header>
      <Suspense fallback={<SavedSkeleton />}>
        <SavedList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function SavedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[72px] animate-shimmer rounded-xl border border-border bg-surface" />
      ))}
    </div>
  );
}

async function SavedList({ searchParams }: { searchParams: SearchParams }) {
  const { tool: rawTool } = await searchParams;
  const tool = FILTERS.some((f) => f.value === rawTool && f.value !== "all") ? (rawTool as Tool) : undefined;

  let items;
  try {
    items = await listGenerations(tool);
  } catch (err) {
    const notSetUp = err instanceof StorageNotSetUpError;
    return (
      <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-5 text-sm leading-relaxed">
        <p className="font-semibold text-foreground">{notSetUp ? "Saving isn't set up yet" : "Couldn't load your saved items"}</p>
        <p className="mt-1 text-muted">
          {notSetUp
            ? "The database table for saved items hasn't been created. Run the SQL file from supabase/migrations in the Supabase SQL Editor."
            : "Please refresh the page to try again."}
        </p>
      </div>
    );
  }

  return (
    <>
      <nav aria-label="Filter saved items" className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = (f.value === "all" && !tool) || f.value === tool;
          return (
            <Link
              key={f.value}
              href={f.value === "all" ? "/saved" : `/saved?tool=${f.value}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active ? "border-inverse bg-inverse text-inverse-fg" : "border-border text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <EmptyState
          icon={<BookmarkIcon className="size-5" />}
          title={tool ? `No saved ${FILTERS.find((f) => f.value === tool)?.label.toLowerCase()} yet` : "Nothing saved yet"}
          description="Generate ideas, scripts or shot lists and they'll appear here automatically."
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const toolInfo = TOOLS.find((t) => t.href === `/${item.tool}`);
            const Icon = toolInfo?.Icon ?? BookmarkIcon;
            return (
              <li key={item.id}>
                <Card className="group flex items-center gap-3 p-3 transition-all duration-200 hover:border-border-strong hover:shadow-sm sm:gap-4 sm:p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors group-hover:text-accent">
                    <Icon className="size-4" />
                  </span>
                  <Link href={`/${item.tool}?id=${item.id}`} className="min-w-0 flex-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <p className="truncate text-sm font-medium text-foreground">{item.title || "Untitled"}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {TOOL_LABELS[item.tool]} · <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                    </p>
                  </Link>
                  <DeleteSavedButton id={item.id} title={item.title} />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
