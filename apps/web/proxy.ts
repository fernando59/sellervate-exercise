import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_COOKIE_OPTIONS } from "@/lib/supabase-cookie-options";

/**
 * Keeps the Supabase session fresh: if the access token has expired, getUser()
 * refreshes it and the new cookies go out on this response. Server Components
 * cannot write cookies, so without this a session would silently die after an
 * hour.
 *
 * This is not an authorization layer. Pages, route handlers and server actions
 * check access themselves (server/auth), and RLS checks it again in Postgres.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: SUPABASE_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Forward the refreshed cookies to the rendering of this request and
          // to the browser.
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          // Cache-Control: no-store and friends, so a CDN never caches a response
          // that carries someone's session.
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    },
  );

  // Validates the token against Supabase Auth and refreshes it if needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
