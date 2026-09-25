"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PersonOption } from "./types";
import { useSwitchPerson } from "./use-switch-person";

type UserSwitcherProps = {
  people: PersonOption[];
  current: { key: string | null; name: string; summary: string } | null;
  enabled: boolean;
};

/**
 * Header control: who you are right now, and a menu to become anyone in the
 * seed. Login is simulated; authorization is not, it follows whoever is picked.
 */
export function UserSwitcher({ people, current, enabled }: UserSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const { switchTo, signOut, isPending, error } = useSwitchPerson();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!enabled) {
    return (
      <span className="text-xs text-ink-muted" title="Set DEMO_USER_PASSWORD in apps/web/.env.local">
        Demo sign-in disabled
      </span>
    );
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        title={current ? `${current.name} · ${current.summary}` : undefined}
        className="flex min-w-0 max-w-[60vw] items-center gap-2 rounded-md border border-line bg-surface px-2 py-1.5 text-left transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 sm:max-w-xs sm:gap-3 sm:px-3 sm:py-1"
      >
        {current ? (
          <>
            <Initials name={current.name} />
            {/* One line on phones (the roles would wrap and overflow the 56px
                header); name and roles from sm up, truncated, never wrapped. */}
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium">{current.name}</span>
              <span className="hidden truncate text-2xs text-ink-muted sm:block">{current.summary}</span>
            </span>
          </>
        ) : (
          <span className="truncate text-sm font-medium">Choose a person</span>
        )}
        <span aria-hidden className="shrink-0 text-ink-muted">
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
        >
          <p className="border-b border-line px-4 py-2 font-mono text-2xs uppercase tracking-widest text-ink-muted">
            View the tool as
          </p>
          <ul>
            {people.map((person) => {
              const isCurrent = person.key === current?.key;
              return (
                <li key={person.key}>
                  <button
                    type="button"
                    aria-current={isCurrent ? "true" : undefined}
                    disabled={isPending || isCurrent}
                    onClick={() => switchTo(person.key, () => setOpen(false))}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-sunken focus-visible:bg-sunken focus-visible:outline-none disabled:cursor-default aria-[current=true]:bg-accent-soft"
                  >
                    <Initials name={person.name} />
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-sm font-medium">{person.name}</span>
                      <span className="truncate text-2xs text-ink-muted">{person.summary}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {error ? (
            <p role="alert" className="border-t border-line bg-bad-soft px-4 py-2 text-xs text-bad">
              {error}
            </p>
          ) : null}
          {current ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => signOut(() => setOpen(false))}
              className="w-full border-t border-line px-4 py-2.5 text-left text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-ink focus-visible:bg-sunken focus-visible:outline-none"
            >
              Sign out
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sunken font-mono text-2xs font-medium text-ink-muted"
    >
      {initials}
    </span>
  );
}
