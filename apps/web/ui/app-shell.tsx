import type { ReactNode } from "react";

/**
 * Top-level frame. The right-hand slot is where the role switcher lands
 * once auth is stubbed (see feat/authz).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-base font-bold tracking-tight">Sellervate</span>
            <span className="font-mono text-2xs uppercase tracking-widest text-ink-muted">QA</span>
          </div>
          <div id="user-switcher-slot" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
