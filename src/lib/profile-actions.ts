"use server";

import { profileSchema, type Profile } from "./schemas";
import { createClient } from "./supabase/server";

export type SaveProfileResult = { ok: true } | { ok: false; error: string; fieldErrors?: Partial<Record<keyof Profile, string>> };

/** Save the signed-in user's creator profile to their account. */
export async function saveProfile(profile: Profile): Promise<SaveProfileResult> {
  const parsed = profileSchema.safeParse(profile);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof Profile, string>> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as keyof Profile] ??= issue.message;
    return { ok: false, error: "Some answers are too long.", fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Couldn't save right now. Please try again." };

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { ok: false, error: "Your session has expired. Please log in again." };

  const { error } = await supabase.auth.updateUser({ data: { creator_profile: parsed.data } });
  if (error) {
    console.error("[CreatorKit] couldn't save profile:", error.code, error.message);
    return { ok: false, error: "Couldn't save right now. Please try again." };
  }
  return { ok: true };
}
