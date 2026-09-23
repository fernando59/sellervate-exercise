import "server-only";

import { DEMO_PEOPLE } from "@/server/auth/demo-users";
import type { CurrentUser } from "@/server/auth/session";
import type { PersonOption } from "./types";

export function demoPeopleOptions(): PersonOption[] {
  return DEMO_PEOPLE.map(({ key, name, summary }) => ({ key, name, summary }));
}

/**
 * "Lead · Voltra, Boxwell", built from the memberships in the database rather
 * than from the demo list, so the header shows what the server actually grants.
 */
export function describeRoles(user: CurrentUser): string {
  if (user.memberships.length === 0) return "No brands";
  const byRole = new Map<string, string[]>();
  for (const m of user.memberships) {
    const label = m.role === "lead" ? "Lead" : "Specialist";
    byRole.set(label, [...(byRole.get(label) ?? []), m.name]);
  }
  return [...byRole].map(([role, brands]) => `${role} · ${brands.join(", ")}`).join(" / ");
}

export function currentPersonOption(user: CurrentUser | null) {
  if (!user) return null;
  // The key only marks the current row in the menu.
  const key = DEMO_PEOPLE.find((p) => p.id === user.id)?.key ?? null;
  return { key, name: user.fullName, summary: describeRoles(user) };
}
