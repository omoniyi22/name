# De-Yula admin console — setup

The old Express/Prisma admin has been rebuilt inside this project on **Supabase only** (no separate server).
Everything lives under `/admin`.

## 1. Run the database setup (once)

Run `drizzle/migrations/0001_admin_suite.sql` against your Supabase database
(Supabase dashboard → SQL Editor → paste → Run; or ask Lovable to apply it as a migration).
It is safe to run twice. It creates: admin accounts, contacts, tags, inquiries, newsletter history,
settings, the public-form functions, and the `newsletter-images` storage bucket, all locked down with row-level security.

The owner email `omoniyioluwaseun22@gmail.com` automatically becomes the first **super admin**.
If that account does not exist yet, create it in Supabase → Authentication → Users (add user, tick auto-confirm).

## 2. Server environment variables (for email only)

Inquiries, contacts and the whole admin work without these. They are only needed to send email
(new-inquiry alerts, newsletters, admin welcome emails). See `.env.example`.

| Variable | Purpose |
|---|---|
| `MAILJET_API_KEY`, `MAILJET_API_SECRET` | Mailjet credentials |
| `NOTIFY_FROM_EMAIL` | A sender address verified in Mailjet |
| `NOTIFY_FROM_NAME` | Optional display name (default "De-Yula Hospital") |
| `PUBLIC_SITE_URL` | Optional. Public site URL used in unsubscribe links, e.g. `https://deyulahospital.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Needed for creating admins and sending newsletters. Already provided by Lovable Cloud; add it yourself on other hosts. Never expose it to the browser. |

The **Settings** page shows whether email is ready.

## 3. What's in the console

| Page | What it does |
|---|---|
| Dashboard | Totals, pending inquiries, latest messages |
| Inquiries | Appointment requests and messages from the website: search, filter, view, call/WhatsApp/email, mark handled, delete |
| Contacts | Search, subscribed filter, tag filter, add, tag, subscribe toggle, delete |
| Tags | Create, rename, delete, usage counts |
| Newsletter | Compose with live preview, image upload, button, tag targeting, test send, send, history |
| Contact details | The numbers, emails, socials and address shown on the public site |
| Settings | Inquiry-alert email address, email status |
| Admins (super admin only) | Create admins, activate/deactivate (blocks sign-in), promote, reset password, delete |
| Profile | Change your password |
| Forgot / reset password | Email reset link at `/admin/forgot-password` |

## 4. Public site changes

- Hero on the home page now shows the De-Yula sign post (`src/assets/signpost.jpg`).
- The Contact and Appointment forms now save to Inquiries (and email the notification address).
- Footer has a newsletter sign-up. Every newsletter has a one-click unsubscribe link (`/unsubscribe/<id>`).
- People who only send a message/appointment are saved as contacts but **not** subscribed to the newsletter.

## Notes

- Newsletters send in batches of 50 per call; very large lists (thousands) may need a host with higher request limits.
- Password reset emails come from Supabase Auth's own email settings, not Mailjet.
- Admin passwords must be at least 8 characters.
