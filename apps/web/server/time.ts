import "server-only";

/**
 * The one time zone "yesterday" is measured in. Every brand in the seed works
 * from Spain, so a constant is enough today. It does not scale to a team spread
 * over time zones: the working day belongs to the brand, so the next step is a
 * brands.time_zone column, and this file is the only place that has to change
 * (TASK-004, Q1).
 */
export const APP_TIME_ZONE = "Europe/Madrid";

export type TimeRange = {
  /** Inclusive start, as an ISO instant. */
  start: string;
  /** Exclusive end, as an ISO instant. */
  end: string;
};

/** Yesterday's calendar day in APP_TIME_ZONE, as a half-open UTC range. */
export function yesterdayRange(now: Date = new Date()): TimeRange {
  const today = zonedDateParts(now);
  const start = zonedMidnight(today.year, today.month, today.day - 1);
  const end = zonedMidnight(today.year, today.month, today.day);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function isWithin(instant: string, range: TimeRange): boolean {
  const t = Date.parse(instant);
  return t >= Date.parse(range.start) && t < Date.parse(range.end);
}

const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "14:05" in APP_TIME_ZONE. */
export function formatClock(instant: string): string {
  return clockFormat.format(new Date(instant));
}

/** "24 Sept 2026" in APP_TIME_ZONE. */
export function formatDate(instant: string): string {
  return dateFormat.format(new Date(instant));
}

/**
 * The Mondays of the last `count` weeks in APP_TIME_ZONE, oldest first and
 * ending with the current week, as "YYYY-MM-DD". They match the week column of
 * the brand_weekly_scores view, which truncates sent_at in the same zone.
 */
export function recentWeekStarts(count: number, now: Date = new Date()): string[] {
  const today = zonedDateParts(now);
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day);
  // getUTCDay: Sunday is 0. Days since Monday: Monday 0 … Sunday 6.
  const sinceMonday = (new Date(todayUtc).getUTCDay() + 6) % 7;
  const monday = todayUtc - sinceMonday * DAY_MS;
  return Array.from({ length: count }, (_, i) => isoDay(monday - (count - 1 - i) * 7 * DAY_MS));
}

/** The Monday of the week a calendar day ("YYYY-MM-DD") falls in. */
export function weekStartOf(day: string): string {
  const t = Date.parse(`${day}T00:00:00Z`);
  const sinceMonday = (new Date(t).getUTCDay() + 6) % 7;
  return isoDay(t - sinceMonday * DAY_MS);
}

const shortDayFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });

/** "14 Sept" for a calendar day ("YYYY-MM-DD"); no time zone shift. */
export function formatShortDay(day: string): string {
  return shortDayFormat.format(new Date(`${day}T00:00:00Z`));
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDay(utcMs: number): string {
  return new Date(utcMs).toISOString().slice(0, 10);
}

function zonedDateParts(instant: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Milliseconds APP_TIME_ZONE is ahead of UTC at this instant. */
function offsetAt(instant: Date): number {
  const p = zonedDateParts(instant);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - instant.getTime();
}

/**
 * 00:00 of a calendar day in APP_TIME_ZONE. Date.UTC normalises day 0 and
 * month overflow, so "day - 1" works across month and year boundaries. The
 * offset is taken twice because midnight and the UTC guess can fall on
 * opposite sides of a DST change.
 */
function zonedMidnight(year: number, month: number, day: number): Date {
  const guess = Date.UTC(year, month - 1, day);
  const first = guess - offsetAt(new Date(guess));
  return new Date(guess - offsetAt(new Date(first)));
}
