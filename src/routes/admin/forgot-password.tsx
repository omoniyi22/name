import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/admin/auth-card";
import { fieldCls, labelCls } from "@/components/admin/parts";

export const Route = createFileRoute("/admin/forgot-password")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setBusy(false);
    // Same message whether or not the address exists, so this can't be used to probe accounts.
    if (error && /rate|too many|seconds/i.test(error.message)) setError("Please wait a minute before asking for another email.");
    else setSent(true);
  };

  return (
    <AuthCard
      title="Reset password"
      subtitle={sent ? undefined : "Enter your admin email and we'll send you a reset link."}
      footer={<Link to="/admin/login" className="underline hover:text-gold">← Back to sign in</Link>}
    >
      {sent ? (
        <div className="text-center">
          <MailCheck className="mx-auto h-12 w-12 text-gold" />
          <p className="mt-4 font-display text-2xl text-primary">Check your inbox</p>
          <p className="mt-2 text-sm text-muted-foreground">If that email belongs to an admin, a reset link is on its way. It can take a minute or two.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <label className={labelCls}>
            Email
            <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${fieldCls} mt-2`} />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
          </button>
        </form>
      )}
    </AuthCard>
  );
}
