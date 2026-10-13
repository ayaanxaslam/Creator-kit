import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/forms";

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
        <SignupForm />
      </div>
    </AuthCard>
  );
}
