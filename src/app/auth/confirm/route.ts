import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for links in Supabase auth emails (sign-up confirmation and
 * password reset). Supports both the default `?code=` (PKCE) links and
 * `?token_hash=&type=` links from customised email templates.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));
  const isReset = type === "recovery" || next.startsWith("/account");

  const to = (path: string) => NextResponse.redirect(new URL(path, request.nextUrl.origin));

  const supabase = await createClient();
  if (supabase) {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return to(next);
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return to(type === "recovery" ? "/account?reset=1" : next);
    }
  }

  // Supabase also sends error details back on the link (e.g. expired links)
  return to(isReset ? "/forgot-password?error=link" : "/login?error=link");
}
