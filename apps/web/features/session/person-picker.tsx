"use client";

import type { PersonOption } from "./types";
import { useSwitchPerson } from "./use-switch-person";

/** The five seed people as cards: the landing page when nobody is signed in. */
export function PersonPicker({ people }: { people: PersonOption[] }) {
  const { switchTo, isPending, error } = useSwitchPerson();

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => (
          <li key={person.key}>
            <button
              type="button"
              disabled={isPending}
              onClick={() => switchTo(person.key)}
              className="flex w-full flex-col items-start gap-1 rounded-lg border border-line bg-surface px-5 py-4 text-left transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
            >
              <span className="font-medium">{person.name}</span>
              <span className="text-sm text-ink-muted">{person.summary}</span>
            </button>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
