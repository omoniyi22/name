import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Mail, Send, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMailStatus, sendNewsletter, sendTestNewsletter } from "@/lib/admin.functions";
import { useContactDetails } from "@/lib/contact";
import { errMessage, fmtDateTime } from "@/lib/admin-format";
import { EmptyState, ErrorNote, fieldCls, labelCls, PageHeader, Pager, Panel, TableSkeleton } from "@/components/admin/parts";
import { useAllTags } from "@/lib/admin-queries";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/_panel/newsletter")({ component: NewsletterPage });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const safeUrl = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : "");
const HISTORY_PAGE = 8;

function buildEmail(p: { title: string; body: string; imageUrl: string; ctaLabel: string; ctaUrl: string; address: string }) {
  const paragraphs = p.body.trim().split(/\n{2,}/).map((x) => `<p style="margin:0 0 16px">${esc(x).replace(/\n/g, "<br/>")}</p>`).join("");
  const image = p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="" style="width:100%;max-width:560px;border-radius:12px;margin:0 0 24px;display:block"/>` : "";
  const url = safeUrl(p.ctaUrl);
  const cta = p.ctaLabel.trim() && url
    ? `<div style="text-align:center;margin:32px 0"><a href="${esc(url)}" style="background:#2f5d50;color:#fff;padding:13px 28px;text-decoration:none;border-radius:999px;font-weight:bold;display:inline-block">${esc(p.ctaLabel.trim())}</a></div>`
    : "";
  return `<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;color:#334155">
<div style="border-bottom:1px solid #eee;padding-bottom:16px;text-align:center"><span style="font-size:12px;letter-spacing:2px;color:#2f5d50;font-weight:bold;text-transform:uppercase">De-Yula Hospital</span></div>
<h1 style="font-size:28px;margin:24px 0 16px;color:#1e293b;line-height:1.2">${esc(p.title || "Newsletter title")}</h1>
${image}<div style="font-size:16px;line-height:1.6">${paragraphs}</div>${cta}
<div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#64748b;text-align:center"><p style="margin:0 0 6px">You're receiving this because you contacted or subscribed to De-Yula Hospital.</p>${p.address ? `<p style="margin:0 0 6px">${esc(p.address)}</p>` : ""}<p style="margin:0">{{unsubscribe_link}}</p></div></div>`;
}

function NewsletterPage() {
  const qc = useQueryClient();
  const details = useContactDetails();
  const tags = useAllTags();
  const mail = useQuery({ queryKey: ["admin", "mail-status"], queryFn: () => getMailStatus() });
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [histPage, setHistPage] = useState(1);
  const [viewing, setViewing] = useState<{ subject: string; html: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const html = useMemo(
    () => buildEmail({ title, body, imageUrl, ctaLabel, ctaUrl, address: details.data?.address ?? "" }),
    [title, body, imageUrl, ctaLabel, ctaUrl, details.data?.address],
  );
  const previewHtml = html.replace("{{unsubscribe_link}}", '<span style="text-decoration:underline">unsubscribe here</span>');

  const recipients = useQuery({
    queryKey: ["admin", "recipients", tagIds],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("newsletter_recipient_count", tagIds.length ? { p_tag_ids: tagIds } : {});
      if (error) throw error;
      return Number(data);
    },
  });

  const history = useQuery({
    queryKey: ["admin", "newsletter-history", histPage],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error, count } = await supabase.from("newsletter_history").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((histPage - 1) * HISTORY_PAGE, histPage * HISTORY_PAGE - 1);
      if (error) throw error;
      return { rows: data, total: count ?? 0 };
    },
  });

  const upload = async (file: File) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) { toast.error("Choose a PNG, JPG, WebP or GIF image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB."); return; }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("newsletter-images").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    setUploading(false);
    if (error) { toast.error(errMessage(error, "Upload failed")); return; }
    setImageUrl(supabase.storage.from("newsletter-images").getPublicUrl(path).data.publicUrl);
    toast.success("Image added");
  };

  const valid = !!(subject.trim() && title.trim() && body.trim());
  const input = () => ({ subject: subject.trim(), html, origin: window.location.origin });

  const test = useMutation({
    mutationFn: () => sendTestNewsletter({ data: { ...input(), email: testEmail.trim() } }),
    onSuccess: () => toast.success(`Test sent to ${testEmail.trim()}`),
    onError: (e) => toast.error(errMessage(e)),
  });
  const send = useMutation({
    mutationFn: () => sendNewsletter({ data: { ...input(), ...(tagIds.length ? { tagIds } : {}) } }),
    onSuccess: (r) => {
      setConfirming(false);
      if (r.failed) toast.warning(`Sent to ${r.sent} of ${r.recipients}. ${r.failed} failed.`);
      else toast.success(`Sent to ${r.sent} subscriber${r.sent === 1 ? "" : "s"}`);
      setSubject(""); setTitle(""); setBody(""); setImageUrl(""); setCtaLabel(""); setCtaUrl("");
      void qc.invalidateQueries({ queryKey: ["admin", "newsletter-history"] });
    },
    onError: (e) => { setConfirming(false); toast.error(errMessage(e)); },
  });

  const count = recipients.data ?? 0;
  const mailReady = mail.data?.ready !== false;

  return (
    <>
      <PageHeader title="Newsletter" description="Write an update and send it to everyone who subscribed, or just the people with certain tags." />

      {mail.data && !mail.data.ready && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>Email sending isn't set up yet, so you can write and preview but not send. See <strong>Settings</strong>.</p>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-2">
        <Panel className="space-y-5 p-6 sm:p-8">
          <label className={labelCls}>Email subject<input value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} placeholder="What's new at De-Yula" className={`${fieldCls} mt-2`} /></label>
          <label className={labelCls}>Headline<input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className={`${fieldCls} mt-2`} /></label>
          <label className={labelCls}>Message
            <textarea rows={9} value={body} onChange={(e) => setBody(e.target.value)} placeholder={"Write in plain text. A blank line starts a new paragraph."} className={`${fieldCls} mt-2`} />
          </label>

          <div>
            <span className={labelCls}>Image (optional)</span>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
            {imageUrl ? (
              <div className="relative mt-2 inline-block">
                <img src={imageUrl} alt="Newsletter header" className="max-h-40 rounded-xl border" />
                <button onClick={() => setImageUrl("")} aria-label="Remove image" className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="mt-2 rounded-full" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />} {uploading ? "Uploading…" : "Upload image"}
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelCls}>Button text<input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Book a visit" className={`${fieldCls} mt-2`} /></label>
            <label className={labelCls}>Button link<input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://…" className={`${fieldCls} mt-2`} /></label>
          </div>
          {ctaLabel.trim() && ctaUrl.trim() && !safeUrl(ctaUrl) && <p className="-mt-2 text-xs text-destructive">The link must start with http:// or https://, otherwise the button is left out.</p>}

          <div>
            <span className={labelCls}>Send to</span>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => setTagIds([])} aria-pressed={!tagIds.length} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${!tagIds.length ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40"}`}>Everyone subscribed</button>
              {tags.data?.map((t) => {
                const on = tagIds.includes(t.id);
                return <button key={t.id} onClick={() => setTagIds((x) => (on ? x.filter((i) => i !== t.id) : [...x, t.id]))} aria-pressed={on} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${on ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40"}`}>{t.name}</button>;
              })}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {recipients.isLoading ? "Counting…" : <><strong className="text-foreground">{count}</strong> subscriber{count === 1 ? "" : "s"} will receive this.</>}
            </p>
          </div>

          <div className="space-y-3 border-t pt-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Send a test to…" aria-label="Test email address" className={fieldCls} />
              <Button variant="outline" className="rounded-full" disabled={!valid || !testEmail.trim() || test.isPending || !mailReady} onClick={() => test.mutate()}>
                {test.isPending ? <Loader2 className="animate-spin" /> : <Mail />} Send test
              </Button>
            </div>
            <Button size="lg" className="w-full rounded-full" disabled={!valid || count === 0 || send.isPending || !mailReady} onClick={() => setConfirming(true)}>
              {send.isPending ? <Loader2 className="animate-spin" /> : <Send />} Send to {count} subscriber{count === 1 ? "" : "s"}
            </Button>
            {!valid && <p className="text-center text-xs text-muted-foreground">Add a subject, headline and message to enable sending.</p>}
          </div>
        </Panel>

        <div>
          <p className="eyebrow mb-3">Live preview</p>
          <div className="sticky top-6 overflow-hidden rounded-3xl border bg-muted p-3 shadow-inner">
            <iframe title="Newsletter preview" sandbox="" srcDoc={`<body style="margin:0;background:#fff">${previewHtml}</body>`} className="h-[640px] w-full rounded-2xl bg-white" />
          </div>
        </div>
      </div>

      <h2 className="mb-5 mt-14 text-3xl text-primary">Sent newsletters</h2>
      <Panel className="overflow-hidden">
        {history.isLoading ? <TableSkeleton rows={4} cols={4} /> : history.isError ? (
          <ErrorNote message={errMessage(history.error)} onRetry={() => void history.refetch()} />
        ) : !history.data?.rows.length ? (
          <EmptyState icon={<Mail />} title="Nothing sent yet" text="Newsletters you send will be listed here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 font-semibold">Sent</th><th className="px-5 py-3 font-semibold">Subject</th><th className="px-5 py-3 font-semibold">Delivered</th><th className="px-5 py-3 font-semibold">By</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y">
                {history.data.rows.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/40">
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{fmtDateTime(h.created_at)}</td>
                    <td className="px-5 py-4 font-semibold text-foreground">{h.subject}</td>
                    <td className="whitespace-nowrap px-5 py-4">{h.sent_count}/{h.recipient_count}{h.failed_count > 0 && <span className="ml-1 text-destructive">({h.failed_count} failed)</span>}</td>
                    <td className="px-5 py-4 text-muted-foreground">{h.sent_by_email ?? "—"}</td>
                    <td className="px-5 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => setViewing({ subject: h.subject, html: h.html })}>View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={histPage} pageSize={HISTORY_PAGE} total={history.data?.total ?? 0} onPage={setHistPage} />
      </Panel>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send to {count} subscriber{count === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>“{subject}” can't be recalled once it's sent. Did you send yourself a test first?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={send.isPending}>Not yet</AlertDialogCancel>
            <AlertDialogAction disabled={send.isPending} onClick={(e) => { e.preventDefault(); send.mutate(); }}>{send.isPending ? "Sending…" : "Send now"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display text-2xl text-primary">{viewing?.subject}</DialogTitle><DialogDescription>As it was sent</DialogDescription></DialogHeader>
          {viewing && <iframe title="Sent newsletter" sandbox="" srcDoc={`<body style="margin:0">${viewing.html}</body>`} className="h-[60vh] w-full rounded-xl border bg-white" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
