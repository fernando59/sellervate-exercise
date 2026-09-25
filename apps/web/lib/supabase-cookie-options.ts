import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Session cookie options shared by the per-request client (server/supabase) and
 * proxy.ts. They must match: if the proxy refreshed the token with different
 * options, the cookie would be downgraded to one page scripts can read.
 *
 * httpOnly because the browser never talks to Supabase; the library defaults to
 * httpOnly: false so that browser clients can read the session.
 *
 * Lives outside server/ because proxy.ts imports it, and everything in server/
 * is marked server-only.
 */
export const SUPABASE_COOKIE_OPTIONS: CookieOptionsWithName = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};
