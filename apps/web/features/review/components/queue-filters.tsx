import Link from "next/link";
import type { ReactNode } from "react";
import type { Membership } from "@/server/auth/session";
import { queueHref, type QueueParams } from "../queue-params";

type QueueFiltersProps = {
  ledBrands: Membership[];
  params: QueueParams;
  activeBrand: string | null;
};

/** Brand and status filters as links: the state lives in the URL. */
export function QueueFilters({ ledBrands, params, activeBrand }: QueueFiltersProps) {
  // Changing a filter drops the selection: it may not be in the new list.
  const base = { ...params, brand: activeBrand, reply: null };
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {ledBrands.length > 1 ? (
        <nav aria-label="Brand" className="flex flex-wrap gap-1">
          <FilterLink href={queueHref({ ...base, brand: null })} active={activeBrand === null}>
            All brands
          </FilterLink>
          {ledBrands.map((b) => (
            <FilterLink key={b.brandId} href={queueHref({ ...base, brand: b.slug })} active={activeBrand === b.slug}>
              {b.name}
            </FilterLink>
          ))}
        </nav>
      ) : null}
      <nav aria-label="Status" className="flex gap-1">
        <FilterLink href={queueHref({ ...base, status: "all" })} active={params.status === "all"}>
          All
        </FilterLink>
        <FilterLink href={queueHref({ ...base, status: "unreviewed" })} active={params.status === "unreviewed"}>
          Unreviewed
        </FilterLink>
      </nav>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-accent bg-accent text-accent-ink"
          : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
