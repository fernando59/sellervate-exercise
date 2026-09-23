import Link from "next/link";
import type { ReactNode } from "react";
import { currentPersonOption, demoPeopleOptions } from "@/features/session/current-person";
import { UserSwitcher } from "@/features/session/user-switcher";
import { isDemoLoginEnabled } from "@/server/auth/demo-users";
import { getOptionalUser } from "@/server/auth/session";

/** Top-level frame: brand mark on the left, the user switcher on the right. */
export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getOptionalUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-base font-bold tracking-tight">Sellervate</span>
            <span className="font-mono text-2xs uppercase tracking-widest text-ink-muted">QA</span>
          </Link>
          <UserSwitcher
            people={demoPeopleOptions()}
            current={currentPersonOption(user)}
            enabled={isDemoLoginEnabled()}
          />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
