import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandCard } from "@/features/feedback/components/brand-card";
import { FeedbackFilters } from "@/features/feedback/components/feedback-filters";
import { FeedbackList } from "@/features/feedback/components/feedback-list";
import { Pagination } from "@/features/feedback/components/pagination";
import { feedbackHref, parseFeedbackParams } from "@/features/feedback/feedback-params";
import { arrangeBrandCards } from "@/features/feedback/summary";
import { getOptionalUser } from "@/server/auth/session";
import { getMyBrandScores, getMyIssueCounts, getMyRecentScores, listMyFeedback } from "@/server/data/feedback";
import { listIssueTypes } from "@/server/data/reviews";
import { EmptyState } from "@/ui/empty-state";

export const metadata: Metadata = { title: "My feedback · Sellervate QA" };

export default async function MyFeedbackPage({ searchParams }: PageProps<"/me">) {
  const user = await getOptionalUser();
  if (!user) redirect("/");

  const params = parseFeedbackParams(await searchParams);
  const coveredBrands = user.memberships.filter((m) => m.role === "specialist");
  const [issueTypes, scores, issueCounts] = await Promise.all([
    listIssueTypes(),
    getMyBrandScores(),
    getMyIssueCounts(),
  ]);

  // Unknown values in the URL are ignored rather than answered with an error.
  const brand = coveredBrands.find((m) => m.slug === params.brand) ?? null;
  const activeIssue = issueTypes.find((it) => it.code === params.issue) ?? null;
  const active = { ...params, brand: brand?.slug ?? null, issue: activeIssue?.code ?? null };

  const scoredBrandIds = scores.map((s) => s.brandId);
  const [feed, recent] = await Promise.all([
    listMyFeedback({ brandId: brand?.brandId ?? null, issueCode: active.issue, search: active.q, page: active.page }),
    Promise.all(scoredBrandIds.map(async (id) => [id, await getMyRecentScores(id)] as const)),
  ]);
  const cards = arrangeBrandCards(user.memberships, scores, issueCounts, new Map(recent), issueTypes);
  const filtered = active.q !== null || active.brand !== null || active.issue !== null;

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">My feedback</h1>
        <p className="max-w-prose text-sm text-ink-muted">
          Reviews of the replies you sent. Only you and the leads of each brand can see them.
        </p>
      </header>

      {cards.length === 0 ? (
        <EmptyState
          title="No replies of your own"
          description="Feedback shows up here for the replies you send as a specialist. You do not cover any brand as a specialist."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((c) => (
              <BrandCard key={c.brandId} summary={c} />
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold">Reviewed replies</h2>
            {scores.length === 0 ? (
              <EmptyState
                title="Nothing reviewed yet"
                description="Your leads review a few replies each day. Their scores and comments will appear here."
              />
            ) : (
              <>
                <FeedbackFilters brands={coveredBrands} params={active} activeIssue={activeIssue} />
                {feed.items.length > 0 ? (
                  <>
                    <FeedbackList items={feed.items} issueTypes={issueTypes} />
                    <Pagination params={active} total={feed.total} />
                  </>
                ) : feed.total > 0 ? (
                  <EmptyState
                    title="This page is past the end"
                    description={`There are ${feed.total} matching replies.`}
                    action={<FirstPageLink href={feedbackHref({ ...active, page: 1 })} label="Go to the first page" />}
                  />
                ) : filtered ? (
                  <EmptyState
                    title="No replies match"
                    description="Nothing matches this search and these filters. Try a ticket number or fewer filters."
                    action={<FirstPageLink href="/me" label="Clear all filters" />}
                  />
                ) : null}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function FirstPageLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-sm font-medium text-accent underline-offset-2 hover:underline">
      {label}
    </Link>
  );
}
