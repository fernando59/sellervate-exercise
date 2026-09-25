import Link from "next/link";
import type { QueueItem } from "@/server/data/replies";
import { formatClock } from "@/server/time";
import { queueHref, type QueueParams } from "../queue-params";
import { ScoreBadge } from "./score-badge";

type QueueListProps = {
  items: QueueItem[];
  params: QueueParams;
};

/** Yesterday's replies, oldest first. The selected one is marked with the accent. */
export function QueueList({ items, params }: QueueListProps) {
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
      {items.map((item) => {
        const selected = item.id === params.reply;
        return (
          <li key={item.id}>
            <Link
              href={queueHref({ ...params, reply: item.id })}
              aria-current={selected ? "true" : undefined}
              className={`flex items-start gap-3 border-l-2 px-4 py-3 transition-colors ${
                selected ? "border-accent bg-accent-soft" : "border-transparent hover:bg-sunken"
              }`}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex min-w-0 items-center gap-2 text-2xs text-ink-muted">
                  <span className="shrink-0 font-semibold uppercase tracking-wider text-ink">{item.brand.name}</span>
                  <span className="shrink-0 font-mono">{item.ticketRef}</span>
                  <span className="truncate">· {item.specialistName}</span>
                </div>
                <p className="truncate text-sm font-medium">{item.subject}</p>
                <span className="font-mono text-2xs text-ink-muted">Sent {formatClock(item.sentAt)}</span>
              </div>
              {item.myScore !== null ? (
                <ScoreBadge score={item.myScore} />
              ) : (
                <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" aria-label="Not reviewed yet" />
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
