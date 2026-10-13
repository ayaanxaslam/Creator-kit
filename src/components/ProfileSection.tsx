import { getProfile } from "@/lib/profile";
import { ProfileCard } from "./ProfileCard";

export { ProfileSkeleton } from "./ProfileCard";

/** Loads the user's saved creator profile. Reads the session, so render it inside <Suspense>. */
export async function ProfileSection({ collapsible = false }: { collapsible?: boolean }) {
  const profile = await getProfile();
  return <ProfileCard initial={profile} collapsible={collapsible} />;
}
