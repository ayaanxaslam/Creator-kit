/**
 * Supabase connection settings, read on the server only (proxy, server
 * components, server actions, route handlers).
 *
 * Environment variable names vary a lot (NEXT_PUBLIC_ prefix or not, "anon" vs
 * "publishable", typos), so besides the usual names this also recognises the
 * values themselves: a https://<project>.supabase.co address, and a public
 * (anon / publishable) key. Secret / service_role keys are never used.
 */

/** This project's Supabase address — public, used only if no URL variable is found. */
const PROJECT_URL = "https://myejthadikowkebmeuxq.supabase.co";

const URL_NAMES = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "PUBLIC_SUPABASE_URL"];
const KEY_NAMES = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "PUBLIC_SUPABASE_ANON_KEY",
  "PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_PUBLIC_ANON_KEY",
  "SUPABASE_KEY",
];

/** Trim whitespace and surrounding quotes that sometimes get pasted into dashboards. */
function clean(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "").trim() || undefined;
}

function envEntries() {
  return Object.entries(process.env)
    .map(([name, value]) => [name, clean(value)] as const)
    .filter((entry): entry is readonly [string, string] => !!entry[1]);
}

/** Normalise to "https://<ref>.supabase.co" if the value is a Supabase project address. */
function asSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /\.supabase\.(co|in)$/i.test(url.hostname) ? url.origin : null;
  } catch {
    return null;
  }
}

function jwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0].startsWith("eyJ")) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4)));
  } catch {
    return null;
  }
}

/** A key that is safe to use with Row Level Security: anon JWT or sb_publishable_ key. */
function publicKeyInfo(value: string) {
  if (value.startsWith("sb_publishable_")) return { key: value, ref: null as string | null };
  const payload = jwtPayload(value);
  if (payload && payload.role === "anon" && (payload.iss === "supabase" || typeof payload.ref === "string")) {
    return { key: value, ref: typeof payload.ref === "string" ? payload.ref : null };
  }
  return null;
}

export function getSupabaseConfig() {
  const entries = envEntries();

  // 1. The key: known names first, then any variable holding a public Supabase key.
  let keyInfo: ReturnType<typeof publicKeyInfo> = null;
  for (const name of KEY_NAMES) {
    const value = clean(process.env[name]);
    if (value && (keyInfo = publicKeyInfo(value))) break;
  }
  if (!keyInfo) {
    for (const [, value] of entries) if ((keyInfo = publicKeyInfo(value))) break;
  }
  if (!keyInfo) return null;

  // 2. The URL: known names, then any variable holding a supabase.co address,
  //    then the project encoded in the key, then this project's address.
  let url: string | null = null;
  for (const name of URL_NAMES) {
    const value = clean(process.env[name]);
    if (value && (url = asSupabaseUrl(value))) break;
  }
  if (!url) {
    const candidates = entries.map(([, value]) => asSupabaseUrl(value)).filter((u): u is string => !!u);
    url = candidates.find((u) => keyInfo!.ref && u.startsWith(`https://${keyInfo!.ref}.`)) ?? candidates[0] ?? null;
  }
  url ??= keyInfo.ref ? `https://${keyInfo.ref}.supabase.co` : PROJECT_URL;

  return { url, key: keyInfo.key };
}

/** The OpenAI key: OPENAI_API_KEY, or any OPENAI-named variable holding an sk-… key. */
export function getOpenAIKey() {
  const direct = clean(process.env.OPENAI_API_KEY) ?? clean(process.env.OPENAI_KEY);
  if (direct) return direct;
  return envEntries().find(([name, value]) => /open_?ai/i.test(name) && value.startsWith("sk-"))?.[1];
}

export const AUTH_NOT_CONFIGURED = "Login isn't available right now. Please try again in a few minutes.";

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
