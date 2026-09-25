import { getOptionalUser } from "@/server/auth/session";
import { EmptyState } from "@/ui/empty-state";
import { LinkButton } from "@/ui/link-button";

/**
 * A reply that does not exist looks exactly like one the viewer may not see,
 * so the page never confirms that a reply exists in another brand.
 */
export default async function ReplyNotFound() {
  const user = await getOptionalUser();
  const isLead = user?.memberships.some((m) => m.role === "lead") ?? false;

  return (
    <EmptyState
      title="Reply not found"
      description="It does not exist, or it is not yours to see: leads see the replies of the brands they lead, specialists see their own."
      action={
        <div className="flex flex-wrap gap-2">
          {isLead ? <LinkButton href="/review">Go to the review queue</LinkButton> : null}
          <LinkButton href="/" variant={isLead ? "secondary" : "primary"}>
            Go home
          </LinkButton>
        </div>
      }
    />
  );
}
