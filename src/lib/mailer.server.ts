// Server-only email helper (Mailjet REST API over fetch — works on Cloudflare/Node alike).
// Never import this from client code; load it inside server-function handlers:
//   const { sendMail } = await import("@/lib/mailer.server");
//
// Environment variables (set them in your host / Lovable Cloud secrets):
//   MAILJET_API_KEY, MAILJET_API_SECRET   – Mailjet credentials
//   NOTIFY_FROM_EMAIL                     – verified sender address
//   NOTIFY_FROM_NAME                      – sender display name (optional)

const MAILJET_URL = "https://api.mailjet.com/v3.1/send";

export type MailArgs = {
  to: string;
  toName?: string | undefined;
  subject: string;
  html: string;
  text?: string | undefined;
  headers?: Record<string, string> | undefined;
};

export function mailConfig() {
  const apiKey = process.env["MAILJET_API_KEY"];
  const apiSecret = process.env["MAILJET_API_SECRET"];
  const fromEmail = process.env["NOTIFY_FROM_EMAIL"];
  const fromName = process.env["NOTIFY_FROM_NAME"] || "De-Yula Hospital";
  return { apiKey, apiSecret, fromEmail, fromName, ready: !!(apiKey && apiSecret && fromEmail) };
}

export class MailNotConfiguredError extends Error {
  constructor() {
    super("Email is not set up yet. Add MAILJET_API_KEY, MAILJET_API_SECRET and NOTIFY_FROM_EMAIL to the server environment.");
    this.name = "MailNotConfiguredError";
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type MailjetResponse = { Messages?: { Status?: string }[] };

async function post(messages: unknown[]): Promise<{ ok: boolean; sent: number; failed: number }> {
  const cfg = mailConfig();
  if (!cfg.ready) throw new MailNotConfiguredError();

  const res = await fetch(MAILJET_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${cfg.apiKey}:${cfg.apiSecret}`)}`,
    },
    body: JSON.stringify({ Messages: messages }),
  });

  // Mailjet answers 200 when all messages were accepted and 400 with per-message
  // statuses when some were rejected; anything else means the whole call failed.
  let body: MailjetResponse | null = null;
  try {
    body = (await res.json()) as MailjetResponse;
  } catch {
    body = null;
  }
  if (body?.Messages?.length) {
    const sent = body.Messages.filter((m) => m.Status === "success").length;
    return { ok: sent === messages.length, sent, failed: messages.length - sent };
  }
  return res.ok
    ? { ok: true, sent: messages.length, failed: 0 }
    : { ok: false, sent: 0, failed: messages.length };
}

/** One transactional email. Throws if email is not configured or Mailjet rejects it. */
export async function sendMail(args: MailArgs): Promise<void> {
  const cfg = mailConfig();
  if (!cfg.ready) throw new MailNotConfiguredError();
  const result = await post([
    {
      From: { Email: cfg.fromEmail, Name: cfg.fromName },
      To: [{ Email: args.to, Name: args.toName ?? args.to }],
      Subject: args.subject,
      HTMLPart: args.html,
      TextPart: args.text ?? stripHtml(args.html),
      ...(args.headers ? { Headers: args.headers } : {}),
    },
  ]);
  if (!result.ok) throw new Error("The email provider rejected the message.");
}

export type Recipient = { id: string; email: string; name?: string | null };

/**
 * Newsletter send. Every recipient gets their own unsubscribe link:
 * - "{{unsubscribe_link}}" in the HTML is replaced with a link tag,
 * - otherwise a small footer with the link is appended.
 * Sent in chunks of 50 (Mailjet's per-call limit). Failures are counted, not thrown.
 */
export async function sendBulk(
  recipients: Recipient[],
  subject: string,
  html: string,
  siteUrl: string,
): Promise<{ sent: number; failed: number }> {
  const cfg = mailConfig();
  if (!cfg.ready) throw new MailNotConfiguredError();
  if (recipients.length === 0) return { sent: 0, failed: 0 };

  const base = siteUrl.replace(/\/+$/, "");
  const CHUNK = 50;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK);
    const messages = chunk.map((r) => {
      const unsubUrl = `${base}/unsubscribe/${r.id}`;
      const link = `<a href="${unsubUrl}" style="color:#2f5d50;text-decoration:underline;">unsubscribe here</a>`;
      const footer = `<div style="font-family:Helvetica,Arial,sans-serif;margin-top:40px;padding:20px 0;text-align:center;font-size:12px;color:#888;border-top:1px solid #ddd;">If you no longer wish to hear from us, you can ${link}.</div>`;
      const personal = html.includes("{{unsubscribe_link}}")
        ? html.replace(/\{\{unsubscribe_link\}\}/g, link)
        : html.includes("</body>")
          ? html.replace("</body>", `${footer}</body>`)
          : html + footer;
      return {
        From: { Email: cfg.fromEmail, Name: cfg.fromName },
        To: [{ Email: r.email, Name: r.name || r.email }],
        Subject: subject,
        HTMLPart: personal,
        TextPart: stripHtml(personal),
        Headers: { "List-Unsubscribe": `<${unsubUrl}>` },
      };
    });

    try {
      const r = await post(messages);
      sent += r.sent;
      failed += r.failed;
    } catch (err) {
      console.error("[mailer] bulk chunk failed", err instanceof Error ? err.message : err);
      failed += chunk.length;
    }
  }
  return { sent, failed };
}
