import { scoreTone } from "./tones";

/** A 1–5 score in mono, coloured by outcome. */
export function ScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "size-10 text-lg" : "size-7 text-xs";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md border font-mono font-medium tabular-nums ${box} ${scoreTone(score)}`}
      aria-label={`Score ${score} of 5`}
    >
      {score}
    </span>
  );
}
