import { formatDuration } from "@/lib/format";
import type { ReplyDetail } from "@/server/data/replies";
import { formatClock, formatDate } from "@/server/time";

/**
 * The brand's key rule and response time, then the customer's message and the
 * reply that was sent. The customer sits on the sunken ground; the reply is
 * the page itself, set in the reading measure, because it is what gets judged.
 */
export function ReplyMessages({ reply }: { reply: ReplyDetail }) {
  const responseTime = formatDuration(Date.parse(reply.sentAt) - Date.parse(reply.receivedAt));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-sm">
          <span className="font-semibold">{reply.brand.name}</span>
          <span className="text-ink-muted"> · {reply.brand.keyRule}</span>
        </p>
        <p className="shrink-0 font-mono text-2xs text-ink-muted">
          Replied in <span className="text-ink">{responseTime}</span>
        </p>
      </div>

      <section aria-label="Customer message" className="flex flex-col gap-2 rounded-lg bg-sunken px-4 py-4">
        <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-2xs text-ink-muted">
          <span className="font-semibold uppercase tracking-wider">Customer</span>
          <span className="font-mono">
            {formatDate(reply.receivedAt)} · {formatClock(reply.receivedAt)}
          </span>
        </header>
        <p className="text-sm font-medium">{reply.subject}</p>
        <p className="max-w-prose whitespace-pre-line text-sm text-ink-muted">{reply.customerMessage}</p>
      </section>

      <section
        aria-label="Sent reply"
        className="flex flex-col gap-2 rounded-lg border border-line-strong bg-surface px-4 py-4"
      >
        <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-2xs text-ink-muted">
          <span className="min-w-0 truncate">
            <span className="font-semibold uppercase tracking-wider text-ink">Sent reply</span> ·{" "}
            {reply.specialist.name}
          </span>
          <span className="font-mono">
            {reply.ticketRef} · {formatClock(reply.sentAt)}
          </span>
        </header>
        <p className="max-w-prose whitespace-pre-line text-base">{reply.replyBody}</p>
      </section>
    </div>
  );
}
