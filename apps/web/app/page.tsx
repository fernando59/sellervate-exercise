import Link from "next/link";
import { demoPeopleOptions } from "@/features/session/current-person";
import { PersonPicker } from "@/features/session/person-picker";
import { isDemoLoginEnabled } from "@/server/auth/demo-users";
import { getOptionalUser } from "@/server/auth/session";
import { EmptyState } from "@/ui/empty-state";

// Every brand in the seed, including ones the current person cannot see, so the
// API links below show both the 200 and the 403.
const SEED_BRAND_SLUGS = ["voltra", "boxwell", "hebra"];

export default async function HomePage() {
  const user = await getOptionalUser();

  if (!user) {
    if (!isDemoLoginEnabled()) {
      return (
        <EmptyState
          title="Demo sign-in is disabled"
          description="Add DEMO_USER_PASSWORD to apps/web/.env.local (see .env.example) and restart pnpm dev."
        />
      );
    }
    return (
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">Choose a person</h1>
          <p className="max-w-prose text-sm text-ink-muted">
            Sign-in is simulated; access is not. Each person sees only what their role in each brand allows,
            and the server enforces it.
          </p>
        </header>
        <PersonPicker people={demoPeopleOptions()} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">Hi, {user.fullName.split(" ")[0]}</h1>
        <p className="max-w-prose text-sm text-ink-muted">This is what the server grants you.</p>
        <div className="flex flex-wrap gap-2">
          {user.memberships.some((m) => m.role === "lead") ? (
            <Link
              href="/review"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:opacity-90"
            >
              Open yesterday&apos;s review queue
            </Link>
          ) : null}
          {user.memberships.some((m) => m.role === "specialist") ? (
            <Link
              href="/me"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:opacity-90"
            >
              See my feedback
            </Link>
          ) : null}
        </div>
      </header>

      {user.memberships.length === 0 ? (
        <EmptyState title="No brands yet" description="Ask a lead to add you to a brand." />
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {user.memberships.map((m) => (
            <li key={m.brandId} className="flex items-center justify-between gap-3 px-5 py-3">
              <span className="min-w-0 truncate font-medium">{m.name}</span>
              <span className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-2xs uppercase tracking-widest text-ink-muted">{m.role}</span>
                {m.role === "lead" ? (
                  <Link href={`/brands/${m.slug}`} className="text-sm font-medium text-accent hover:underline">
                    Overview
                  </Link>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Check the API</h2>
        <p className="text-sm text-ink-muted">A brand you are not part of answers 403.</p>
        <ul className="flex flex-wrap gap-2">
          {SEED_BRAND_SLUGS.map((slug) => (
            <li key={slug}>
              <a
                href={`/api/brands/${slug}/replies`}
                className="inline-block rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-xs text-accent hover:border-accent"
              >
                /api/brands/{slug}/replies
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
