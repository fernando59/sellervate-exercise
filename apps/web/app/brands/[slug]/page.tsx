import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FrequentIssues } from "@/features/brand-overview/components/frequent-issues";
import { SpecialistTable } from "@/features/brand-overview/components/specialist-table";
import { BrandEvents, TrendSection } from "@/features/brand-overview/components/trend-section";
import { summarizeTrend } from "@/features/brand-overview/trend";
import { findLedBrand, getOptionalUser } from "@/server/auth/session";
import {
  TREND_WEEKS,
  getBrand,
  getBrandIssueCounts,
  getBrandTrend,
  getSpecialistScores,
} from "@/server/data/brand-overview";
import { listIssueTypes } from "@/server/data/reviews";
import { EmptyState } from "@/ui/empty-state";
import { LinkButton } from "@/ui/link-button";

export const metadata: Metadata = { title: "Brand overview · Sellervate QA" };

export default async function BrandPage({ params }: PageProps<"/brands/[slug]">) {
  const user = await getOptionalUser();
  if (!user) redirect("/");

  // Only a lead of the brand gets the page. The membership comes from the
  // database; the slug only picks which one. Anyone else, and a slug that does
  // not exist, get the same not found, so the page never confirms a brand
  // exists (TASK-006, Q1).
  const { slug } = await params;
  const membership = findLedBrand(user, slug);
  if (!membership) notFound();
  const brand = await getBrand(membership);
  if (!brand) notFound();

  const [trend, issueCounts, specialists, issueTypes] = await Promise.all([
    getBrandTrend(membership),
    getBrandIssueCounts(membership),
    getSpecialistScores(membership),
    listIssueTypes(),
  ]);
  const summary = summarizeTrend(trend.weeks);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex min-w-0 flex-col gap-2">
        <p className="font-mono text-2xs uppercase tracking-widest text-ink-muted">Brand overview</p>
        <h1 className="truncate font-display text-2xl font-bold tracking-tight">{brand.name}</h1>
        <p className="max-w-prose text-sm text-ink-muted">{brand.keyRule}</p>
      </header>

      {specialists.length === 0 ? (
        <>
          <EmptyState
            title={`No reviews yet for ${brand.name}`}
            description="Reviews from the queue show up here, grouped by the week each reply was sent."
            action={<LinkButton href={`/review?brand=${brand.slug}`}>Open the review queue</LinkButton>}
          />
          {/* A change can come before the first review; it still belongs on record. */}
          {trend.events.length > 0 ? (
            <section className="rounded-lg border border-line bg-surface p-4 sm:p-5">
              <BrandEvents events={trend.events} />
            </section>
          ) : null}
        </>
      ) : (
        <>
          <TrendSection weeks={trend.weeks} events={trend.events} summary={summary} weekCount={TREND_WEEKS} />
          <div className="grid gap-6 lg:grid-cols-2">
            <FrequentIssues counts={issueCounts} issueTypes={issueTypes} />
            <SpecialistTable specialists={specialists} />
          </div>
        </>
      )}
    </section>
  );
}
