import type { Severity } from "@/server/data/reviews";

/**
 * Severity and score are the only things that get semantic colour: critical is
 * bad, major is warn, minor stays neutral (docs/PLAN.md § 9).
 */
export const SEVERITY_ORDER: Severity[] = ["critical", "major", "minor"];

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
};

export const SEVERITY_TEXT: Record<Severity, string> = {
  critical: "text-bad",
  major: "text-warn",
  minor: "text-ink-muted",
};

/** A read-only issue chip. */
export const SEVERITY_CHIP: Record<Severity, string> = {
  critical: "border-bad/40 bg-bad-soft text-bad",
  major: "border-warn/40 bg-warn-soft text-warn",
  minor: "border-line bg-sunken text-ink-muted",
};

export function scoreTone(score: number): string {
  if (score <= 2) return "border-bad/40 bg-bad-soft text-bad";
  if (score === 3) return "border-warn/40 bg-warn-soft text-warn";
  return "border-good/40 bg-good-soft text-good";
}
