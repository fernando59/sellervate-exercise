import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

/** Shared empty state: says what is missing and what to do about it. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="max-w-prose text-sm text-ink-muted">{description}</p> : null}
      {action}
    </div>
  );
}
