import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard, Notice } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/forms";
import { AUTH_NOT_CONFIGURED, getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Log in" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const MESSAGES: Record<string, { tone: "success" | "info" | "error"; text: string }> = {
  "logged-out": { tone: "info", text: "You've been logged out." },
  link: {
    tone: "error",
    text: "That link is invalid, expired, or was opened in a different browser. If you were confirming your email, try logging in — it may already be confirmed.",
  },
};

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthCard
      title="Welcome back"
      description="Log in to plan your next video."
      footer={
        <>
          New to CreatorKit?{" "}
          <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {!getSupabaseConfig() && <Notice tone="error">{AUTH_NOT_CONFIGURED}</Notice>}
        <Suspense fallback={<LoginForm />}>
          <LoginBody searchParams={searchParams} />
        </Suspense>
      </div>
    </AuthCard>
  );
}

/** Reads the URL (redirect target and status messages), so it streams in after the static shell. */
async function LoginBody({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const key = (typeof params.error === "string" && params.error) || (typeof params.message === "string" && params.message) || "";
  const message = MESSAGES[key];

  return (
    <div className="space-y-4">
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {next && !message && <Notice tone="info">Log in to continue.</Notice>}
      <LoginForm next={next} />
    </div>
  );
}
