import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandCard } from "@/features/feedback/components/brand-card";
import { FeedbackList } from "@/features/feedback/components/feedback-list";
import { summarizeByBrand } from "@/features/feedback/summary";
import { getOptionalUser } from "@/server/auth/session";
import { listMyFeedback } from "@/server/data/feedback";
import { listIssueTypes } from "@/server/data/reviews";
import { EmptyState } from "@/ui/empty-state";

export const metadata: Metadata = { title: "My feedback · Sellervate QA" };

export default async function MyFeedbackPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/");

  const [items, issueTypes] = await Promise.all([listMyFeedback(user.id), listIssueTypes()]);
  const brands = summarizeByBrand(items, user.memberships, issueTypes);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">My feedback</h1>
        <p className="max-w-prose text-sm text-ink-muted">
          Reviews of the replies you sent. Only you and the leads of each brand can see them.
        </p>
      </header>

      {brands.length === 0 ? (
        <EmptyState
          title="No replies of your own"
          description="Feedback shows up here for the replies you send as a specialist. You do not cover any brand as a specialist."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {brands.map((b) => (
              <BrandCard key={b.brandId} summary={b} />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Reviewed replies</h2>
            {items.length === 0 ? (
              <EmptyState
                title="Nothing reviewed yet"
                description="Your leads review a few replies each day. Their scores and comments will appear here."
              />
            ) : (
              <FeedbackList items={items} issueTypes={issueTypes} />
            )}
          </div>
        </>
      )}
    </section>
  );
}
