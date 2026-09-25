import Link from "next/link";
import type { ReactNode } from "react";
import { currentPersonOption, demoPeopleOptions } from "@/features/session/current-person";
import { UserSwitcher } from "@/features/session/user-switcher";
import { isDemoLoginEnabled } from "@/server/auth/demo-users";
import { type CurrentUser, getOptionalUser } from "@/server/auth/session";
import { MainNav, type NavItem } from "./main-nav";

/**
 * Top-level frame: brand mark and the pages this person can open on the left,
 * the user switcher on the right. On a phone the links move to a second row.
 */
export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getOptionalUser();
  const nav = user ? navItems(user) : [];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/" className="flex shrink-0 items-baseline gap-2">
              <span className="font-display text-base font-bold tracking-tight">Sellervate</span>
              <span className="font-mono text-2xs uppercase tracking-widest text-ink-muted">QA</span>
            </Link>
            <div className="hidden min-w-0 md:block">
              <MainNav items={nav} />
            </div>
          </div>
          <UserSwitcher
            people={demoPeopleOptions()}
            current={currentPersonOption(user)}
            enabled={isDemoLoginEnabled()}
          />
        </div>
        {nav.length > 0 ? (
          <div className="border-t border-line px-2 py-1.5 md:hidden">
            <MainNav items={nav} />
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

/** Review queue and one overview per led brand for a lead; My feedback for a specialist. */
function navItems(user: CurrentUser): NavItem[] {
  const led = user.memberships.filter((m) => m.role === "lead");
  const items: NavItem[] = [];
  if (led.length > 0) items.push({ href: "/review", label: "Review queue" });
  for (const m of led) items.push({ href: `/brands/${m.slug}`, label: m.name });
  if (user.memberships.some((m) => m.role === "specialist")) items.push({ href: "/me", label: "My feedback" });
  return items;
}
