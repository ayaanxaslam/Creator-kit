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

/** Save the profile to the signed-in user's account. Returns false if it couldn't be saved. */
export async function persistProfile(profile: Profile) {
  const supabase = await createClient();
  if (!supabase) return false;
  const { error } = await supabase.auth.updateUser({ data: { creator_profile: profile } });
  if (error) console.error("[CreatorKit] couldn't save profile:", error.code, error.message);
  return !error;
}

const sameProfile = (a: Profile, b: Profile) => a.bio === b.bio && a.helps === b.helps && a.message === b.message;

/**
 * The profile to generate with. Prefers the one sent from the page (what the
 * user sees, even if auto-save hasn't finished) and saves it if it changed;
 * otherwise uses the one saved in their account.
 */
export async function resolveProfile(fromRequest: unknown): Promise<Profile> {
  const saved = await getProfile();
  const parsed = profileSchema.safeParse(fromRequest);
  if (!parsed.success) return saved;
  if (!sameProfile(parsed.data, saved)) await persistProfile(parsed.data);
  return parsed.data;
}

export function hasProfile(profile: Profile) {
  return !!(profile.bio || profile.helps || profile.message);
}

const RULES = {
  ideas: [
    "Build every idea around this creator. Each idea must clearly help the people they are trying to help and carry one of the creator's own messages.",
    "The \"message\" field of each idea must state which of the creator's messages that video gets across, applied to its topic — not a generic takeaway.",
    "Use their background and experience to make ideas only this creator could make: draw on their story, expertise and point of view, and use it for credibility in hooks where it fits.",
    "If this batch's niche or target audience is narrower or different from the profile, follow the batch for topic and audience, but keep the creator's voice and messages.",
  ],
  script: [
    "Write the script in this creator's own voice, in the first person, drawing on their background and experience where it adds credibility.",
    "The script must land at least one of the creator's messages clearly, and the ending and call to action must speak directly to the people they are trying to help.",
  ],
  shots: [
    "Plan shots that suit this creator and their story — show them, their setting, process or expertise where it fits — and make the visuals reinforce the creator's messages.",
    "Keep everything realistic for this creator to film themselves.",
  ],
} as const;

/**
 * Wrap a task prompt with the creator profile: the profile goes first so the
 * model treats it as the foundation, and tool-specific rules go last so they
 * are applied to the output. Returns the task unchanged if the profile is empty.
 */
export function withProfile(tool: keyof typeof RULES, profile: Profile, task: string) {
  if (!hasProfile(profile)) return task;
  const lines = [
    profile.bio && `About the creator (their bio): ${profile.bio}`,
    profile.helps && `Who they are trying to help: ${profile.helps}`,
    profile.message && `The messages they want their content to get across: ${profile.message}`,
  ].filter(Boolean);
  return `<creator_profile>
This is the creator you are working for. Everything you write must be built around this information.
${lines.join("\n")}
</creator_profile>

${task}

Creator profile rules (these are essential):
${RULES[tool].map((r) => `- ${r}`).join("\n")}`;
}
