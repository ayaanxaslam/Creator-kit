import "server-only";

import { EMPTY_PROFILE, profileSchema, type Profile } from "./schemas";
import { createClient } from "./supabase/server";

/**
 * The signed-in user's creator profile (bio, who they help, their message).
 * Stored in their Supabase account (user metadata), so no extra table is needed.
 * Read fresh from Supabase rather than the session token, which can lag behind edits.
 */
export async function getProfile(): Promise<Profile> {
  try {
    const supabase = await createClient();
    if (!supabase) return EMPTY_PROFILE;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return EMPTY_PROFILE;
    const parsed = profileSchema.safeParse(data.user.user_metadata?.creator_profile ?? {});
    return parsed.success ? { ...EMPTY_PROFILE, ...parsed.data } : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

/** Prompt section describing the creator, or "" if they haven't filled anything in. */
export function profilePrompt(profile: Profile) {
  const lines = [
    profile.bio && `About the creator: ${profile.bio}`,
    profile.helps && `Who they are trying to help: ${profile.helps}`,
    profile.message && `The messages they want their content to get across: ${profile.message}`,
  ].filter(Boolean);
  if (lines.length === 0) return "";
  return `\n\nCreator profile — write in a way that fits this creator, speaks to the people they help and carries their messages:\n${lines.join("\n")}`;
}
