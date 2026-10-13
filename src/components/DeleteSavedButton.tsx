"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrashIcon } from "./icons";
import { Spinner, cn } from "./ui";

export function DeleteSavedButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirm" | "deleting" | "error">("idle");

  async function remove() {
    setState("deleting");
    try {
      const res = await fetch(`/api/generations/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error();
      router.refresh();
    } catch {
      setState("error");
    }
  }

  if (state === "confirm" || state === "deleting") {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={remove}
          disabled={state === "deleting"}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-danger px-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state === "deleting" ? <Spinner className="size-3" /> : null}
          Delete
        </button>
        <button
          type="button"
          onClick={() => setState("idle")}
          disabled={state === "deleting"}
          className="h-8 rounded-md px-2 text-xs font-medium text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setState("confirm")}
      aria-label={`Delete “${title}”`}
      title={state === "error" ? "Couldn't delete — try again" : "Delete"}
      className={cn(
        "flex size-8 items-center justify-center rounded-md transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        state === "error" ? "text-danger" : "text-muted hover:text-foreground",
      )}
    >
      <TrashIcon className="size-4" />
    </button>
  );
}
