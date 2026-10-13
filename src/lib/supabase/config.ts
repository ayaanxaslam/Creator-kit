/**
 * Supabase connection settings. Accepts the common variable names used by the
 * Supabase dashboard and the Vercel ↔ Supabase integration. Only read on the
 * server (proxy, server components, server actions, route handlers).
 */
export function getSupabaseConfig() {
  const url = firstEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "PUBLIC_SUPABASE_URL");
  const key = firstEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
    "PUBLIC_SUPABASE_ANON_KEY",
    "PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_PUBLIC_ANON_KEY",
    "SUPABASE_KEY",
  );
  return url && key ? { url, key } : null;
}

function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

export const AUTH_NOT_CONFIGURED =
  "Login isn't configured yet. Set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables and redeploy.";

/** Pages that require a signed-in user. */
export const PROTECTED_PATHS = ["/ideas", "/script", "/shots", "/saved", "/account"];

/** Pages only meant for signed-out users. */
export const AUTH_PATHS = ["/login", "/signup", "/forgot-password"];

export const DEFAULT_AFTER_LOGIN = "/ideas";

/** Only allow same-site relative redirects (blocks open redirects like //evil.com). */
export function safeNext(value: string | null | undefined, fallback = DEFAULT_AFTER_LOGIN) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
