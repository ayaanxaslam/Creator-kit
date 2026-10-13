import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard, Notice } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/forms";
import { AUTH_NOT_CONFIGURED, getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Reset your password" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a link to choose a new password."
      footer={
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Back to log in
        </Link>
      }
    >
      <div className="space-y-4">
        {!getSupabaseConfig() && <Notice tone="error">{AUTH_NOT_CONFIGURED}</Notice>}
        <Suspense>
          <LinkError searchParams={searchParams} />
        </Suspense>
        <ForgotPasswordForm />
      </div>
    </AuthCard>
  );
}

async function LinkError({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;
  if (error !== "link") return null;
  return (
    <Notice tone="error">That reset link is invalid, expired, or was opened in a different browser. Request a new one below.</Notice>
  );
}
