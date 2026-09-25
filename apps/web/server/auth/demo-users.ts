import "server-only";

import { createClient } from "@/server/supabase/server";

/**
 * The five seed people the user switcher offers. The list is fixed here rather
 * than read from the database because a visitor without a session (anon) can
 * read nothing. It only picks who to sign in as: what that person may see still
 * comes from brand_memberships and RLS. The ids are the seed's auth.users ids.
 */
export const DEMO_PEOPLE = [
  { key: "marta", id: "a0000000-0000-4000-8000-000000000001", email: "marta@sellervate.test", name: "Marta Ruiz", summary: "Lead · Voltra, Boxwell" },
  { key: "nuria", id: "a0000000-0000-4000-8000-000000000002", email: "nuria@sellervate.test", name: "Nuria Vidal", summary: "Lead · Hebra" },
  { key: "dani", id: "a0000000-0000-4000-8000-000000000003", email: "dani@sellervate.test", name: "Dani Ortega", summary: "Specialist · Voltra, Boxwell" },
  { key: "leo", id: "a0000000-0000-4000-8000-000000000004", email: "leo@sellervate.test", name: "Leo Marín", summary: "Specialist · Voltra, Hebra" },
  { key: "sara", id: "a0000000-0000-4000-8000-000000000005", email: "sara@sellervate.test", name: "Sara Campos", summary: "Specialist · Boxwell, Hebra" },
] as const;

export type DemoPerson = (typeof DEMO_PEOPLE)[number];
export type DemoPersonKey = DemoPerson["key"];

export function findDemoPerson(key: unknown): DemoPerson | undefined {
  return DEMO_PEOPLE.find((p) => p.key === key);
}

/**
 * The seed password comes from a server-only variable, never from a constant or
 * a NEXT_PUBLIC_ variable. Without it the switcher is disabled. In a real
 * deployment it would not exist at all (see DECISIONS.md).
 */
export function isDemoLoginEnabled(): boolean {
  return Boolean(process.env.DEMO_USER_PASSWORD);
}

export type DemoSignInResult = { ok: true } | { ok: false; error: string };

/**
 * Signs in as a seed person on the server. @supabase/ssr stores the session in
 * httpOnly cookies on the response, so the browser never sees the password or
 * handles tokens itself.
 */
export async function signInAsDemoPerson(key: unknown): Promise<DemoSignInResult> {
  const person = findDemoPerson(key);
  if (!person) return { ok: false, error: "Unknown person." };

  const password = process.env.DEMO_USER_PASSWORD;
  if (!password) return { ok: false, error: "Demo sign-in is disabled: DEMO_USER_PASSWORD is not set." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: person.email, password });
  if (error) return { ok: false, error: "Could not sign in. Run pnpm db:reset and try again." };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
