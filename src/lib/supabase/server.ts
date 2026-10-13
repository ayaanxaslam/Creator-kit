import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { getSupabaseConfig } from "./config";

/** Create a per-request Supabase client bound to the request's auth cookies. */
export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: the proxy refreshes sessions on every request.
        }
      },
    },
  });
}

/** The signed-in user's id, email and name, or null. Deduplicated within a request. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const metadata = (data.claims.user_metadata ?? {}) as { full_name?: unknown };
  return {
    id: data.claims.sub,
    email: (data.claims.email as string | undefined) ?? "",
    name: typeof metadata.full_name === "string" ? metadata.full_name : "",
  };
});
