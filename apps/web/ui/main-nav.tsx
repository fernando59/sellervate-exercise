"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

/**
 * The pages this person's roles open, built on the server from their
 * memberships. Hiding a link is not authorization: every page checks again.
 */
export function MainNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;

  return (
    <nav aria-label="Main" className="min-w-0">
      <ul className="flex flex-wrap gap-x-1 gap-y-1">
        {items.map((item) => {
          const current = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`block rounded-md px-2.5 py-1.5 text-sm ${
                  current ? "bg-accent-soft font-semibold text-accent" : "text-ink-muted hover:bg-sunken hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
