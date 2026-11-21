import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Loader2, Plus, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/lib/admin-auth";
import { createAdmin, deleteAdmin, resetAdminPassword, updateAdmin } from "@/lib/admin.functions";
import { errMessage, fmtDate } from "@/lib/admin-format";
import { EmptyState, ErrorNote, fieldCls, labelCls, PageHeader, Pager, Panel, SearchBox, TableSkeleton } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/_panel/admins")({ component: AdminsPage });

type AdminRow = { user_id: string; email: string; is_active: boolean; is_super_admin: boolean; created_at: string; created_by: string | null };
type Credentials = { email: string; password: string; emailSent: boolean; emailError: string | null };
const PAGE = 10;

function AdminsPage() {
  const { isSuperAdmin, profile } = useAdminAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<AdminRow | null>(null);
  const [deleting, setDeleting] = useState<AdminRow | null>(null);
  const [creds, setCreds] = useState<Credentials | null>(null);

  const list = useQuery({
    queryKey: ["admin", "admins"],
    enabled: isSuperAdmin,
    queryFn: async (): Promise<AdminRow[]> => {
      const { data, error } = await supabase.from("admin_profiles").select("user_id, email, is_active, is_super_admin, created_at, created_by").order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin", "admins"] });

  const emailOf = useMemo(() => new Map((list.data ?? []).map((a) => [a.user_id, a.email])), [list.data]);
  const filtered = useMemo(
    () => (list.data ?? []).filter((a) => a.email.includes(search.trim().toLowerCase()) && (status === "all" || a.is_active === (status === "active"))),
    [list.data, search, status],
  );
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);

  const update = useMutation({
    mutationFn: (v: { userId: string; isActive?: boolean; isSuperAdmin?: boolean }) => updateAdmin({ data: v }),
    onSuccess: () => { toast.success("Admin updated"); refresh(); },
    onError: (e) => toast.error(errMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => deleteAdmin({ data: { userId } }),
    onSuccess: () => { toast.success("Admin deleted"); setDeleting(null); refresh(); },
    onError: (e) => toast.error(errMessage(e)),
  });

  if (!isSuperAdmin) {
    return (
      <>
        <PageHeader title="Admins" />
        <Panel><EmptyState icon={<ShieldCheck />} title="Super admins only" text="Ask a super admin if you need to add or change admin accounts." /></Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Admins"
        description="Who can sign in to this console. Deactivating an admin blocks their sign-in immediately."
        actions={<Button className="rounded-full" onClick={() => setCreating(true)}><UserPlus /> Add admin</Button>}
      />
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by email…" />
          <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }} className={`${fieldCls} sm:w-44`}>
            <option value="all">All admins</option><option value="active">Active</option><option value="inactive">Deactivated</option>
          </select>
        </div>
        {list.isLoading ? <TableSkeleton rows={4} cols={4} /> : list.isError ? (
          <ErrorNote message={errMessage(list.error)} onRetry={() => void list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon={<ShieldCheck />} title="No admins match" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 font-semibold">Admin</th><th className="px-5 py-3 font-semibold">Super</th><th className="px-5 py-3 font-semibold">Active</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((a) => {
                  const me = a.user_id === profile?.user_id;
                  return (
                    <tr key={a.user_id} className="transition hover:bg-muted/40">
                      <td className="px-5 py-4">
                        <div className="break-all font-semibold text-foreground">{a.email} {me && <Badge variant="outline" className="ml-1">You</Badge>}</div>
                        <p className="text-xs text-muted-foreground">Added {fmtDate(a.created_at)}{a.created_by && emailOf.get(a.created_by) ? ` by ${emailOf.get(a.created_by)}` : ""}</p>
                      </td>
                      <td className="px-5 py-4"><Switch disabled={me || update.isPending} checked={a.is_super_admin} aria-label={`Super admin: ${a.email}`} onCheckedChange={(v) => update.mutate({ userId: a.user_id, isSuperAdmin: v })} /></td>
                      <td className="px-5 py-4"><Switch disabled={me || update.isPending} checked={a.is_active} aria-label={`Active: ${a.email}`} onCheckedChange={(v) => update.mutate({ userId: a.user_id, isActive: v })} /></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label={`Reset password for ${a.email}`} onClick={() => setResetting(a)}><KeyRound /></Button>
                          <Button variant="ghost" size="icon" disabled={me} aria-label={`Delete ${a.email}`} className="text-destructive hover:text-destructive" onClick={() => setDeleting(a)}><Trash2 /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pageSize={PAGE} total={filtered.length} onPage={setPage} />
      </Panel>

      <CreateDialog open={creating} onOpenChange={setCreating} onCreated={(c) => { refresh(); setCreds(c); }} />
      <ResetDialog target={resetting} onClose={() => setResetting(null)} onDone={(c) => setCreds(c)} />
      <CredentialsDialog creds={creds} onClose={() => setCreds(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.email}?</AlertDialogTitle>
            <AlertDialogDescription>Their login is removed for good. They can no longer sign in.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleting && remove.mutate(deleting.user_id)}>Delete admin</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CreateDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (c: Credentials) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSuper, setIsSuper] = useState(false);
  const [notify, setNotify] = useState(true);

  const create = useMutation({
    mutationFn: () => createAdmin({ data: { email, ...(password ? { password } : {}), isSuperAdmin: isSuper, notifyByEmail: notify, origin: window.location.origin } }),
    onSuccess: (r) => {
      toast.success("Admin created");
      onOpenChange(false);
      setEmail(""); setPassword(""); setIsSuper(false); setNotify(true);
      onCreated({ email: r.email, password: r.generatedPassword ?? password, emailSent: r.emailSent, emailError: r.emailError });
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate(); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-primary">Add admin</DialogTitle>
            <DialogDescription>They can sign in straight away. Leave the password empty to generate a strong one.</DialogDescription>
          </DialogHeader>
          <label className={labelCls}>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${fieldCls} mt-1.5`} /></label>
          <label className={labelCls}>Password (optional)<input type="text" minLength={8} autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Auto-generate" className={`${fieldCls} mt-1.5`} /></label>
          <label className="flex items-center gap-3 text-sm"><Checkbox checked={isSuper} onCheckedChange={(v) => setIsSuper(v === true)} /> Make a super admin (can manage other admins)</label>
          <label className="flex items-center gap-3 text-sm"><Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} /> Email them their sign-in details</label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="rounded-full" disabled={create.isPending}>{create.isPending ? <Loader2 className="animate-spin" /> : <Plus />} Create admin</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetDialog({ target, onClose, onDone }: { target: AdminRow | null; onClose: () => void; onDone: (c: Credentials) => void }) {
  const [password, setPassword] = useState("");
  const [notify, setNotify] = useState(true);
  const reset = useMutation({
    mutationFn: () => resetAdminPassword({ data: { userId: target!.user_id, ...(password ? { newPassword: password } : {}), notifyByEmail: notify, origin: window.location.origin } }),
    onSuccess: (r) => {
      toast.success("Password reset");
      setPassword("");
      onClose();
      onDone({ email: r.email, password: r.generatedPassword ?? password, emailSent: r.emailSent, emailError: r.emailError });
    },
    onError: (e) => toast.error(errMessage(e)),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); reset.mutate(); };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-primary">Reset password</DialogTitle>
            <DialogDescription className="break-all">{target?.email}</DialogDescription>
          </DialogHeader>
          <label className={labelCls}>New password (optional)<input type="text" minLength={8} autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Auto-generate" className={`${fieldCls} mt-1.5`} /></label>
          <label className="flex items-center gap-3 text-sm"><Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} /> Email them the new password</label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="rounded-full" disabled={reset.isPending}>{reset.isPending && <Loader2 className="animate-spin" />} Reset password</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CredentialsDialog({ creds, onClose }: { creds: Credentials | null; onClose: () => void }) {
  const copy = async () => {
    if (!creds) return;
    try { await navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.password}`); toast.success("Copied"); } catch { toast.error("Couldn't copy. Select the text instead."); }
  };
  return (
    <Dialog open={!!creds} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-primary">Sign-in details</DialogTitle>
          <DialogDescription>This is the only time the password is shown. Share it securely.</DialogDescription>
        </DialogHeader>
        {creds && (
          <>
            <div className="rounded-2xl border bg-muted/60 p-4 text-sm">
              <p><span className="text-muted-foreground">Email:</span> <strong className="break-all">{creds.email}</strong></p>
              <p className="mt-1"><span className="text-muted-foreground">Password:</span> <strong className="select-all break-all font-mono">{creds.password}</strong></p>
            </div>
            <p className="text-sm text-muted-foreground">
              {creds.emailSent ? "They were also sent this by email." : creds.emailError ? `Email not sent: ${creds.emailError}` : "No email was sent."}
            </p>
          </>
        )}
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => void copy()}><Copy /> Copy</Button>
          <Button className="rounded-full" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
