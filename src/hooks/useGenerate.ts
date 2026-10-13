"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Error codes where retrying the same request can't help. */
export const NON_RETRYABLE = ["not_configured", "validation", "unauthorized", "not_found"];

type Status = "idle" | "loading" | "success" | "error";

/** Whether the current result is stored in the user's account. */
export type SaveState = "none" | "saved" | "saving" | "error" | "not_set_up";

interface ApiError {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

interface SaveMeta {
  id?: string | null;
  saved?: boolean;
  saveError?: "not_set_up" | "failed";
}

const AUTOSAVE_DELAY = 800;

/**
 * Posts form input to a generation endpoint and tracks loading/error/result
 * state. Results are saved to the user's account by the API; edits made with
 * `edit()` are auto-saved, and `load()` reopens a saved result.
 */
export function useGenerate<TInput, TOutput extends object>(endpoint: string) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<TOutput | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("none");
  const controller = useRef<AbortController | null>(null);
  const dirty = useRef(false);

  const generate = useCallback(
    async (input: TInput) => {
      controller.current?.abort();
      const ac = new AbortController();
      controller.current = ac;

      setStatus("loading");
      setError(null);
      setFieldErrors({});

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: ac.signal,
        });
        const json = (await res.json().catch(() => ({}))) as TOutput & ApiError & SaveMeta;

        if (!res.ok) {
          setFieldErrors(json.fieldErrors ?? {});
          setError({ message: json.error ?? `Request failed (${res.status}). Please try again.`, code: json.code });
          setStatus("error");
          return;
        }
        const { id, saved, saveError, ...output } = json;
        dirty.current = false;
        setData(output as unknown as TOutput);
        setSavedId(id ?? null);
        setSaveState(saved ? "saved" : saveError === "not_set_up" ? "not_set_up" : saveError ? "error" : "none");
        setStatus("success");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError({ message: "Network error — check your connection and try again.", code: "network" });
        setStatus("error");
      }
    },
    [endpoint],
  );

  /** Reopen a saved result. Resolves with its original input so the form can be filled in. */
  const load = useCallback(async (id: string): Promise<TInput | null> => {
    controller.current?.abort();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`/api/generations/${encodeURIComponent(id)}`);
      const json = (await res.json().catch(() => ({}))) as ApiError & { input?: TInput; output?: TOutput };
      if (!res.ok || !json.output) {
        setError({ message: json.error ?? "Couldn't open that saved item.", code: json.code });
        setStatus("error");
        return null;
      }
      dirty.current = false;
      setData(json.output);
      setSavedId(id);
      setSaveState("saved");
      setStatus("success");
      return json.input ?? null;
    } catch {
      setError({ message: "Network error — check your connection and try again.", code: "network" });
      setStatus("error");
      return null;
    }
  }, []);

  /** Apply a user edit to the current result; it's saved to their account automatically. */
  const edit = useCallback((fn: (current: TOutput) => TOutput) => {
    dirty.current = true;
    setData((d) => (d ? fn(d) : d));
  }, []);

  // Debounced auto-save of edits
  useEffect(() => {
    if (!dirty.current || !savedId || !data) return;
    setSaveState("saving");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/generations/${encodeURIComponent(savedId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ output: data }),
        });
        dirty.current = false;
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [data, savedId]);

  return { status, data, error, fieldErrors, setFieldErrors, generate, load, edit, saveState };
}
