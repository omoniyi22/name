import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CheckCircle2, Eye, Inbox, Mail, MessageCircle, Phone, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { waHref, telHref } from "@/lib/contact";
import { cleanSearch, errMessage, fmtDate, fmtDateTime } from "@/lib/admin-format";
import { useDebounced } from "@/lib/use-debounced";
import { EmptyState, ErrorNote, fieldCls, PageHeader, Pager, Panel, SearchBox, TableSkeleton } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/_panel/inquiries")({ component: InquiriesPage });

type Inquiry = Tables<"inquiries">;
const PAGE = 20;

function InquiriesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | "pending" | "handled">("all");
  const [type, setType] = useState<"all" | "contact" | "appointment">("all");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [viewing, setViewing] = useState<Inquiry | null>(null);
  const [deleting, setDeleting] = useState<Inquiry | null>(null);

  const list = useQuery({
    queryKey: ["admin", "inquiries", { page, status, type, q }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase.from("inquiries").select("*", { count: "exact" }).order("created_at", { ascending: false });
      if (status !== "all") query = query.eq("handled", status === "handled");
      if (type !== "all") query = query.eq("type", type);
      const s = cleanSearch(q);
      if (s) query = query.or(["name", "email", "phone", "subject", "message", "service"].map((c) => `${c}.ilike.%${s}%`).join(","));
      const { data, error, count } = await query.range((page - 1) * PAGE, page * PAGE - 1);
      if (error) throw error;
      return { rows: data, total: count ?? 0 };
    },
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
    void qc.invalidateQueries({ queryKey: ["admin", "pending-inquiries"] });
    void qc.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
    void qc.invalidateQueries({ queryKey: ["admin", "recent-inquiries"] });
  };

  const setHandled = useMutation({
    mutationFn: async ({ id, handled }: { id: string; handled: boolean }) => {
      const { error } = await supabase.from("inquiries").update({ handled }).eq("id", id);
      if (error) throw error;
      return handled;
    },
    onSuccess: (handled) => {
      toast.success(handled ? "Marked as handled" : "Moved back to pending");
      setViewing((v) => (v ? { ...v, handled } : v));
      refresh();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inquiries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inquiry deleted");
      setDeleting(null);
      setViewing(null);
      refresh();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const reset = (fn: () => void) => { fn(); setPage(1); };
  const rows = list.data?.rows ?? [];

  return (
    <>
      <PageHeader title="Inquiries" description="Appointment requests and messages sent from the website." />

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row">
          <SearchBox value={search} onChange={(v) => reset(() => setSearch(v))} placeholder="Search name, phone, email, message…" />
          <select aria-label="Filter by status" value={status} onChange={(e) => reset(() => setStatus(e.target.value as typeof status))} className={`${fieldCls} sm:w-40`}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="handled">Handled</option>
          </select>
          <select aria-label="Filter by type" value={type} onChange={(e) => reset(() => setType(e.target.value as typeof type))} className={`${fieldCls} sm:w-44`}>
            <option value="all">All types</option>
            <option value="appointment">Appointments</option>
            <option value="contact">Messages</option>
          </select>
        </div>

        {list.isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : list.isError ? (
          <ErrorNote message={errMessage(list.error, "Couldn't load inquiries.")} onRetry={() => void list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon={<Inbox />} title={q || status !== "all" || type !== "all" ? "No matches" : "No inquiries yet"} text={q || status !== "all" || type !== "all" ? "Try a different search or filter." : "When someone books a visit or sends a message on the website, it appears here."} />
        ) : (
          <div className={list.isFetching ? "opacity-60 transition" : "transition"}>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Received</th>
                    <th className="px-5 py-3 font-semibold">Who</th>
                    <th className="px-5 py-3 font-semibold">What</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((i) => (
                    <tr key={i.id} className="align-top transition hover:bg-muted/40">
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{fmtDate(i.created_at)}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">{i.name}</p>
                        <p className="text-muted-foreground">{i.phone || i.email}</p>
                      </td>
                      <td className="max-w-xs px-5 py-4">
                        <Badge variant="outline" className="mb-1.5 gap-1">
                          {i.type === "appointment" ? <CalendarCheck className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                          {i.type === "appointment" ? "Appointment" : "Message"}
                        </Badge>
                        <p className="truncate text-muted-foreground">{i.type === "appointment" ? [i.service, i.preferred_date && fmtDate(i.preferred_date)].filter(Boolean).join(" · ") || "—" : i.subject || i.message}</p>
                      </td>
                      <td className="px-5 py-4"><Badge variant={i.handled ? "secondary" : "destructive"}>{i.handled ? "Handled" : "Pending"}</Badge></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="View details" onClick={() => setViewing(i)}><Eye /></Button>
                          <Button variant="ghost" size="icon" aria-label={i.handled ? "Mark pending" : "Mark handled"} onClick={() => setHandled.mutate({ id: i.id, handled: !i.handled })}>
                            {i.handled ? <RotateCcw /> : <CheckCircle2 />}
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Delete" className="text-destructive hover:text-destructive" onClick={() => setDeleting(i)}><Trash2 /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y md:hidden">
              {rows.map((i) => (
                <li key={i.id} className="p-5">
                  <button className="block w-full text-left" onClick={() => setViewing(i)}>
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-foreground">{i.name}</span>
                      <Badge variant={i.handled ? "secondary" : "destructive"}>{i.handled ? "Handled" : "Pending"}</Badge>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{i.phone || i.email}</span>
                    <span className="mt-2 block text-sm text-muted-foreground">
                      {i.type === "appointment" ? `Appointment${i.service ? ` · ${i.service}` : ""}` : i.subject || i.message}
                    </span>
                    <span className="mt-2 block text-xs text-muted-foreground">{fmtDateTime(i.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Pager page={page} pageSize={PAGE} total={list.data?.total ?? 0} onPage={setPage} />
      </Panel>

      {/* Details */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-3xl text-primary">{viewing.name}</DialogTitle>
                <DialogDescription>
                  {viewing.type === "appointment" ? "Appointment request" : "Message"} · received {fmtDateTime(viewing.created_at)}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2.5 text-sm">
                {viewing.phone && (<><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{viewing.phone}</dd></>)}
                {viewing.email && (<><dt className="text-muted-foreground">Email</dt><dd className="break-all font-medium">{viewing.email}</dd></>)}
                {viewing.service && (<><dt className="text-muted-foreground">Service</dt><dd className="font-medium">{viewing.service}</dd></>)}
                {viewing.preferred_date && (<><dt className="text-muted-foreground">Preferred day</dt><dd className="font-medium">{fmtDate(viewing.preferred_date)}</dd></>)}
                {viewing.subject && (<><dt className="text-muted-foreground">Subject</dt><dd className="font-medium">{viewing.subject}</dd></>)}
                <dt className="text-muted-foreground">Status</dt>
                <dd><Badge variant={viewing.handled ? "secondary" : "destructive"}>{viewing.handled ? "Handled" : "Pending"}</Badge></dd>
              </dl>
              {viewing.message && (
                <div className="rounded-2xl border-l-4 border-gold bg-muted/60 p-4 text-sm">
                  <p className="whitespace-pre-wrap">{viewing.message}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {viewing.phone && <Button asChild variant="outline" size="sm" className="rounded-full"><a href={telHref(viewing.phone)}><Phone /> Call</a></Button>}
                {viewing.phone && <Button asChild variant="outline" size="sm" className="rounded-full"><a href={waHref(viewing.phone)} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>}
                {viewing.email && <Button asChild variant="outline" size="sm" className="rounded-full"><a href={`mailto:${viewing.email}`}><Mail /> Email</a></Button>}
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
                <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleting(viewing)}><Trash2 /> Delete</Button>
                <Button className="rounded-full" disabled={setHandled.isPending} onClick={() => setHandled.mutate({ id: viewing.id, handled: !viewing.handled })}>
                  {viewing.handled ? <><RotateCcw /> Move back to pending</> : <><CheckCircle2 /> Mark as handled</>}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this inquiry?</AlertDialogTitle>
            <AlertDialogDescription>The message from {deleting?.name} will be removed permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleting && remove.mutate(deleting.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
