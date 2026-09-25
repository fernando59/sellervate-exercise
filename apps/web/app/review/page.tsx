import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QueueFilters } from "@/features/review/components/queue-filters";
import { QueueList } from "@/features/review/components/queue-list";
import { ReplyMessages } from "@/features/review/components/reply-messages";
import { ReviewForm } from "@/features/review/components/review-form";
import { nextUnreviewed, loadReviewQueue } from "@/features/review/queue";
import { parseQueueParams, queueHref } from "@/features/review/queue-params";
import { getOptionalUser } from "@/server/auth/session";
import { getReplyDetail } from "@/server/data/replies";
import { listIssueTypes } from "@/server/data/reviews";
import { formatDate } from "@/server/time";
import { EmptyState } from "@/ui/empty-state";
import { LinkButton } from "@/ui/link-button";

export const metadata: Metadata = { title: "Review queue · Sellervate QA" };

export default async function ReviewPage({ searchParams }: PageProps<"/review">) {
  const user = await getOptionalUser();
  if (!user) redirect("/");

  const params = parseQueueParams(await searchParams);
  const queue = await loadReviewQueue(user, params);

  if (queue.ledBrands.length === 0) {
    return (
      <EmptyState
        title="The review queue is for brand leads"
        description="You do not lead any brand, so there is nothing here for you to review. Switch to a lead in the top right corner, or go back home."
        action={<LinkButton href="/">Go home</LinkButton>}
      />
    );
  }

  const reviewed = queue.items.filter((i) => i.myScore !== null).length;
  const visible = params.status === "unreviewed" ? queue.items.filter((i) => i.myScore === null) : queue.items;
  const activeBrand = queue.brand?.slug ?? null;
  const state = { ...params, brand: activeBrand };

  // A reply that is not in this queue (another day, another brand, a typo) is
  // not found, whether or not it exists (TASK-003, Q17).
  let selected = null;
  if (params.reply) {
    if (!queue.items.some((i) => i.id === params.reply)) notFound();
    selected = await getReplyDetail(params.reply);
    if (!selected) notFound();
  }
  const issueTypes = selected ? await listIssueTypes() : [];
  const myReview = selected?.reviews.find((rv) => rv.reviewerId === user.id);
  // J/K neighbours in queue order among the visible replies. The selection
  // itself may be hidden by the filter (a reviewed reply with "Unreviewed"),
  // so the position comes from the full list.
  const position = selected ? queue.items.findIndex((i) => i.id === selected.id) : -1;
  const isVisible = (id: string) => visible.some((v) => v.id === id);
  const prevReplyId = position > 0 ? (queue.items.slice(0, position).findLast((i) => isVisible(i.id))?.id ?? null) : null;
  const nextReplyId = position >= 0 ? (queue.items.slice(position + 1).find((i) => isVisible(i.id))?.id ?? null) : null;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Review queue</h1>
          <p className="font-mono text-xs text-ink-muted">
            Yesterday, {formatDate(queue.range.start)} · {queue.items.length}{" "}
            {queue.items.length === 1 ? "reply" : "replies"} · {reviewed} reviewed
          </p>
        </div>
        <QueueFilters ledBrands={queue.ledBrands} params={state} activeBrand={activeBrand} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <div className={selected ? "hidden lg:block" : "block"}>
          {visible.length > 0 ? (
            <QueueList items={visible} params={state} />
          ) : (
            <EmptyState
              title={queue.items.length === 0 ? "No replies yesterday" : "Nothing left to review"}
              description={
                queue.items.length === 0
                  ? "Your brands sent no replies yesterday. Come back tomorrow."
                  : "You have reviewed every reply from yesterday. Switch to All to revisit one."
              }
            />
          )}
        </div>

        {selected ? (
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <Link href={queueHref({ ...state, reply: null })} className="text-accent hover:underline lg:hidden">
                ← Queue
              </Link>
              <Link href={`/replies/${selected.id}`} className="ml-auto text-accent hover:underline">
                Open full reply and brand guidelines
              </Link>
            </div>
            <ReplyMessages reply={selected} />
            <ReviewForm
              key={selected.id}
              replyId={selected.id}
              issueTypes={issueTypes.filter((it) => it.active)}
              existing={myReview}
              queue={state}
              prevReplyId={prevReplyId}
              nextReplyId={nextReplyId}
            />
          </div>
        ) : (
          <div className="hidden lg:block">
            <SelectPrompt allDone={queue.items.length > 0 && nextUnreviewed(queue.items, null) === null} />
          </div>
        )}
      </div>
    </section>
  );
}

function SelectPrompt({ allDone }: { allDone: boolean }) {
  return allDone ? (
    <EmptyState
      title="All caught up"
      description="Every reply from yesterday has your review. Pick one on the left to change it."
    />
  ) : (
    <EmptyState title="Pick a reply" description="Choose a reply on the left to read it and leave your review." />
  );
}
