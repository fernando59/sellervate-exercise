import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * A Supabase client for the current request, authenticated as whoever owns the
 * session cookie. Every query runs with that user's JWT, so RLS always applies.
 * There is deliberately no service_role client anywhere in the app.
 *
 * Create one per request (never share it at module level): it carries that
 * request's cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // The browser never talks to Supabase, so page scripts have no reason to
      // read the session. The library defaults to httpOnly: false for browser
      // clients; keep this in sync with proxy.ts.
      cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. The proxy refreshes the
            // session on every request, so a refresh lost here is not needed.
          }
        },
      },
    },
  );
}
