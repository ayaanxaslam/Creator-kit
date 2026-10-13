import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_PATHS, DEFAULT_AFTER_LOGIN, PROTECTED_PATHS, getSupabaseConfig } from "@/lib/supabase/config";

const matches = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));

export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const isProtected = matches(pathname, PROTECTED_PATHS);
  const isAuthPage = matches(pathname, AUTH_PATHS);

  // If Supabase sent an email link to the site root (redirect URL not allow-listed),
  // finish the sign-in on the confirm route instead of dropping the code.
  if (pathname === "/" && searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/confirm";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  const config = getSupabaseConfig();

  let signedIn = false;
  if (config) {
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    });
    // Refreshes the session if needed and verifies the user's token.
    const { data } = await supabase.auth.getClaims();
    signedIn = !!data?.claims;
  }

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = params ? `?${new URLSearchParams(params)}` : "";
    const redirect = NextResponse.redirect(url);
    // Keep any refreshed auth cookies and no-cache headers
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    for (const key of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(key);
      if (value) redirect.headers.set(key, value);
    }
    return redirect;
  };

  if (isProtected && !signedIn) return redirectTo("/login", { next: `${pathname}${search}` });
  if (isAuthPage && signedIn) return redirectTo(DEFAULT_AFTER_LOGIN);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
