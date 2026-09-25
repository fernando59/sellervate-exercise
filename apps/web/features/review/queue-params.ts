/**
 * The review queue keeps its state in the URL (TASK-004, Q3), so a selection
 * survives a reload and J/K or "Save and next" are plain navigations.
 */
export type QueueStatus = "all" | "unreviewed";

export type QueueParams = {
  /** A brand slug; ignored by the page unless the viewer leads that brand. */
  brand: string | null;
  status: QueueStatus;
  reply: string | null;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v ? v : null;
}

export function parseQueueParams(raw: RawParams): QueueParams {
  return {
    brand: first(raw.brand),
    status: first(raw.status) === "unreviewed" ? "unreviewed" : "all",
    reply: first(raw.reply),
  };
}

/** /review with the given state; defaults are left out of the URL. */
export function queueHref(params: Partial<QueueParams>): string {
  const search = new URLSearchParams();
  if (params.brand) search.set("brand", params.brand);
  if (params.status === "unreviewed") search.set("status", "unreviewed");
  if (params.reply) search.set("reply", params.reply);
  const query = search.toString();
  return query ? `/review?${query}` : "/review";
}
