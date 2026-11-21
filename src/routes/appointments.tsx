import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { honeypot, sendInquiryFromForm } from "@/lib/inquiry";
import newborn from "@/assets/newborn.jpg";
import { meta } from "@/components/site";
import { Reveal } from "@/components/wow";
import { ContactWays } from "@/components/contact-ways";
import { services } from "@/lib/data";

const title = "Book an Appointment — De-Yula Specialist Hospital, Lagos";
const desc = "Book an appointment or make an enquiry at De-Yula Specialist Hospital by phone, WhatsApp or email, or send a request online.";

export const Route = createFileRoute("/appointments")({
  head: () => ({
    meta: [
      ...meta(title, desc).meta,
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Appointments,
});

const options = ["Not sure — help me choose", ...services.map((s) => s.name)];

const next = [
  { t: "We get in touch", d: "Our team will contact you to confirm a time." },
  { t: "You come in", d: "Bring any past results or referral letters, if you have them." },
  { t: "You see your doctor", d: "Your doctor will listen, explain and agree the next steps with you." },
];

function Appointments() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true); setError("");
    try { await sendInquiryFromForm(form, "appointment"); form.reset(); setSent(true); }
    catch (err) { setError(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again or call us."); }
    finally { setBusy(false); }
  };
  const field = "mt-2 w-full rounded-xl border bg-background px-4 py-3 text-foreground outline-none transition focus:border-gold";
  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="eyebrow animate-rise">Book a visit</p>
          <h1 className="mt-5 animate-rise text-5xl leading-[1.05] text-primary md:text-6xl">Book your <em className="text-gold">appointment</em>.</h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">You can book or ask a question by phone, WhatsApp or email. You can also send a request using the form and our team will get in touch.</p>
          <img src={newborn} alt="Caring nurse at De-Yula Specialist Hospital" width={1024} height={1280} className="mt-10 hidden aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl lg:block" />
        </div>

        <div>
          {sent ? (
            <div className="animate-rise rounded-3xl border bg-card p-10 text-center shadow-xl">
              <p className="font-display text-6xl text-gold">✓</p>
              <h2 className="mt-4 text-3xl text-primary">Thank you — request received.</h2>
              <p className="mt-3 text-muted-foreground">Our team will get in touch to confirm your appointment.</p>
              <button onClick={() => setSent(false)} className="mt-6 text-sm font-semibold text-primary underline">Send another request</button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="relative rounded-3xl border bg-card p-8 shadow-xl md:p-10">
              {honeypot}
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold text-primary">Full name<input required name="name" maxLength={200} className={field} placeholder="Your name" /></label>
                <label className="text-sm font-semibold text-primary">Phone<input required name="phone" maxLength={50} type="tel" className={field} placeholder="+234…" /></label>
              </div>
              <label className="mt-5 block text-sm font-semibold text-primary">Email<input name="email" maxLength={200} type="email" className={field} placeholder="you@email.com" /></label>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold text-primary">Service
                  <select name="service" className={field}>{options.map((o) => <option key={o}>{o}</option>)}</select>
                </label>
                <label className="text-sm font-semibold text-primary">Preferred day<input type="date" name="preferredDate" required className={field} /></label>
              </div>
              <label className="mt-5 block text-sm font-semibold text-primary">Reason for your visit (optional)<textarea name="message" maxLength={5000} rows={4} className={field} placeholder="A few words help us prepare for your visit" /></label>
              {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={busy} className="mt-7 w-full rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">{busy ? "Sending…" : "Request my appointment →"}</button>
            </form>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <Reveal>
          <p className="eyebrow">Other ways to book</p>
          <h2 className="mt-4 text-4xl text-primary md:text-5xl">Phone, WhatsApp or email.</h2>
        </Reveal>
        <div className="mt-10"><ContactWays /></div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="eyebrow">What happens next</p>
          <h2 className="mt-4 text-4xl text-primary md:text-5xl">Three simple steps.</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {next.map((n, i) => (
            <Reveal key={n.t}>
              <div className="h-full rounded-3xl border bg-card p-8">
                <p className="font-display text-5xl text-gold">0{i + 1}</p>
                <h3 className="mt-5 text-2xl text-primary">{n.t}</h3>
                <p className="mt-2 text-muted-foreground">{n.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
