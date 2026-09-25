import Link from "next/link";
import type { Membership } from "@/server/auth/session";
import type { IssueType } from "@/server/data/reviews";
import { feedbackHref, type FeedbackParams } from "../feedback-params";

type FeedbackFiltersProps = {
  brands: Membership[];
  params: FeedbackParams;
  activeIssue: IssueType | null;
};

/**
 * Search and brand filter as a plain GET form: no client state, works without
 * JavaScript, and submitting always goes back to page 1. The issue filter is
 * set from the brand cards and kept here as a hidden field.
 */
export function FeedbackFilters({ brands, params, activeIssue }: FeedbackFiltersProps) {
  const filtered = params.q !== null || params.brand !== null || activeIssue !== null;

  return (
    <div className="flex flex-col gap-2">
      <form action="/me" method="get" role="search" className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="feedback-q">
          Search by ticket or subject
        </label>
        <input
          id="feedback-q"
          name="q"
          type="search"
          defaultValue={params.q ?? ""}
          maxLength={80}
          placeholder="Ticket or subject, e.g. VOL-48102"
          className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm placeholder:text-ink-muted focus:border-accent focus:outline-none"
        />
        {brands.length > 1 ? (
          <>
            <label className="sr-only" htmlFor="feedback-brand">
              Brand
            </label>
            <select
              id="feedback-brand"
              name="brand"
              defaultValue={params.brand ?? ""}
              className="rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.brandId} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </>
        ) : null}
        {activeIssue ? <input type="hidden" name="issue" value={activeIssue.code} /> : null}
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:opacity-90"
        >
          Search
        </button>
      </form>

      {filtered ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {activeIssue ? (
            <Link
              href={feedbackHref({ q: params.q, brand: params.brand })}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-accent px-3 py-1 text-accent hover:bg-accent hover:text-accent-ink"
              aria-label={`Remove the filter ${activeIssue.label}`}
            >
              <span className="truncate">Flagged: {activeIssue.label}</span>
              <span aria-hidden="true">×</span>
            </Link>
          ) : null}
          <Link href="/me" className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
            Clear all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
