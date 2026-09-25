import type { NextRequest } from "next/server";
import { signInAsDemoPerson } from "@/server/auth/demo-users";

/**
 * POST /api/demo-session  { "person": "dani" }
 *
 * The same server-side sign-in as the user switcher, so the README can show the
 * 403 with curl and a cookie jar. It sets the session cookies and returns 204.
 *
 * JSON only: a cross-site HTML form cannot send application/json, so another
 * site cannot silently sign a visitor in as a seed person.
 */
export async function POST(request: NextRequest) {
  // Compare the media type itself: a substring check would also accept
  // "text/plain; x=application/json", which a cross-site request can send
  // without a CORS preflight.
  const mediaType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    return Response.json({ error: "Send JSON: { \"person\": \"dani\" }." }, { status: 415 });
  }

  const body: unknown = await request.json().catch(() => null);
  const person = body && typeof body === "object" && "person" in body ? body.person : undefined;

  const result = await signInAsDemoPerson(person);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return new Response(null, { status: 204 });
}
