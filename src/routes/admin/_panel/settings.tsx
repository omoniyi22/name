import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMailStatus } from "@/lib/admin.functions";
import { errMessage } from "@/lib/admin-format";
import { ErrorNote, fieldCls, labelCls, PageHeader, Panel } from "@/components/admin/parts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/_panel/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_settings").select("notify_email").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data?.notify_email ?? "";
    },
  });
  const mail = useQuery({ queryKey: ["admin", "mail-status"], queryFn: () => getMailStatus() });
  const [email, setEmail] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { if (settings.data !== undefined && !loaded) { setEmail(settings.data); setLoaded(true); } }, [settings.data, loaded]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("admin_settings").upsert({ id: 1, notify_email: email.trim() || null, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Settings saved"); void qc.invalidateQueries({ queryKey: ["admin", "settings"] }); },
    onError: (e) => toast.error(errMessage(e)),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate(); };

  return (
    <>
      <PageHeader title="Settings" description="Where new-inquiry alerts go, and whether email sending is ready." />
      <div className="grid max-w-3xl gap-6">
        <Panel className="p-6 sm:p-8">
          <h2 className="text-2xl text-primary">Inquiry notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every new appointment request or message is emailed to this address.</p>
          {settings.isError ? (
            <ErrorNote message={errMessage(settings.error)} onRetry={() => void settings.refetch()} />
          ) : settings.isLoading ? (
            <Skeleton className="mt-6 h-12 w-full" />
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className={labelCls}>Notification email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="inbox@deyulahospital.com" className={`${fieldCls} mt-2`} />
              </label>
              <p className="text-xs text-muted-foreground">Leave empty to use the main email from Contact details.</p>
              <Button type="submit" className="rounded-full" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Save</Button>
            </form>
          )}
        </Panel>

        <Panel className="p-6 sm:p-8">
          <h2 className="text-2xl text-primary">Email sending</h2>
          {mail.isLoading ? (
            <Skeleton className="mt-4 h-10 w-full" />
          ) : mail.data?.ready ? (
            <p className="mt-3 flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Ready. Emails are sent from <strong>{mail.data.fromEmail}</strong>.</p>
          ) : (
            <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p>Not set up. Inquiries are still saved, but no emails go out. Add <code>MAILJET_API_KEY</code>, <code>MAILJET_API_SECRET</code> and <code>NOTIFY_FROM_EMAIL</code> to the server environment (see the README).</p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
