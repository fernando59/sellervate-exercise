"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";

/** Below this many reviews a week's average is drawn faded: too few to read much into. */
export const SMALL_SAMPLE = 3;

export type TrendPoint = {
  /** "14 Sept": the week's Monday, formatted on the server. */
  label: string;
  average: number | null;
  reviewCount: number;
  criticalCount: number;
  /** The current week, still in progress. */
  partial: boolean;
};

export type TrendMarker = {
  /** The label of the week it sits on. */
  label: string;
  number: number;
};

/**
 * The brand's weekly average. One series, so no legend: the section title
 * names it. The Y axis is fixed at 1–5 so a move from 3.9 to 4.1 looks as
 * small as it is. Weeks without reviews are gaps (null, not zero), and weeks
 * with fewer than SMALL_SAMPLE reviews get a hollow point. Colours come from
 * the design tokens; the SVG is hidden from assistive tech because the page
 * renders the same numbers as a table.
 */
export function TrendChart({ points, markers }: { points: TrendPoint[]; markers: TrendMarker[] }) {
  return (
    <div className="h-56 w-full sm:h-64" aria-hidden="true">
      <LineChart
        data={points}
        responsive
        style={{ width: "100%", height: "100%" }}
        margin={{ top: 16, right: 12, bottom: 0, left: -24 }}
        accessibilityLayer={false}
      >
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--line-strong)" }}
          interval="preserveStartEnd"
          minTickGap={12}
        />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          // No allowDataOverflow: averages always fall in 1–5, and with it
          // Recharts clips the points to the plot, cutting a 1 or a 5 in half.
          // The padding keeps those points off the axis line.
          padding={{ top: 8, bottom: 8 }}
          tick={{ fill: "var(--ink-muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
        />
        {markers.map((m) => (
          <ReferenceLine
            key={m.number}
            x={m.label}
            stroke="var(--ink-muted)"
            strokeDasharray="4 4"
            label={{ value: String(m.number), position: "top", fill: "var(--ink-muted)", fontSize: 12 }}
          />
        ))}
        <Tooltip
          content={TrendTooltip}
          cursor={{ stroke: "var(--line-strong)" }}
          isAnimationActive={false}
        />
        <Line
          dataKey="average"
          stroke="var(--accent)"
          strokeWidth={2}
          connectNulls={false}
          isAnimationActive={false}
          dot={TrendDot}
          activeDot={{ r: 6, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
        />
      </LineChart>
    </div>
  );
}

type DotProps = { cx?: number; cy?: number; index: number; payload: TrendPoint };

function TrendDot({ cx, cy, index, payload }: DotProps) {
  if (cx == null || cy == null || payload.average === null) return <g key={index} />;
  const small = payload.reviewCount < SMALL_SAMPLE;
  return (
    <circle
      key={index}
      cx={cx}
      cy={cy}
      r={4}
      fill={small ? "var(--surface)" : "var(--accent)"}
      stroke={small ? "var(--accent)" : "var(--surface)"}
      strokeWidth={2}
      opacity={small ? 0.7 : 1}
    />
  );
}

function TrendTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as TrendPoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="text-ink-muted">
        Week of {point.label}
        {point.partial ? " (so far)" : ""}
      </p>
      {point.average === null ? (
        <p>No reviews</p>
      ) : (
        <p className="font-mono tabular-nums">
          {point.average.toFixed(1)} · {point.reviewCount} {point.reviewCount === 1 ? "review" : "reviews"} ·{" "}
          <span className={point.criticalCount > 0 ? "text-bad" : undefined}>{point.criticalCount} critical</span>
        </p>
      )}
      {point.average !== null && point.reviewCount < SMALL_SAMPLE ? (
        <p className="text-ink-muted">Small sample</p>
      ) : null}
    </div>
  );
}
