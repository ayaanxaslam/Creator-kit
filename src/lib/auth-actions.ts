"use server";

import { isAuthError, type AuthError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AUTH_NOT_CONFIGURED, DEFAULT_AFTER_LOGIN, safeNext } from "./supabase/config";
import { createClient } from "./supabase/server";

export interface AuthFormState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  email?: string;
  name?: string;
}

const email = z.string().trim().min(1, "Email is required.").email("Enter a valid email address.").max(254);
const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.");

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}

/** Turn Supabase auth errors into friendly messages. */
function authMessage(error: AuthError) {
  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "Please confirm your email first. Check your inbox for the confirmation link.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try logging in instead.";
    case "weak_password":
      return error.message || "That password is too weak. Try a longer one.";
    case "same_password":
      return "Your new password must be different from your current one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "signup_disabled":
      return "New sign-ups are currently disabled.";
    case "session_not_found":
    case "session_expired":
      return "Your session has expired. Please log in again.";
  }
  if (error.name === "AuthRetryableFetchError") return "Couldn't reach the login service. Check your connection and try again.";
  if (/invalid api key/i.test(error.message)) {
    return "Login is misconfigured: the Supabase anon key is invalid. Check SUPABASE_ANON_KEY in your environment variables and redeploy.";
  }
  console.error("[CreatorKit] auth error:", error.code, error.message);
  return "Something went wrong. Please try again.";
}

/** The site's public origin, used to build links in auth emails. */
async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function logIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = z
    .object({ email, password: z.string().min(1, "Password is required.") })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  const typedEmail = String(formData.get("email") ?? "");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), email: typedEmail };

  const supabase = await createClient();
  if (!supabase) return { error: AUTH_NOT_CONFIGURED, email: typedEmail };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authMessage(error), email: typedEmail };

  redirect(safeNext(String(formData.get("next") ?? "")));
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Name is required.").max(60, "Name must be 60 characters or fewer."),
      email,
      password: newPassword,
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match." })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirm: formData.get("confirm"),
    });
  const typedEmail = String(formData.get("email") ?? "");
  const typedName = String(formData.get("name") ?? "");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), email: typedEmail, name: typedName };

  const supabase = await createClient();
  if (!supabase) return { error: AUTH_NOT_CONFIGURED, email: typedEmail };

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(DEFAULT_AFTER_LOGIN)}`,
    },
  });
  if (error) return { error: authMessage(error), email: typedEmail, name: typedName };

  // Email confirmation turned off in Supabase: the user is signed in straight away.
  if (data.session) redirect(DEFAULT_AFTER_LOGIN);

  return {
    success: `We've sent a confirmation link to ${parsed.data.email}. Open it to activate your account, then log in.`,
    email: typedEmail,
  };
}

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = z.object({ email }).safeParse({ email: formData.get("email") });
  const typedEmail = String(formData.get("email") ?? "");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), email: typedEmail };

  const supabase = await createClient();
  if (!supabase) return { error: AUTH_NOT_CONFIGURED, email: typedEmail };

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent("/account?reset=1")}`,
  });
  // Don't reveal whether an account exists — only surface rate limits / outages.
  if (error && (error.status === 429 || error.name === "AuthRetryableFetchError")) {
    return { error: authMessage(error), email: typedEmail };
  }
  if (error) console.error("[CreatorKit] reset error:", error.code, error.message);

  return {
    success: `If an account exists for ${parsed.data.email}, you'll get an email with a link to reset your password.`,
    email: typedEmail,
  };
}

export async function updatePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = z
    .object({ password: newPassword, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match." })
    .safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  if (!supabase) return { error: AUTH_NOT_CONFIGURED };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: isAuthError(error) ? authMessage(error) : "Something went wrong. Please try again." };

  return { success: "Your password has been updated." };
}

export async function logOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/login?message=logged-out");
}
