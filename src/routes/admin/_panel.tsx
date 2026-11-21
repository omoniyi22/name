import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAdminAuth } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/shell";
import { AuthCard } from "@/components/admin/auth-card";
import { Skeleton } from "@/components/ui/skeleton";

// Guard for every signed-in admin page. Pages below render only for an active admin.
export const Route = createFileRoute("/admin/_panel")({ component: PanelLayout });

function PanelLayout() {
  const { status, signOut } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "signed-out") void navigate({ to: "/admin/login", replace: true });
  }, [status, navigate]);

  if (status === "forbidden") {
    return (
      <AuthCard title="No admin access" subtitle="This account isn't an active admin account. Ask a super admin to add you.">
        <button onClick={() => void signOut()} className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition hover:bg-primary/90">
          Sign out
        </button>
      </AuthCard>
    );
  }

  if (status !== "ready") {
    return (
      <div className="min-h-screen bg-background lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
        <div className="hidden bg-primary lg:block" />
        <div className="space-y-6 px-4 py-12 sm:px-8">
          <Skeleton className="h-12 w-72" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
