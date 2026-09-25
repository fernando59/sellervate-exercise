import { getOptionalUser } from "@/server/auth/session";
import { EmptyState } from "@/ui/empty-state";
import { LinkButton } from "@/ui/link-button";

/**
 * A ?reply= that is not in the viewer's queue. The text is the same whether
 * the reply does not exist or belongs to someone else, so it reveals nothing
 * (TASK-003, Q17). The common way here is switching person with a reply open.
 */
export default async function ReviewNotFound() {
  const user = await getOptionalUser();
  const isLead = user?.memberships.some((m) => m.role === "lead") ?? false;

  return (
    <EmptyState
      title="This reply is not in your queue"
      description="It does not exist, it was not sent yesterday, or it belongs to a brand you do not lead. If you just switched person, it was the previous person's reply."
      action={
        <div className="flex flex-wrap gap-2">
          {isLead ? <LinkButton href="/review">Back to the queue</LinkButton> : null}
          <LinkButton href="/" variant={isLead ? "secondary" : "primary"}>
            Go home
          </LinkButton>
        </div>
      }
    />
  );
}
