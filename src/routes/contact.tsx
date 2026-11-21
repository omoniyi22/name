import { createFileRoute, Link } from "@tanstack/react-router";
import { useContactDetails, linkHref } from "@/lib/contact";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, type FormEvent } from "react";
import { photos } from "@/lib/photos";
import { Btn, meta } from "@/components/site";
import { Reveal } from "@/components/wow";
import { ContactWays } from "@/components/contact-ways";
import { honeypot, sendInquiryFromForm } from "@/lib/inquiry";

const title = "Contact De-Yula Specialist Hospital — Phone, WhatsApp, email and location";
const desc = "Contact De-Yula Specialist Hospital in Ayobo, Lagos by phone, WhatsApp or email to book an appointment or ask a question.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      ...meta(title, desc).meta,
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function MessageForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true); setError("");
    try { await sendInquiryFromForm(form, "contact"); form.reset(); setSent(true); }
    catch (err) { setError(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again or call us."); }
    finally { setBusy(false); }
  };
  if (sent)
    return (
      <div className="animate-rise rounded-3xl border bg-card p-10 text-center shadow-xl">
        <p className="font-display text-6xl text-gold">✓</p>
        <h3 className="mt-4 text-3xl text-primary">Thank you — message received.</h3>
        <p className="mt-3 text-muted-foreground">Our team will get back to you as soon as possible.</p>
        <button onClick={() => setSent(false)} className="mt-6 text-sm font-semibold text-primary underline">Send another message</button>
      </div>
    );
  const field = "mt-2 w-full rounded-xl border bg-background px-4 py-3 text-foreground outline-none transition focus:border-gold";
  return (
    <form onSubmit={onSubmit} className="relative rounded-3xl border bg-card p-8 shadow-xl md:p-10">
      {honeypot}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-primary">Your name<input required name="name" maxLength={200} className={field} placeholder="Full name" /></label>
        <label className="text-sm font-semibold text-primary">Phone number<input required name="phone" maxLength={50} type="tel" className={field} placeholder="+234…" /></label>
      </div>
      <label className="mt-5 block text-sm font-semibold text-primary">Email<input name="email" maxLength={200} type="email" className={field} placeholder="you@email.com" /></label>
      <label className="mt-5 block text-sm font-semibold text-primary">What is it about?
        <select name="subject" className={field} defaultValue="Booking a visit">
          {["Booking a visit", "A question about a service", "Something else"].map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <label className="mt-5 block text-sm font-semibold text-primary">Your message<textarea required name="message" maxLength={5000} rows={5} className={field} placeholder="Tell us how we can help…" /></label>
      {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={busy} className="mt-7 w-full rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">{busy ? "Sending…" : "Send message →"}</button>
    </form>
  );
}

function ContactPage() {
  const { data: c, isLoading } = useContactDetails();
  const loading = isLoading || !c;
  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="eyebrow animate-rise">Contact · Ayobo, Lagos</p>
          <h1 className="mt-5 animate-rise text-5xl leading-[1.05] text-primary md:text-7xl">Get in <em className="text-gold">touch</em>.</h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">You can book an appointment or ask a question by phone, WhatsApp or email.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Btn to="/appointments">Book an appointment</Btn>
          </div>
        </div>
        <img src={photos.frontDesk} alt="Front desk at De-Yula Specialist Hospital" width={1600} height={1008} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl" />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <Reveal>
          <p className="eyebrow">Book or enquire</p>
          <h2 className="mt-4 max-w-3xl text-5xl text-primary md:text-6xl">Phone, WhatsApp or email.</h2>
        </Reveal>
        <div className="mt-14"><ContactWays /></div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {loading ? (
            <Skeleton className="h-11 w-36 rounded-full" />
          ) : (
            (c.instagram || c.facebook) && (
              <>
                <span className="text-sm text-muted-foreground">Follow us:</span>
                {c.instagram && <a href={linkHref(c.instagram, "https://instagram.com/")} target="_blank" rel="noreferrer" className="rounded-full border px-5 py-2.5 text-sm font-semibold text-primary transition hover:border-gold">Instagram</a>}
                {c.facebook && <a href={linkHref(c.facebook, "https://facebook.com/")} target="_blank" rel="noreferrer" className="rounded-full border px-5 py-2.5 text-sm font-semibold text-primary transition hover:border-gold">Facebook</a>}
              </>
            )
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow">Send us a message</p>
          <h2 className="mt-4 text-5xl text-primary md:text-6xl">Ask us anything.</h2>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">Leave a message with your phone number and our team will get back to you.</p>
          <ul className="mt-8 space-y-3">
            {["We reply as soon as we can", "Your details are kept private"].map((p) => (
              <li key={p} className="flex items-center gap-3 text-foreground"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-gold">✓</span>{p}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal><MessageForm /></Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <Reveal>
          <p className="eyebrow">Visit us</p>
          {loading ? (
            <div className="mt-4 space-y-3"><Skeleton className="h-14 w-full max-w-3xl" /><Skeleton className="h-14 w-2/3 max-w-xl" /></div>
          ) : (
            <h2 className="mt-4 max-w-3xl text-4xl text-primary md:text-5xl">{c.address}</h2>
          )}
        </Reveal>
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            {loading ? <Skeleton className="h-full min-h-[420px] w-full rounded-3xl" /> : <iframe
              title="Map to De-Yula Specialist Hospital"
              src={`https://www.google.com/maps?q=${encodeURIComponent(c.address)}&output=embed`}
              loading="lazy"
              className="h-full min-h-[420px] w-full rounded-3xl border shadow-xl"
            />}
          </Reveal>
          <img src={photos.building} alt="De-Yula Specialist Hospital building" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl lg:aspect-auto lg:h-full" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground md:px-16">
          <h2 className="text-4xl md:text-5xl">Ready to book?</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/75">Send an appointment request online, or contact us using the details above.</p>
          <div className="mt-8"><Link to="/appointments" className="inline-flex rounded-full bg-gold px-7 py-3 text-sm font-semibold text-primary transition hover:scale-105">Book an appointment</Link></div>
        </div>
      </section>
    </>
  );
}
