/**
 * /me keeps its search, filters and page in the URL, so a filtered view can be
 * reloaded or shared and every control is a plain link or GET form. Invalid
 * values are dropped, never an error (same rule as the review queue).
 */
export type FeedbackParams = {
  q: string | null;
  /** A brand slug; the page ignores it unless the viewer covers that brand. */
  brand: string | null;
  /** An issue code; the page ignores it unless it is in the catalog. */
  issue: string | null;
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;

const MAX_SEARCH = 80;

function first(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v ? v : null;
}

/**
 * The search goes into a PostgREST or() filter as a quoted ilike pattern. The
 * characters that could break out of it (quotes, backslash) or act as
 * wildcards (% _ *) are removed, so the text is always matched literally.
 */
export function cleanSearch(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/["\\%_*]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH);
  return cleaned || null;
}

export function parseFeedbackParams(raw: RawParams): FeedbackParams {
  const page = Number(first(raw.page));
  return {
    q: cleanSearch(first(raw.q)),
    brand: first(raw.brand),
    issue: first(raw.issue),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** /me with the given state; defaults are left out of the URL. */
export function feedbackHref(params: Partial<FeedbackParams>): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.brand) search.set("brand", params.brand);
  if (params.issue) search.set("issue", params.issue);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/me?${query}` : "/me";
}
