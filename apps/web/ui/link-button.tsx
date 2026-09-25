import Link from "next/link";
import type { ReactNode } from "react";

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:opacity-90",
  secondary: "border border-line bg-surface text-ink hover:border-line-strong",
} as const;

/** A navigation link styled as a button, for the way out of an empty or missing state. */
export function LinkButton({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: keyof typeof VARIANTS;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-opacity ${VARIANTS[variant]}`}
    >
      {children}
    </Link>
  );
}
