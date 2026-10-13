import { createServerClient } from "@supabase/ssr";
import { connection } from "next/server";
import { getOpenAIKey, getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Setup check for the site owner: reports whether the server can see its
 * settings and the saved-items table (yes/no only, never the values),
 * e.g. https://your-site.vercel.app/api/health
 */
export async function GET() {
  await connection(); // evaluate at request time, not at build
  const supabase = getSupabaseConfig();

  let database = "unknown (login not configured)";
  if (supabase) {
    const client = createServerClient(supabase.url, supabase.key, { cookies: { getAll: () => [] } });
    const { error } = await client.from("generations").select("id").limit(1);
    database = !error
      ? "ready"
      : error.code === "PGRST205" || error.code === "42P01" || /could not find the table/i.test(error.message)
        ? "table missing — run the SQL in supabase/migrations"
        : /invalid api key/i.test(error.message)
          ? "Supabase rejected the anon key"
          : `error (${error.code ?? "unknown"})`;
  }

  return Response.json(
    {
      login: supabase ? "configured" : "missing Supabase URL / anon key",
      supabaseProject: supabase ? new URL(supabase.url).hostname.split(".")[0] : null,
      database,
      ai: getOpenAIKey() ? "configured" : "missing OpenAI key",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
