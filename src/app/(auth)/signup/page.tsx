import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, Notice } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/forms";
import { AUTH_NOT_CONFIGURED, getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Start planning Reels, TikToks and Shorts in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {!getSupabaseConfig() && <Notice tone="error">{AUTH_NOT_CONFIGURED}</Notice>}
        <SignupForm />
      </div>
    </AuthCard>
  );
}
