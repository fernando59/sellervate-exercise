import "server-only";

import type { CurrentUser, Membership } from "@/server/auth/session";
import { listReviewQueue, type QueueItem } from "@/server/data/replies";
import { yesterdayRange, type TimeRange } from "@/server/time";
import type { QueueParams } from "./queue-params";

export type ReviewQueue = {
  range: TimeRange;
  /** Brands the viewer leads; the only ones the queue ever reads. */
  ledBrands: Membership[];
  /** The brand filter, when the URL names a brand the viewer leads. */
  brand: Membership | null;
  /** Yesterday's replies in the filtered brands, before the status filter. */
  items: QueueItem[];
};

/**
 * Yesterday's queue for this viewer. A ?brand= the viewer does not lead is
 * ignored rather than answered with an error, so the URL cannot be used to
 * ask which brands exist (TASK-004, Q13).
 */
export async function loadReviewQueue(user: CurrentUser, params: QueueParams): Promise<ReviewQueue> {
  const ledBrands = user.memberships.filter((m) => m.role === "lead");
  const brand = ledBrands.find((m) => m.slug === params.brand) ?? null;
  const range = yesterdayRange();
  const brandIds = brand ? [brand.brandId] : ledBrands.map((m) => m.brandId);
  const items = await listReviewQueue(brandIds, user.id, range);
  return { range, ledBrands, brand, items };
}

/**
 * The next reply the viewer has not reviewed, after `currentId` in queue
 * order, wrapping to the start; null when everything is reviewed.
 */
export function nextUnreviewed(items: QueueItem[], currentId: string | null): QueueItem | null {
  const start = currentId ? items.findIndex((i) => i.id === currentId) + 1 : 0;
  const ordered = [...items.slice(start), ...items.slice(0, start)];
  return ordered.find((i) => i.myScore === null && i.id !== currentId) ?? null;
}
