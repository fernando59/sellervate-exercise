import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReplyMessages } from "@/features/review/components/reply-messages";
import { ReviewSummary } from "@/features/review/components/review-summary";
import { queueHref } from "@/features/review/queue-params";
import { getOptionalUser } from "@/server/auth/session";
import { getReplyDetail } from "@/server/data/replies";
import { listIssueTypes } from "@/server/data/reviews";
import { isWithin, yesterdayRange } from "@/server/time";
import { EmptyState } from "@/ui/empty-state";

export const metadata: Metadata = { title: "Reply · Sellervate QA" };

/**
 * One reply with the brand's full guidelines and its reviews. Read-only: the
 * review form lives in the queue only (TASK-004, Q20). A lead of the brand and
 * the author may open it; for anyone else it does not exist.
 */
export default async function ReplyPage({ params }: PageProps<"/replies/[id]">) {
  const user = await getOptionalUser();
  if (!user) redirect("/");

  const { id } = await params;
  const reply = await getReplyDetail(id);
  if (!reply) notFound();

  // RLS already hides the reply from everyone else. This repeats the rule in
  // the app, so a policy change that widens replies_select does not silently
  // widen this page too.
  const isLead = user.memberships.some((m) => m.brandId === reply.brand.id && m.role === "lead");
  const isAuthor = reply.specialist.id === user.id;
  if (!isLead && !isAuthor) notFound();

  // The author reads every review of their reply. A lead sees only their own,
  // as in the queue (TASK-004, Q6): another lead's score is calibration, V2.
  const reviews = isAuthor ? reply.reviews : reply.reviews.filter((rv) => rv.reviewerId === user.id);
  const issueTypes = await listIssueTypes();
  const inQueue = isLead && isWithin(reply.sentAt, yesterdayRange());

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
          {reply.brand.name} · {reply.ticketRef}
        </p>
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{reply.subject}</h1>
        {inQueue ? (
          <Link href={queueHref({ reply: reply.id })} className="text-xs text-accent hover:underline">
            Review in queue →
          </Link>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <ReplyMessages reply={reply} />

          <section className="flex flex-col gap-3" aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="text-lg font-semibold">
              Review
            </h2>
            {reviews.length > 0 ? (
              reviews.map((rv) => <ReviewSummary key={rv.id} review={rv} issueTypes={issueTypes} />)
            ) : (
              <EmptyState
                title="Not reviewed yet"
                description={
                  isLead
                    ? "You have not reviewed this reply. Leads review yesterday's replies from the queue."
                    : "Your lead has not reviewed this reply yet. Their score and comments will show up here."
                }
              />
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4" aria-labelledby="guidelines-heading">
          <h2 id="guidelines-heading" className="text-sm font-semibold">
            {reply.brand.name} guidelines
          </h2>
          <p className="text-sm font-medium">{reply.brand.keyRule}</p>
          {reply.brand.guidelines ? (
            <p className="whitespace-pre-line text-sm text-ink-muted">{reply.brand.guidelines}</p>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
