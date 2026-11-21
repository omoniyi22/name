import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-function guard: the caller must be signed in AND be an active admin.
 * Uses the caller's own token, so the database's is_admin() check is the single source of truth.
 */
export const requireAdminAuth = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("is_admin");
    if (error || !isAdmin) throw new Error("Forbidden: admin access required.");
    const { data: isSuper } = await context.supabase.rpc("is_super_admin");
    return next({ context: { isSuperAdmin: isSuper === true } });
  });

/** Same, but only super admins get through (managing other admin accounts). */
export const requireSuperAdminAuth = createMiddleware({ type: "function" })
  .middleware([requireAdminAuth])
  .server(async ({ next, context }) => {
    if (!context.isSuperAdmin) throw new Error("Forbidden: super admin access required.");
    return next();
  });
