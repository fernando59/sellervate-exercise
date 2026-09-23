import type { NextRequest } from "next/server";
import { isAuthError } from "@/server/auth/errors";
import { getCurrentUser, requireMember } from "@/server/auth/session";
import { listBrandReplies } from "@/server/data/replies";

/**
 * GET /api/brands/:slug/replies
 *
 * 401 without a session, 403 when the caller is not a member of the brand (or
 * it does not exist: the two are indistinguishable on purpose). A lead gets
 * every reply of the brand, a specialist only their own; RLS does that
 * filtering, this handler only turns "not your brand" into an explicit no.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/brands/[slug]/replies">) {
  const { slug } = await ctx.params;
  try {
    const user = await getCurrentUser();
    const membership = requireMember(user, slug);
    const replies = await listBrandReplies(membership.brandId);
    return Response.json(
      { brand: membership.slug, role: membership.role, replies },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (isAuthError(error)) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
