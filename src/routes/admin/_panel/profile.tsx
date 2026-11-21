import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/lib/admin-auth";
import { fmtDate } from "@/lib/admin-format";
import { fieldCls, labelCls, PageHeader, Panel } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_panel/profile")({ component: ProfilePage });

function ProfilePage() {
  const { profile, isSuperAdmin, session } = useAdminAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (next.length < 8) return setError("Use at least 8 characters.");
    if (next !== confirm) return setError("The new passwords don't match.");
    if (next === current) return setError("Choose a password different from the current one.");
    setBusy(true);
    // Re-check the current password first so a borrowed, unlocked screen can't change it.
    const { error: authError } = await supabase.auth.signInWithPassword({ email: profile?.email ?? "", password: current });
    if (authError) { setBusy(false); return setError("Your current password is wrong."); }
    const { error: updError } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (updError) return setError(updError.message);
    setCurrent(""); setNext(""); setConfirm("");
    toast.success("Password changed");
  };

  return (
    <>
      <PageHeader title="Profile" description="Your account and password." />
      <div className="grid max-w-3xl gap-6">
        <Panel className="p-6 sm:p-8">
          <h2 className="text-2xl text-primary">Account</h2>
          <dl className="mt-4 grid grid-cols-[120px_1fr] gap-y-3 text-sm">
            <dt className="text-muted-foreground">Email</dt><dd className="break-all font-medium">{profile?.email}</dd>
            <dt className="text-muted-foreground">Role</dt><dd><Badge variant={isSuperAdmin ? "default" : "secondary"}>{isSuperAdmin ? "Super admin" : "Admin"}</Badge></dd>
            <dt className="text-muted-foreground">Last sign-in</dt><dd className="font-medium">{fmtDate(session?.user.last_sign_in_at)}</dd>
          </dl>
        </Panel>
        <Panel className="p-6 sm:p-8">
          <h2 className="text-2xl text-primary">Change password</h2>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className={labelCls}>Current password<input required type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={`${fieldCls} mt-2`} /></label>
            <label className={labelCls}>New password<input required type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={`${fieldCls} mt-2`} /></label>
            <label className={labelCls}>Confirm new password<input required type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${fieldCls} mt-2`} /></label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="rounded-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Update password</Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
