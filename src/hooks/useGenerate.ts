"use client";

import { useCallback, useRef, useState } from "react";

/** Error codes where retrying the same request can't help. */
export const NON_RETRYABLE = ["not_configured", "validation", "unauthorized"];

type Status = "idle" | "loading" | "success" | "error";

interface ApiError {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

/** Posts form input to a generation endpoint and tracks loading/error/result state. */
export function useGenerate<TInput, TOutput>(endpoint: string) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<TOutput | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const controller = useRef<AbortController | null>(null);

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
        const json = (await res.json().catch(() => ({}))) as TOutput & ApiError;

        if (!res.ok) {
          setFieldErrors(json.fieldErrors ?? {});
          setError({ message: json.error ?? `Request failed (${res.status}). Please try again.`, code: json.code });
          setStatus("error");
          return;
        }
        setData(json);
        setStatus("success");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError({ message: "Network error — check your connection and try again.", code: "network" });
        setStatus("error");
      }
    },
    [endpoint],
  );

  return { status, data, setData, error, fieldErrors, setFieldErrors, generate };
}
