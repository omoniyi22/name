import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/** Centered card used by login / forgot / reset. */
export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string | undefined; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center font-display text-3xl text-ink-foreground">
          De-Yula Hospital
        </Link>
        <div className="rounded-3xl border bg-card p-8 shadow-2xl sm:p-10">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-3 text-4xl text-primary">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-ink-foreground/70">{footer}</div>}
      </div>
    </div>
  );
}
