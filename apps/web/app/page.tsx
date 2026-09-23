import { EmptyState } from "@/ui/empty-state";

export default function HomePage() {
  return (
    <EmptyState
      title="Nothing to review yet"
      description="Replies appear here once the database is seeded. Run pnpm db:reset from the repository root, then reload."
    />
  );
}
