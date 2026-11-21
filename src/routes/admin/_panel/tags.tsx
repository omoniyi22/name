import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMessage, fmtDate } from "@/lib/admin-format";
import { EmptyState, ErrorNote, fieldCls, labelCls, PageHeader, Pager, Panel, SearchBox, TableSkeleton } from "@/components/admin/parts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/_panel/tags")({ component: TagsPage });

type TagRow = { id: string; name: string; created_at: string; usage: number };
const PAGE = 10;

function TagsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<TagRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<TagRow | null>(null);

  const list = useQuery({
    queryKey: ["admin", "tags"],
    queryFn: async (): Promise<TagRow[]> => {
      const { data, error } = await supabase.from("tags").select("id, name, created_at, contact_tags(count)").order("name");
      if (error) throw error;
      return data.map((t) => ({ id: t.id, name: t.name, created_at: t.created_at, usage: t.contact_tags[0]?.count ?? 0 }));
    },
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "tags"] });
    void qc.invalidateQueries({ queryKey: ["admin", "tags-all"] });
    void qc.invalidateQueries({ queryKey: ["admin", "contacts"] });
  };

  const all = useMemo(() => list.data ?? [], [list.data]);
  const filtered = useMemo(() => all.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase())), [all, search]);
  const pageRows = filtered.slice((page - 1) * PAGE, page * PAGE);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Tag deleted"); setDeleting(null); refresh(); },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <>
      <PageHeader
        title="Tags"
        description="Group contacts (patients, staff, parents…) so a newsletter can go to just the right people."
        actions={<Button className="rounded-full" onClick={() => setEditing("new")}><Plus /> New tag</Button>}
      />

      <Panel className="overflow-hidden">
        <div className="border-b p-5">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search tags…" />
        </div>
        {list.isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : list.isError ? (
          <ErrorNote message={errMessage(list.error, "Couldn't load tags.")} onRetry={() => void list.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<TagIcon />}
            title={search ? "No matching tags" : "No tags yet"}
            text={search ? undefined : "Create your first tag, then assign it to contacts."}
            action={!search && <Button className="rounded-full" onClick={() => setEditing("new")}><Plus /> Create a tag</Button>}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Tag</th>
                <th className="px-5 py-3 font-semibold">Contacts</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Created</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pageRows.map((t) => (
                <tr key={t.id} className="transition hover:bg-muted/40">
                  <td className="px-5 py-4 font-semibold text-foreground">{t.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{t.usage}</td>
                  <td className="hidden px-5 py-4 text-muted-foreground sm:table-cell">{fmtDate(t.created_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Rename ${t.name}`} onClick={() => setEditing(t)}><Pencil /></Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${t.name}`} className="text-destructive hover:text-destructive" onClick={() => setDeleting(t)}><Trash2 /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pager page={page} pageSize={PAGE} total={filtered.length} onPage={setPage} />
      </Panel>

      <TagFormDialog target={editing} onClose={() => setEditing(null)} onDone={refresh} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.usage ? `It will be removed from ${deleting.usage} contact${deleting.usage === 1 ? "" : "s"}. The contacts themselves are kept.` : "No contacts use this tag."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleting && remove.mutate(deleting.id)}>Delete tag</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TagFormDialog({ target, onClose, onDone }: { target: TagRow | "new" | null; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [forKey, setForKey] = useState<string | null>(null);
  const key = target === null ? null : target === "new" ? "new" : target.id;
  if (key !== forKey) {
    setForKey(key);
    setName(target && target !== "new" ? target.name : "");
  }

  const save = useMutation({
    mutationFn: async () => {
      const value = name.trim();
      const res = target === "new"
        ? await supabase.from("tags").insert({ name: value })
        : await supabase.from("tags").update({ name: value }).eq("id", (target as TagRow).id);
      if (res.error) throw res.error.code === "23505" ? new Error("A tag with this name already exists.") : res.error;
    },
    onSuccess: () => { toast.success(target === "new" ? "Tag created" : "Tag renamed"); onClose(); onDone(); },
    onError: (e) => toast.error(errMessage(e)),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); if (name.trim()) save.mutate(); };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-primary">{target === "new" ? "New tag" : "Rename tag"}</DialogTitle>
            <DialogDescription>Up to 50 characters.</DialogDescription>
          </DialogHeader>
          <label className={labelCls}>Name<input autoFocus required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maternity patients" className={`${fieldCls} mt-1.5`} /></label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="rounded-full" disabled={save.isPending || !name.trim()}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
