import "server-only";

import { cache } from "react";
import { createClient } from "@/server/supabase/server";
import { ForbiddenError, UnauthorizedError } from "./errors";

export type BrandRole = "lead" | "specialist";

export type Membership = {
  brandId: string;
  slug: string;
  name: string;
  role: BrandRole;
};

/** A membership checked to be lead; the server/data functions for leads take it. */
export type LeadMembership = Membership & { role: "lead"; readonly [leadChecked]: true };
declare const leadChecked: unique symbol;

export type CurrentUser = {
  id: string;
  fullName: string;
  memberships: Membership[];
};

/**
 * The signed-in person and their brands, or null without a session. Cached for
 * the duration of one request only (React cache), never across users.
 *
 * getUser() validates the token with Supabase Auth instead of trusting the
 * cookie as getSession() would.
 */
export const getOptionalUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, memberships] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("brand_memberships")
      .select("role, brand:brands!inner(id, slug, name)")
      .eq("user_id", user.id)
      .order("brand(name)"),
  ]);
  if (profile.error) throw profile.error;
  if (memberships.error) throw memberships.error;

  return {
    id: user.id,
    fullName: profile.data.full_name,
    memberships: memberships.data.map((m) => ({
      brandId: m.brand.id,
      slug: m.brand.slug,
      name: m.brand.name,
      role: m.role as BrandRole,
    })),
  };
});

/** The signed-in person; throws UnauthorizedError (401) without a session. */
export async function getCurrentUser(): Promise<CurrentUser> {
  const user = await getOptionalUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/**
 * The caller's membership in the brand with this slug. A brand that does not
 * exist and a brand the caller is not a member of both throw ForbiddenError, so
 * the answer never reveals which brands exist (TASK-003, Q9).
 */
export function requireMember(user: CurrentUser, brandSlug: string): Membership {
  const membership = user.memberships.find((m) => m.slug === brandSlug);
  if (!membership) throw new ForbiddenError();
  return membership;
}

/**
 * The caller's lead membership in the brand with this slug, or null. For pages
 * that answer not found instead of 403: a brand the caller does not lead and a
 * brand that does not exist look the same (TASK-006, Q1).
 */
export function findLedBrand(user: CurrentUser, brandSlug: string): LeadMembership | null {
  const membership = user.memberships.find((m) => m.slug === brandSlug && m.role === "lead");
  // The one place a LeadMembership is made: the brand is a type-only mark, so a
  // hand-built { role: "lead" } object does not compile where one is required.
  return membership ? (membership as LeadMembership) : null;
}

/**
 * Throws ForbiddenError unless the caller leads this brand. Pass the brand_id
 * read from the database row being acted on, never one taken from the request.
 */
export function requireLeadOf(user: CurrentUser, brandId: string): Membership {
  const membership = user.memberships.find((m) => m.brandId === brandId);
  if (membership?.role !== "lead") throw new ForbiddenError();
  return membership;
}
