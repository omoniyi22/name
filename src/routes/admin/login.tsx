import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/lib/admin-auth";
import { AuthCard } from "@/components/admin/auth-card";
import { fieldCls, labelCls } from "@/components/admin/parts";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/login")({ component: LoginPage });

function LoginPage() {
  const { status, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "ready") void navigate({ to: "/admin", replace: true });
  }, [status, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(/invalid|credentials/i.test(error.message) ? "Wrong email or password." : error.message);
    setBusy(false);
  };

  if (status === "loading" || status === "ready") {
    return (
      <AuthCard title="Sign in">
        <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full rounded-full" /></div>
      </AuthCard>
    );
  }

  if (status === "forbidden") {
    return (
      <AuthCard title="No admin access" subtitle="You're signed in, but this account isn't an active admin account.">
        <button onClick={() => void signOut()} className="w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition hover:bg-primary/90">
          Sign out and try another account
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Manage inquiries, contacts, newsletters and site details."
      footer={<Link to="/" className="underline hover:text-gold">← Back to the website</Link>}
    >
      <form onSubmit={submit} className="space-y-5">
        <label className={labelCls}>
          Email
          <input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={`${fieldCls} mt-2`} />
        </label>
        <label className={labelCls}>
          Password
          <span className="relative mt-2 block">
            <input required type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${fieldCls} pr-11`} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm">
          <Link to="/admin/forgot-password" className="font-semibold text-primary underline">Forgot your password?</Link>
        </p>
      </form>
    </AuthCard>
  );
}
