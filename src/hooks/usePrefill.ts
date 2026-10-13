"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/schemas";

interface Prefill {
  input: Record<string, string> | null;
  profile: Profile;
}

/**
 * Loads the user's saved creator profile and the values they last generated
 * with for this tool. When `fillForm` is on, it fills the form with those
 * values (and "who you help" as the target audience) so they don't have to
 * retype them. Only fields that are still empty / untouched are filled.
 */
export function usePrefill<T extends Record<string, string>>({
  tool,
  fillForm,
  fields,
  defaults,
  setValues,
  audienceMax,
}: {
  tool: "ideas" | "script" | "shots";
  fillForm: boolean;
  /** Fields that may be pre-filled from the last generation. */
  fields: (keyof T)[];
  /** The form's initial values, used to tell whether a field is untouched. */
  defaults: T;
  setValues: (update: (current: T) => T) => void;
  /** If set, an empty "audience" field is filled from the profile, trimmed to this length. */
  audienceMax?: number;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch(`/api/prefill?tool=${tool}`, { signal: ac.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Prefill>) : null))
      .then((prefill) => {
        setProfile(prefill?.profile ?? { bio: "", helps: "", message: "" });
        if (!prefill || !fillForm) return;
        setValues((current) => {
          const next = { ...current };
          for (const field of fields) {
            const value = prefill.input?.[field as string];
            if (typeof value === "string" && value && current[field] === defaults[field]) {
              next[field] = value as T[keyof T];
            }
          }
          if (audienceMax && "audience" in next && !next.audience && prefill.profile?.helps) {
            (next as Record<string, string>).audience = prefill.profile.helps.slice(0, audienceMax);
          }
          return next;
        });
      })
      .catch((err) => {
        if ((err as Error).name !== "AbortError") setProfile({ bio: "", helps: "", message: "" });
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per form (forms remount on new URLs)
  }, []);

  return { profile };
}
