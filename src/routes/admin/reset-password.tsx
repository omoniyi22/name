import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/admin/auth-card";
import { fieldCls, labelCls } from "@/components/admin/parts";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/reset-password")({ component: ResetPage });

function ResetPage() {
  const navigate = useNavigate();
  // "checking" until Supabase has read the recovery link; "invalid" if none arrives.
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setState("ready");
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setState("ready");
    });
    const t = setTimeout(() => setState((s) => (s === "checking" ? "invalid" : s)), 4000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    await supabase.auth.signOut();
    toast.success("Password updated. Please sign in with your new password.");
    void navigate({ to: "/admin/login", replace: true });
  };

  return (
    <AuthCard title="Choose a new password" footer={<Link to="/admin/login" className="underline hover:text-gold">← Back to sign in</Link>}>
      {state === "checking" && <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>}
      {state === "invalid" && (
        <div className="text-center text-sm text-muted-foreground">
          <p>This reset link is invalid or has expired.</p>
          <Link to="/admin/forgot-password" className="mt-4 inline-block font-semibold text-primary underline">Get a new link</Link>
        </div>
      )}
      {state === "ready" && (
        <form onSubmit={submit} className="space-y-5">
          <label className={labelCls}>
            New password
            <input required type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${fieldCls} mt-2`} />
          </label>
          <label className={labelCls}>
            Confirm new password
            <input required type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${fieldCls} mt-2`} />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
          </button>
        </form>
      )}
    </AuthCard>
  );
}
