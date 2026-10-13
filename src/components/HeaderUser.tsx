import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { UserMenu } from "./UserMenu";
import { buttonClass } from "./ui";

/** Placeholder with the same footprint while the session loads. */
export function HeaderUserSkeleton() {
  return <div className="size-9 rounded-full bg-surface-2" aria-hidden="true" />;
}

/** Top-right avatar menu for the app. Reads the session, so render it inside <Suspense>. */
export async function AppHeaderUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return <UserMenu name={user.name} email={user.email} />;
}

/** Landing page header actions: avatar + "Open app" when signed in, otherwise Log in / Sign up. */
export async function LandingHeaderActions() {
  const user = await getCurrentUser();
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/ideas" className={buttonClass("primary", "h-9 px-3.5")}>
          Open app
        </Link>
        <UserMenu name={user.name} email={user.email} />
      </div>
    );
  }
  return <LoggedOutActions />;
}

export function LoggedOutActions() {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link href="/login" className={buttonClass("ghost", "h-9 px-3")}>
        Log in
      </Link>
      <Link href="/signup" className={buttonClass("primary", "h-9 px-3.5")}>
        Sign up
      </Link>
    </div>
  );
}

/** Hero buttons: send signed-in users straight into the app. */
export async function LandingHeroActions() {
  const user = await getCurrentUser();
  if (user) {
    return (
      <Link href="/ideas" className={buttonClass("primary", "group h-11 w-full px-5 sm:w-auto")}>
        Open CreatorKit
      </Link>
    );
  }
  return <LoggedOutHeroActions />;
}

export function LoggedOutHeroActions() {
  return (
    <>
      <Link href="/signup" className={buttonClass("primary", "group h-11 w-full px-5 sm:w-auto")}>
        Create your account
      </Link>
      <Link href="/login" className={buttonClass("secondary", "h-11 w-full px-5 sm:w-auto")}>
        Log in
      </Link>
    </>
  );
}

/** Sign-up reassurance under the hero buttons, only for signed-out visitors. */
export async function LandingHeroNote() {
  if (await getCurrentUser()) return null;
  return <p className="mt-4 text-xs text-muted">All you need is an email and a password.</p>;
}
