import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const fieldCls =
  "w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:opacity-60";
export const labelCls = "block text-sm font-semibold text-primary";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-2 text-4xl text-primary">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl border bg-card shadow-sm", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon,
  loading,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  loading?: boolean;
  tone?: "default" | "alert";
}) {
  return (
    <Panel className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-3 h-10 w-16" />
          ) : (
            <p className={cn("mt-2 font-display text-5xl", tone === "alert" ? "text-destructive" : "text-primary")}>{value}</p>
          )}
        </div>
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", tone === "alert" ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary")}>
          {icon}
        </span>
      </div>
    </Panel>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-0 flex-1 sm:min-w-64">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(fieldCls, "pl-10 pr-9")}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-5 py-4 text-sm text-muted-foreground sm:flex-row">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft /> Prev
        </Button>
        <span className="px-1">
          Page {page} of {pages}
        </span>
        <Button variant="outline" size="sm" className="rounded-full" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className="h-6 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string | undefined; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary [&_svg]:h-6 [&_svg]:w-6">{icon}</span>
      <p className="mt-4 font-display text-2xl text-primary">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="m-5 flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-destructive">{message}</span>
      {onRetry && (
        <Button variant="outline" size="sm" className="rounded-full" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
