import { logOut } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/supabase/server";
import { AccountLink } from "./AppShell";
import { LogOutIcon } from "./icons";

/** Signed-in user + log out button for the sidebar. Reads the session, so render it inside <Suspense>. */
export async function SidebarAccount() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <div className="flex items-center gap-1 border-t border-border pt-3">
      <AccountLink email={user.email} />
      <form action={logOut}>
        <button
          type="submit"
          aria-label="Log out"
          title="Log out"
          className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <LogOutIcon className="size-4" />
        </button>
      </form>
    </div>
  );
}
