"use client";

import { useSyncExternalStore } from "react";
import type { Profile } from "./schemas";

/**
 * The creator profile as currently shown on screen (including edits that are
 * still being auto-saved), so generation always uses what the user sees.
 */
let current: Profile | null = null;
const listeners = new Set<() => void>();

export function setCurrentProfile(profile: Profile) {
  current = profile;
  listeners.forEach((l) => l());
}

export function getCurrentProfile() {
  return current;
}

export function useCurrentProfile() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => null,
  );
}
