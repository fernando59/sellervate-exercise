import { getOptionalUser } from "@/server/auth/session";
import { EmptyState } from "@/ui/empty-state";
import { LinkButton } from "@/ui/link-button";

/**
 * A brand the viewer does not lead looks exactly like one that does not exist,
 * so the page never confirms which brands exist (TASK-006, Q1).
 */
export default async function BrandNotFound() {
  const user = await getOptionalUser();
  const led = user?.memberships.filter((m) => m.role === "lead") ?? [];

  return (
    <EmptyState
      title="No brand overview here"
      description="Brand overviews are for the leads of each brand. It does not exist, or you do not lead it. If you just switched person, it was the previous person's brand."
      action={
        <div className="flex flex-wrap gap-2">
          {led.map((m) => (
            <LinkButton key={m.brandId} href={`/brands/${m.slug}`}>
              {m.name}
            </LinkButton>
          ))}
          <LinkButton href="/" variant={led.length > 0 ? "secondary" : "primary"}>
            Go home
          </LinkButton>
        </div>
      }
    />
  );
}
