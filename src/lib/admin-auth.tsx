import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AdminProfile = {
  user_id: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
};

type Status = "loading" | "signed-out" | "forbidden" | "ready";

type AdminAuth = {
  status: Status;
  session: Session | null;
  profile: AdminProfile | null;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AdminAuth | null>(null);

/** Wraps every /admin page. Signed in + an active row in admin_profiles = "ready". */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    const resolve = async (s: Session | null) => {
      if (cancelled) return;
      setSession(s);
      if (!s) {
        setProfile(null);
        setStatus("signed-out");
        return;
      }
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("user_id, email, is_active, is_super_admin")
        .eq("user_id", s.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data || !data.is_active) {
        setProfile(null);
        setStatus("forbidden");
        return;
      }
      setProfile(data);
      setStatus("ready");
    };

    // Don't call Supabase inside this callback directly (it can deadlock auth) — defer a tick.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setTimeout(() => void resolve(s), 0);
    });
    void supabase.auth.getSession().then(({ data }) => resolve(data.session));

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AdminAuth>(
    () => ({
      status,
      session,
      profile,
      isSuperAdmin: profile?.is_super_admin === true,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [status, session, profile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth(): AdminAuth {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminAuth must be used inside the /admin layout");
  return ctx;
}
