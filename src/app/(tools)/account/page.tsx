import type { Metadata } from "next";
import { Suspense } from "react";
import { Notice } from "@/components/auth/AuthCard";
import { UpdatePasswordForm } from "@/components/auth/forms";
import { UserIcon } from "@/components/icons";
import { Button, Card } from "@/components/ui";
import { logOut } from "@/lib/auth-actions";
import { initialsFor } from "@/lib/initials";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function AccountPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <header className="mb-8">
        <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-accent">
          <UserIcon className="size-[18px]" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Account</h1>
        <p className="mt-1.5 text-[15px] text-muted">Manage your login details.</p>
      </header>

      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <Suspense fallback={<div className="h-12 w-60 animate-shimmer rounded bg-surface-2" />}>
            <AccountDetails />
          </Suspense>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Change password</h2>
          <p className="mb-5 mt-1 text-sm text-muted">Use at least 8 characters.</p>
          <Suspense>
            <ResetNotice searchParams={searchParams} />
          </Suspense>
          <UpdatePasswordForm />
        </Card>

        <Card className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Log out</h2>
            <p className="mt-1 text-sm text-muted">End your session on this device.</p>
          </div>
          <form action={logOut}>
            <Button type="submit" variant="secondary">
              Log out
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

async function AccountDetails() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <div className="flex items-center gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-inverse text-base font-semibold text-inverse-fg">
        {initialsFor(user.name, user.email)}
      </span>
      <div className="min-w-0">
        {user.name && <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>}
        <p className="break-all text-sm text-muted">{user.email}</p>
      </div>
    </div>
  );
}

async function ResetNotice({ searchParams }: { searchParams: SearchParams }) {
  const { reset } = await searchParams;
  if (!reset) return null;
  return (
    <div className="mb-5">
      <Notice tone="info">You opened a password reset link. Choose your new password below.</Notice>
    </div>
  );
}
