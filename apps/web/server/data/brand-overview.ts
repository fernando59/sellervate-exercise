import "server-only";

import type { LeadMembership } from "@/server/auth/session";
import { createClient } from "@/server/supabase/server";
import { recentWeekStarts, weekStartOf } from "@/server/time";

// Every query here runs with the caller's JWT and reads security_invoker views,
// so RLS decides what is aggregated. The functions take the caller's lead
// membership (from findLedBrand), not a bare brand id: called for a specialist,
// RLS would add up only their own replies and the page would present them as
// the brand's, so the type makes the lead check part of the call.

export const TREND_WEEKS = 8;

export type BrandHeader = {
  id: string;
  slug: string;
  name: string;
  keyRule: string;
};

/** The brand row, or null when RLS hides it. */
export async function getBrand(lead: LeadMembership): Promise<BrandHeader | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, slug, name, key_rule")
    .eq("id", lead.brandId)
    .maybeSingle();
  if (error) throw error;
  return data && { id: data.id, slug: data.slug, name: data.name, keyRule: data.key_rule };
}

export type TrendWeek = {
  /** Monday of the week, "YYYY-MM-DD", in the app time zone. */
  week: string;
  /** Null for a week without reviews: a gap in the chart, never a zero. */
  average: number | null;
  /** Sum of the week's scores, unrounded, to average several weeks exactly. */
  scoreSum: number;
  reviewCount: number;
  criticalCount: number;
};

export type BrandEvent = {
  /** Monday of the week it happened in, to sit on the chart's week axis. */
  week: string;
  happenedOn: string;
  note: string;
};

export type BrandTrend = {
  weeks: TrendWeek[];
  events: BrandEvent[];
};

/** The last TREND_WEEKS weeks, current week included, and the brand's events in them. */
export async function getBrandTrend(lead: LeadMembership): Promise<BrandTrend> {
  const weekStarts = recentWeekStarts(TREND_WEEKS);
  const from = weekStarts[0];
  const supabase = await createClient();

  const [scores, events] = await Promise.all([
    supabase
      .from("brand_weekly_scores")
      .select("week, avg_score, score_sum, review_count, critical_count")
      .eq("brand_id", lead.brandId)
      .gte("week", from),
    supabase
      .from("brand_events")
      .select("happened_on, note")
      .eq("brand_id", lead.brandId)
      .gte("happened_on", from)
      .order("happened_on"),
  ]);
  if (scores.error) throw scores.error;
  if (events.error) throw events.error;

  return {
    weeks: fillMissingWeeks(weekStarts, scores.data),
    events: events.data.map((e) => ({ week: weekStartOf(e.happened_on), happenedOn: e.happened_on, note: e.note })),
  };
}

type WeekRow = {
  week: string | null;
  avg_score: number | null;
  score_sum: number | null;
  review_count: number | null;
  critical_count: number | null;
};

/** One entry per week of the window; weeks the view has no row for stay empty. */
function fillMissingWeeks(weekStarts: string[], rows: WeekRow[]): TrendWeek[] {
  const byWeek = new Map(rows.map((r) => [r.week, r]));
  return weekStarts.map((week) => {
    const row = byWeek.get(week);
    return {
      week,
      average: row?.avg_score == null ? null : Number(row.avg_score),
      scoreSum: Number(row?.score_sum ?? 0),
      reviewCount: row?.review_count ?? 0,
      criticalCount: row?.critical_count ?? 0,
    };
  });
}

export type BrandIssueCount = {
  issueCode: string;
  count: number;
  /** sent_at of the latest reply it was flagged on. */
  lastSentAt: string;
};

/** How often each issue was flagged in the brand, all time, summed over specialists. */
export async function getBrandIssueCounts(lead: LeadMembership): Promise<BrandIssueCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specialist_issue_counts")
    .select("issue_code, flagged_count, last_sent_at")
    .eq("brand_id", lead.brandId);
  if (error) throw error;

  const byCode = new Map<string, BrandIssueCount>();
  for (const r of data) {
    const code = r.issue_code ?? "";
    const lastSentAt = r.last_sent_at ?? "";
    const seen = byCode.get(code);
    byCode.set(code, {
      issueCode: code,
      count: (seen?.count ?? 0) + (r.flagged_count ?? 0),
      lastSentAt: seen && seen.lastSentAt > lastSentAt ? seen.lastSentAt : lastSentAt,
    });
  }
  return [...byCode.values()];
}

export type SpecialistScore = {
  specialistId: string;
  name: string;
  average: number;
  reviewCount: number;
  criticalCount: number;
};

/**
 * Each specialist's average, review count and critical count in the brand, all
 * time. Critical first, then the lowest average: who needs attention, not a
 * ranking (TASK-006, Q11).
 */
export async function getSpecialistScores(lead: LeadMembership): Promise<SpecialistScore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specialist_brand_scores")
    .select("specialist_id, avg_score, review_count, critical_count")
    .eq("brand_id", lead.brandId);
  if (error) throw error;

  const ids = data.flatMap((r) => (r.specialist_id ? [r.specialist_id] : []));
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const profiles = await supabase.from("profiles").select("id, full_name").in("id", ids);
    if (profiles.error) throw profiles.error;
    for (const p of profiles.data) names.set(p.id, p.full_name);
  }

  return data
    .map((r) => ({
      specialistId: r.specialist_id ?? "",
      // RLS decides whether the profile is visible; a gap shows as a label, not a 500.
      name: names.get(r.specialist_id ?? "") ?? "Former specialist",
      average: Number(r.avg_score),
      reviewCount: r.review_count ?? 0,
      criticalCount: r.critical_count ?? 0,
    }))
    .sort((a, b) => b.criticalCount - a.criticalCount || a.average - b.average || a.name.localeCompare(b.name));
}
