// Server functions that need the Supabase service role (create/delete login accounts,
// send email, read all subscribers). Everything else in the admin talks to Supabase
// directly from the browser under row-level security.
//
// NOTE: this file is bundled for the client too, so server-only modules are loaded
// with dynamic import() inside the handlers.
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireAdminAuth, requireSuperAdminAuth } from "@/lib/admin-middleware";

const origin = z.string().url().max(300);
const uuid = z.string().uuid();

function generatePassword(length = 14) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => chars[n % chars.length]).join("");
}

function siteUrl(fallbackOrigin?: string) {
  const configured = process.env["PUBLIC_SITE_URL"];
  if (configured) return configured.replace(/\/+$/, "");
  if (fallbackOrigin) return fallbackOrigin.replace(/\/+$/, "");
  try {
    return new URL(getRequest().url).origin;
  } catch {
    return "";
  }
}

/* ────────────────────────────── Admin accounts ────────────────────────────── */

export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireSuperAdminAuth])
  .inputValidator(
    z.object({
      email: z.string().trim().email().max(200),
      password: z.string().min(8, "Password must be at least 8 characters.").max(72).optional(),
      isSuperAdmin: z.boolean().default(false),
      notifyByEmail: z.boolean().default(true),
      origin,
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const password = data.password ?? generatePassword();

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !created.user) {
      const msg = error?.message ?? "";
      if (/already|exists|registered/i.test(msg)) throw new Error("An account with this email already exists.");
      throw new Error(msg || "Could not create the account.");
    }

    const { error: profileError } = await supabaseAdmin.from("admin_profiles").upsert(
      {
        user_id: created.user.id,
        email,
        is_active: true,
        is_super_admin: data.isSuperAdmin,
        created_by: context.userId,
      },
      { onConflict: "user_id" },
    );
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id); // don't leave a login with no role
      throw new Error("Could not save the admin profile. Nothing was created.");
    }

    let emailSent = false;
    let emailError: string | null = null;
    if (data.notifyByEmail) {
      try {
        const { sendMail, escapeHtml } = await import("@/lib/mailer.server");
        await sendMail({
          to: email,
          subject: "Your De-Yula Hospital admin account",
          html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:560px">
            <h2 style="color:#2f5d50">Your admin account is ready</h2>
            <p>An admin account has been created for you on the De-Yula Hospital website.</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Temporary password:</strong> ${escapeHtml(password)}</p>
            <p><a href="${escapeHtml(siteUrl(data.origin))}/admin/login">Sign in here</a> and change your password straight away from your Profile page.</p>
            ${data.isSuperAdmin ? "<p><strong>This account has super admin access.</strong></p>" : ""}
          </div>`,
        });
        emailSent = true;
      } catch (e) {
        emailError = e instanceof Error ? e.message : "Email could not be sent.";
      }
    }

    return {
      userId: created.user.id,
      email,
      // Only echo a password back when we generated it, so the super admin can pass it on.
      generatedPassword: data.password ? null : password,
      emailSent,
      emailError,
    };
  });

export const updateAdmin = createServerFn({ method: "POST" })
  .middleware([requireSuperAdminAuth])
  .inputValidator(
    z.object({ userId: uuid, isActive: z.boolean().optional(), isSuperAdmin: z.boolean().optional() }),
  )
  .handler(async ({ data, context }) => {
    // Blocking self-edits also guarantees a super admin always remains (the caller is one).
    if (data.userId === context.userId) throw new Error("You can't change your own account here.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: target } = await supabaseAdmin
      .from("admin_profiles")
      .select("user_id")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!target) throw new Error("Admin not found.");

    if (data.isActive !== undefined) {
      // A deactivated admin is also blocked from signing in at all.
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        ban_duration: data.isActive ? "none" : "876000h",
      });
      if (error) throw new Error(error.message);
    }

    const patch: { is_active?: boolean; is_super_admin?: boolean } = {};
    if (data.isActive !== undefined) patch.is_active = data.isActive;
    if (data.isSuperAdmin !== undefined) patch.is_super_admin = data.isSuperAdmin;
    if (Object.keys(patch).length) {
      const { error } = await supabaseAdmin.from("admin_profiles").update(patch).eq("user_id", data.userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const resetAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSuperAdminAuth])
  .inputValidator(
    z.object({
      userId: uuid,
      newPassword: z.string().min(8, "Password must be at least 8 characters.").max(72).optional(),
      notifyByEmail: z.boolean().default(true),
      origin,
    }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin
      .from("admin_profiles")
      .select("email")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!target) throw new Error("Admin not found.");

    const password = data.newPassword ?? generatePassword();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password });
    if (error) throw new Error(error.message);

    let emailSent = false;
    let emailError: string | null = null;
    if (data.notifyByEmail) {
      try {
        const { sendMail, escapeHtml } = await import("@/lib/mailer.server");
        await sendMail({
          to: target.email,
          subject: "Your De-Yula Hospital admin password was reset",
          html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:560px">
            <h2 style="color:#2f5d50">Password reset</h2>
            <p>A super admin reset your password.</p>
            <p><strong>New temporary password:</strong> ${escapeHtml(password)}</p>
            <p><a href="${escapeHtml(siteUrl(data.origin))}/admin/login">Sign in</a> and change it from your Profile page.</p>
          </div>`,
        });
        emailSent = true;
      } catch (e) {
        emailError = e instanceof Error ? e.message : "Email could not be sent.";
      }
    }
    return { email: target.email, generatedPassword: data.newPassword ? null : password, emailSent, emailError };
  });

export const deleteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSuperAdminAuth])
  .inputValidator(z.object({ userId: uuid }))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("You can't delete your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId); // profile cascades
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ──────────────────────────────── Newsletter ──────────────────────────────── */

const newsletterInput = z.object({
  subject: z.string().trim().min(1).max(200),
  html: z.string().min(1).max(200_000),
  origin,
});

export const getMailStatus = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const { mailConfig } = await import("@/lib/mailer.server");
    const cfg = mailConfig();
    return { ready: cfg.ready, fromEmail: cfg.fromEmail ?? null };
  });

export const sendNewsletter = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator(newsletterInput.extend({ tagIds: z.array(uuid).max(100).optional() }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { mailConfig, sendBulk, MailNotConfiguredError } = await import("@/lib/mailer.server");
    if (!mailConfig().ready) throw new MailNotConfiguredError();

    // Page through recipients: the API returns at most 1,000 rows per request.
    const recipients: { id: string; email: string; name: string | null }[] = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data: rows, error } = await supabaseAdmin
        .rpc("newsletter_recipients", data.tagIds?.length ? { p_tag_ids: data.tagIds } : {})
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      recipients.push(...(rows ?? []));
      if (!rows || rows.length < PAGE) break;
    }
    if (recipients.length === 0) throw new Error("No subscribed contacts match this selection.");

    const result = await sendBulk(recipients, data.subject, data.html, siteUrl(data.origin));

    const email = (context.claims as { email?: string }).email ?? null;
    const { error: historyError } = await supabaseAdmin.from("newsletter_history").insert({
      admin_id: context.userId,
      sent_by_email: email,
      subject: data.subject,
      html: data.html,
      recipient_count: recipients.length,
      sent_count: result.sent,
      failed_count: result.failed,
    });
    if (historyError) console.error("[newsletter] could not save history", historyError.message);

    return { recipients: recipients.length, sent: result.sent, failed: result.failed };
  });

export const sendTestNewsletter = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator(newsletterInput.extend({ email: z.string().trim().email().max(200) }))
  .handler(async ({ data }) => {
    const { mailConfig, sendBulk, MailNotConfiguredError } = await import("@/lib/mailer.server");
    if (!mailConfig().ready) throw new MailNotConfiguredError();
    const r = await sendBulk(
      [{ id: "00000000-0000-0000-0000-000000000000", email: data.email }],
      `[Test] ${data.subject}`,
      data.html,
      siteUrl(data.origin),
    );
    if (r.sent < 1) throw new Error("The test email could not be delivered.");
    return { ok: true as const };
  });

/* ───────────────── Public: contact + appointment submissions ───────────────── */

const inquiryInput = z.object({
  type: z.enum(["contact", "appointment"]),
  name: z.string().trim().min(1, "Please enter your name.").max(200),
  email: z.string().trim().max(200).email("Please enter a valid email.").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().max(5000).optional(),
  service: z.string().trim().max(200).optional(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  website: z.string().max(500).optional(), // honeypot: real people leave this empty
});

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator(inquiryInput)
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const }; // bot: pretend it worked

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Only send fields that have a value (the database treats missing as "not given").
    const args: {
      p_type: string;
      p_name: string;
      p_email?: string;
      p_phone?: string;
      p_subject?: string;
      p_message?: string;
      p_service?: string;
      p_preferred_date?: string;
    } = { p_type: data.type, p_name: data.name };
    if (data.email) args.p_email = data.email;
    if (data.phone) args.p_phone = data.phone;
    if (data.subject) args.p_subject = data.subject;
    if (data.message) args.p_message = data.message;
    if (data.service) args.p_service = data.service;
    if (data.preferredDate) args.p_preferred_date = data.preferredDate;

    const { error } = await supabaseAdmin.rpc("submit_inquiry", args);
    if (error) {
      if (/rate_limited/.test(error.message)) throw new Error("Too many requests from you just now. Please try again in a little while, or call us.");
      if (/contact_required/.test(error.message)) throw new Error("Please give us a phone number or an email so we can reach you.");
      if (/message_required/.test(error.message)) throw new Error("Please write a short message.");
      if (/invalid_|too_long/.test(error.message)) throw new Error("Please check your details and try again.");
      console.error("[inquiry] insert failed", error.message);
      throw new Error("Something went wrong on our side. Please try again or call us.");
    }

    // Tell the hospital. A failed email must never fail the visitor's submission.
    try {
      const { mailConfig, sendMail, escapeHtml } = await import("@/lib/mailer.server");
      if (mailConfig().ready) {
        const [{ data: settings }, { data: details }] = await Promise.all([
          supabaseAdmin.from("admin_settings").select("notify_email").eq("id", 1).maybeSingle(),
          supabaseAdmin.from("contact_details").select("email").eq("id", 1).maybeSingle(),
        ]);
        const to = settings?.notify_email || details?.email || mailConfig().fromEmail;
        if (to) {
          const row = (label: string, value?: string) =>
            value ? `<p style="margin:6px 0"><strong>${label}:</strong> ${escapeHtml(value)}</p>` : "";
          const kind = data.type === "appointment" ? "Appointment request" : "Contact message";
          await sendMail({
            to,
            subject: `${kind} from ${data.name}`,
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:600px;margin:0 auto">
              <div style="background:#f6f4ee;padding:20px;border-radius:10px;border:1px solid #e6e1d3">
                <h2 style="color:#2f5d50;margin-top:0">${kind}</h2>
                ${row("Name", data.name)}${row("Phone", data.phone)}${row("Email", data.email)}
                ${row("Service", data.service)}${row("Preferred day", data.preferredDate)}${row("Subject", data.subject)}
                ${data.message ? `<div style="background:#fff;padding:14px;border-left:4px solid #c9a24b;margin-top:14px"><strong>Message</strong><p style="white-space:pre-wrap;margin:6px 0 0">${escapeHtml(data.message)}</p></div>` : ""}
              </div>
              <p style="font-size:12px;color:#888;text-align:center;margin-top:16px">Open the <a href="${escapeHtml(siteUrl())}/admin/inquiries">admin inquiries page</a> to mark it handled.</p>
            </div>`,
          });
        }
      }
    } catch (e) {
      console.error("[inquiry] notification email failed:", e instanceof Error ? e.message : e);
    }

    return { ok: true as const };
  });
