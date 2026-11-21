import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Inbox, MailCheck, MailQuestion, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/lib/admin-auth";
import { fmtDateTime } from "@/lib/admin-format";
import { EmptyState, ErrorNote, PageHeader, Panel, StatCard, TableSkeleton } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/_panel/")({ component: Dashboard });

const count = async (q: PromiseLike<{ count: number | null; error: unknown }>) => {
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
};

function Dashboard() {
  const { profile, isSuperAdmin } = useAdminAuth();

  const stats = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: async () => {
      const head = { count: "exact", head: true } as const;
      const [inquiries, pending, contacts, subscribed] = await Promise.all([
        count(supabase.from("inquiries").select("id", head)),
        count(supabase.from("inquiries").select("id", head).eq("handled", false)),
        count(supabase.from("contacts").select("id", head)),
        count(supabase.from("contacts").select("id", head).eq("subscribed", true)),
      ]);
      return { inquiries, pending, contacts, subscribed };
    },
  });

  const recent = useQuery({
    queryKey: ["admin", "recent-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("id, type, name, phone, email, service, subject, handled, created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${profile?.email}.${isSuperAdmin ? " You're a super admin." : ""}`}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total inquiries" value={stats.data?.inquiries} loading={stats.isLoading} icon={<Inbox className="h-5 w-5" />} />
        <StatCard label="Waiting for a reply" value={stats.data?.pending} loading={stats.isLoading} icon={<MailQuestion className="h-5 w-5" />} tone={stats.data?.pending ? "alert" : "default"} />
        <StatCard label="Contacts" value={stats.data?.contacts} loading={stats.isLoading} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Newsletter subscribers" value={stats.data?.subscribed} loading={stats.isLoading} icon={<MailCheck className="h-5 w-5" />} />
      </div>
      {stats.isError && <ErrorNote message="Couldn't load the numbers." onRetry={() => void stats.refetch()} />}

      <Panel className="mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <h2 className="text-2xl text-primary">Latest inquiries</h2>
          <Link to="/admin/inquiries" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recent.isLoading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : recent.isError ? (
          <ErrorNote message="Couldn't load inquiries." onRetry={() => void recent.refetch()} />
        ) : !recent.data?.length ? (
          <EmptyState icon={<Inbox />} title="Nothing yet" text="Appointment requests and messages from the website will show up here." />
        ) : (
          <ul className="divide-y">
            {recent.data.map((i) => (
              <li key={i.id}>
                <Link to="/admin/inquiries" className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-4 transition hover:bg-muted/60">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-foreground">{i.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {i.type === "appointment" ? `Appointment${i.service ? ` · ${i.service}` : ""}` : i.subject || "Message"}
                      {" · "}{i.phone || i.email}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{fmtDateTime(i.created_at)}</span>
                  <Badge variant={i.handled ? "secondary" : "destructive"}>{i.handled ? "Handled" : "New"}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
