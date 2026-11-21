import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag as TagIcon, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMessage, fmtDate } from "@/lib/admin-format";
import { useDebounced } from "@/lib/use-debounced";
import { useAllTags, type TagLite } from "@/lib/admin-queries";
import { EmptyState, ErrorNote, fieldCls, labelCls, PageHeader, Pager, Panel, SearchBox, TableSkeleton } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/_panel/contacts")({ component: ContactsPage });

type ContactRow = {
  id: string; email: string; name: string | null; phone: string | null;
  subscribed: boolean; source: string | null; first_seen_at: string; last_seen_at: string; tags: TagLite[];
};
const PAGE = 20;

function ContactsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [sub, setSub] = useState<"all" | "yes" | "no">("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [tagging, setTagging] = useState<ContactRow | null>(null);
  const [deleting, setDeleting] = useState<ContactRow | null>(null);
  const tags = useAllTags();

  const list = useQuery({
    queryKey: ["admin", "contacts", { page, q, sub, tagFilter }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const args: { p_limit: number; p_offset: number; p_search?: string; p_subscribed?: boolean; p_tag_ids?: string[] } = {
        p_limit: PAGE,
        p_offset: (page - 1) * PAGE,
      };
      if (q.trim()) args.p_search = q.trim();
      if (sub !== "all") args.p_subscribed = sub === "yes";
      if (tagFilter.length) args.p_tag_ids = tagFilter;
      const { data, error } = await supabase.rpc("list_contacts", args);
      if (error) throw error;
      return data as unknown as { total: number; rows: ContactRow[] };
    },
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "contacts"] });
    void qc.invalidateQueries({ queryKey: ["admin", "tags"] });
    void qc.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
    void qc.invalidateQueries({ queryKey: ["admin", "recipients"] });
  };

  const toggleSub = useMutation({
    mutationFn: async ({ id, subscribed }: { id: string; subscribed: boolean }) => {
      const { error } = await supabase.from("contacts").update({ subscribed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Contact deleted"); setDeleting(null); refresh(); },
    onError: (e) => toast.error(errMessage(e)),
  });

  const rows = list.data?.rows ?? [];
  const filtered = !!(q || sub !== "all" || tagFilter.length);
  const reset = (fn: () => void) => { fn(); setPage(1); };

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Everyone who has subscribed, booked or messaged. Only subscribed contacts receive newsletters."
        actions={<Button className="rounded-full" onClick={() => setAdding(true)}><Plus /> Add contact</Button>}
      />

      <Panel className="overflow-hidden">
        <div className="space-y-3 border-b p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBox value={search} onChange={(v) => reset(() => setSearch(v))} placeholder="Search email, name or phone…" />
            <select aria-label="Filter by subscription" value={sub} onChange={(e) => reset(() => setSub(e.target.value as typeof sub))} className={`${fieldCls} sm:w-52`}>
              <option value="all">All contacts</option>
              <option value="yes">Subscribed only</option>
              <option value="no">Unsubscribed only</option>
            </select>
          </div>
          {!!tags.data?.length && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</span>
              {tags.data.map((t) => {
                const on = tagFilter.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => reset(() => setTagFilter((f) => (on ? f.filter((x) => x !== t.id) : [...f, t.id])))}
                    aria-pressed={on}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
                  >
                    {t.name}
                  </button>
                );
              })}
              {!!tagFilter.length && <button onClick={() => reset(() => setTagFilter([]))} className="text-xs font-semibold text-primary underline">Clear</button>}
            </div>
          )}
        </div>

        {list.isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : list.isError ? (
          <ErrorNote message={errMessage(list.error, "Couldn't load contacts.")} onRetry={() => void list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={filtered ? "No matches" : "No contacts yet"}
            text={filtered ? "Try a different search or filter." : "Contacts appear here when people subscribe, book a visit or send a message."}
            action={!filtered && <Button className="rounded-full" onClick={() => setAdding(true)}><Plus /> Add the first contact</Button>}
          />
        ) : (
          <div className={list.isFetching ? "opacity-60 transition" : "transition"}>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Contact</th>
                    <th className="px-5 py-3 font-semibold">Tags</th>
                    <th className="px-5 py-3 font-semibold">Source</th>
                    <th className="px-5 py-3 font-semibold">Subscribed</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((c) => (
                    <tr key={c.id} className="align-middle transition hover:bg-muted/40">
                      <td className="px-5 py-4">
                        <p className="break-all font-semibold text-foreground">{c.email}</p>
                        <p className="text-muted-foreground">{[c.name, c.phone].filter(Boolean).join(" · ") || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex max-w-56 flex-wrap gap-1.5">
                          {c.tags.length ? c.tags.map((t) => <Badge key={t.id} variant="secondary">{t.name}</Badge>) : <span className="text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        <span className="capitalize">{(c.source ?? "—").replace(/_/g, " ")}</span>
                        <span className="block text-xs">since {fmtDate(c.first_seen_at)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Switch checked={c.subscribed} aria-label={`Subscribed: ${c.email}`} onCheckedChange={(v) => toggleSub.mutate({ id: c.id, subscribed: v })} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="Edit tags" onClick={() => setTagging(c)}><TagIcon /></Button>
                          <Button variant="ghost" size="icon" aria-label="Delete contact" className="text-destructive hover:text-destructive" onClick={() => setDeleting(c)}><Trash2 /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y md:hidden">
              {rows.map((c) => (
                <li key={c.id} className="space-y-3 p-5">
                  <div>
                    <p className="break-all font-semibold text-foreground">{c.email}</p>
                    <p className="text-sm text-muted-foreground">{[c.name, c.phone].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  {!!c.tags.length && <div className="flex flex-wrap gap-1.5">{c.tags.map((t) => <Badge key={t.id} variant="secondary">{t.name}</Badge>)}</div>}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={c.subscribed} onCheckedChange={(v) => toggleSub.mutate({ id: c.id, subscribed: v })} /> Subscribed
                    </label>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" aria-label="Edit tags" onClick={() => setTagging(c)}><TagIcon /></Button>
                      <Button variant="ghost" size="icon" aria-label="Delete contact" className="text-destructive hover:text-destructive" onClick={() => setDeleting(c)}><Trash2 /></Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Pager page={page} pageSize={PAGE} total={list.data?.total ?? 0} onPage={setPage} />
      </Panel>

      <AddContactDialog open={adding} onOpenChange={setAdding} onDone={refresh} />
      <TagDialog contact={tagging} tags={tags.data ?? []} onClose={() => setTagging(null)} onDone={refresh} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this contact?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.email} will be removed permanently, along with their tags.</AlertDialogDescription>
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

function AddContactDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subscribed, setSubscribed] = useState(true);

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contacts").insert({
        email: email.trim().toLowerCase(),
        name: name.trim() || null,
        phone: phone.trim() || null,
        subscribed,
        source: "admin",
      });
      if (error) throw error.code === "23505" ? new Error("A contact with this email already exists.") : error;
    },
    onSuccess: () => {
      toast.success("Contact added");
      setEmail(""); setName(""); setPhone(""); setSubscribed(true);
      onOpenChange(false);
      onDone();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); add.mutate(); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-primary">Add contact</DialogTitle>
            <DialogDescription>Add someone by hand, for example from a paper sign-up sheet.</DialogDescription>
          </DialogHeader>
          <label className={labelCls}>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${fieldCls} mt-1.5`} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelCls}>Name<input value={name} onChange={(e) => setName(e.target.value)} className={`${fieldCls} mt-1.5`} /></label>
            <label className={labelCls}>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${fieldCls} mt-1.5`} /></label>
          </div>
          <label className="flex items-center gap-3 text-sm"><Switch checked={subscribed} onCheckedChange={setSubscribed} /> Subscribed to the newsletter</label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="rounded-full" disabled={add.isPending}>{add.isPending ? "Adding…" : "Add contact"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TagDialog({ contact, tags, onClose, onDone }: { contact: ContactRow | null; tags: TagLite[]; onClose: () => void; onDone: () => void }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [forId, setForId] = useState<string | null>(null);
  // Reset the selection whenever a different contact is opened.
  if (contact && contact.id !== forId) {
    setForId(contact.id);
    setChosen(contact.tags.map((t) => t.id));
  }
  if (!contact && forId) setForId(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!contact) return;
      const { error } = await supabase.rpc("set_contact_tags", { p_contact_id: contact.id, p_tag_ids: chosen });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Tags updated"); onClose(); onDone(); },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <Dialog open={!!contact} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-primary">Tags</DialogTitle>
          <DialogDescription className="break-all">{contact?.email}</DialogDescription>
        </DialogHeader>
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags exist yet. Create some on the Tags page first.</p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {tags.map((t) => (
              <li key={t.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted">
                  <Checkbox checked={chosen.includes(t.id)} onCheckedChange={(v) => setChosen((c) => (v ? [...c, t.id] : c.filter((x) => x !== t.id)))} />
                  {t.name}
                </label>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button className="rounded-full" disabled={save.isPending || tags.length === 0} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save tags"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
