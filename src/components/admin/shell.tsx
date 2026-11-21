import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Phone,
  Settings,
  ShieldCheck,
  Tag,
  UserCircle,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/lib/admin-auth";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/inquiries", label: "Inquiries", icon: Inbox, badge: true },
  { to: "/admin/contacts", label: "Contacts", icon: Users },
  { to: "/admin/tags", label: "Tags", icon: Tag },
  { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { to: "/admin/contact-details", label: "Contact details", icon: Phone },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/admins", label: "Admins", icon: ShieldCheck, superOnly: true },
] as const;

export function usePendingInquiries() {
  return useQuery({
    queryKey: ["admin", "pending-inquiries"],
    queryFn: async () => {
      const { count, error } = await supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("handled", false);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
}

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { isSuperAdmin } = useAdminAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname }).replace(/\/+$/, "") || "/";
  const { data: pending } = usePendingInquiries();

  return (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {nav
        .filter((n) => !("superOnly" in n && n.superOnly) || isSuperAdmin)
        .map((n) => {
          const active = "exact" in n && n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(`${n.to}/`);
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                active ? "bg-gold text-ink shadow-sm" : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{n.label}</span>
              {"badge" in n && n.badge && !!pending && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", active ? "bg-ink/15 text-ink" : "bg-gold text-ink")}>{pending}</span>
              )}
            </Link>
          );
        })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { profile, isSuperAdmin, signOut } = useAdminAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-7">
        <Link to="/" onClick={onNavigate} className="font-display text-2xl text-primary-foreground">
          De-Yula Hospital
        </Link>
        <p className="eyebrow mt-1">Admin console</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        <NavList onNavigate={onNavigate} />
      </div>
      <div className="m-3 rounded-2xl bg-primary-foreground/10 p-3 text-sm">
        <Link to="/admin/profile" onClick={onNavigate} className="flex items-center gap-3 rounded-xl p-1.5 text-primary-foreground hover:bg-primary-foreground/10">
          <UserCircle className="h-8 w-8 shrink-0 text-gold" />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{profile?.email}</span>
            <span className="block text-xs text-primary-foreground/60">{isSuperAdmin ? "Super admin" : "Admin"}</span>
          </span>
        </Link>
        <div className="mt-2 flex gap-2">
          <Link to="/" target="_blank" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-primary-foreground/80 hover:bg-primary-foreground/10">
            <ExternalLink className="h-3.5 w-3.5" /> View site
          </Link>
          <button onClick={() => void signOut()} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-primary-foreground/80 hover:bg-primary-foreground/10">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen bg-primary lg:block">
        <SidebarBody />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-full border bg-card text-primary">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-xl text-primary">De-Yula Admin</span>
          <span className="w-10" />
        </header>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-[290px] border-0 bg-primary p-0 text-primary-foreground [&>button]:text-primary-foreground">
            <SheetTitle className="sr-only">Admin menu</SheetTitle>
            <SheetDescription className="sr-only">Navigate the admin console</SheetDescription>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
