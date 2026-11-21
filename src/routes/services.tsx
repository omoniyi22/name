import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { photos } from "@/lib/photos";
import { services } from "@/lib/data";
import { Btn, meta } from "@/components/site";
import { Reveal } from "@/components/wow";

const title = "Our Services — De-Yula Specialist Hospital, Ayobo, Lagos";
const desc = "Outpatient, maternity, paediatric, surgical and inpatient care at De-Yula Specialist Hospital in Ayobo, Lagos.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      ...meta(title, desc).meta,
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

const faqs = [
  { q: "How do I book an appointment?", a: "You can call or message us on WhatsApp, send an email, or use the booking form on our Appointments page." },
  { q: "Do you see children?", a: "Yes. Our paediatric care is for babies and children." },
  { q: "What should I bring?", a: "Please bring any past medical records, test results or referral letters you have." },
  { q: "Can a family member come with me?", a: "Yes. Patients are welcome to come with a family member or someone they trust." },
];

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b py-6">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-6 text-left">
        <span className="font-display text-2xl text-primary">{q}</span>
        <span className={`text-2xl text-gold transition ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <p className="animate-rise mt-4 max-w-2xl text-muted-foreground">{a}</p>}
    </div>
  );
}

function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <img src={photos.consultRoom} alt="Consulting room at De-Yula Specialist Hospital" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/75 to-ink/30" />
        <div className="relative mx-auto max-w-7xl px-6 py-28 text-ink-foreground md:py-36">
          <p className="eyebrow animate-rise">Our services · Ayobo, Lagos</p>
          <h1 className="mt-5 max-w-3xl animate-rise text-5xl leading-[1.05] md:text-7xl">Care for the whole <em className="text-gold">family</em>.</h1>
          <p className="mt-6 max-w-xl animate-rise text-lg text-ink-foreground/80">We provide outpatient, maternity, paediatric, surgical and inpatient care.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/appointments" className="inline-flex rounded-full bg-gold px-7 py-3 text-sm font-semibold text-ink transition hover:scale-105">Book an appointment</Link>
            <a href="#explore" className="inline-flex rounded-full border border-ink-foreground/40 px-7 py-3 text-sm font-semibold">See all services ↓</a>
          </div>
        </div>
      </section>

      <section id="explore" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-20">
        <Reveal>
          <p className="eyebrow">Jump to a service</p>
          <h2 className="mt-4 max-w-3xl text-5xl text-primary md:text-6xl">What do you need?</h2>
        </Reveal>
        <div className="mt-10 flex flex-wrap gap-3">
          {services.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className="group flex items-center gap-3 rounded-full border bg-card px-5 py-3 transition hover:-translate-y-1 hover:border-gold hover:shadow-lg">
              <span className="text-xs font-semibold text-gold">0{i + 1}</span>
              <span className="font-semibold text-primary">{s.name}</span>
              <span className="text-muted-foreground transition group-hover:translate-x-1">→</span>
            </a>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-28 px-6 pb-24">
        {services.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <Reveal className={`grid items-center gap-12 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                <img src={s.img} alt={s.name} loading="lazy" width={1024} height={1280} className="aspect-[4/5] w-full object-cover transition duration-[1.5s] hover:scale-105" />
                <span className="absolute left-5 top-5 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary">{s.plain}</span>
              </div>
              <div>
                <p className="eyebrow">0{i + 1} · {s.plain}</p>
                <h2 className="mt-4 text-4xl leading-tight text-primary md:text-5xl">{s.name}</h2>
                <p className="mt-5 text-lg text-muted-foreground">{s.text}</p>
                <p className="mt-8 text-sm font-semibold text-primary">This service covers</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {s.forWho.map((f) => (
                    <li key={f} className="rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">✓ {f}</li>
                  ))}
                </ul>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Btn to="/appointments">Book an appointment →</Btn>
                  <Btn to="/contact" variant="outline">Ask a question</Btn>
                </div>
              </div>
            </Reveal>
          </section>
        ))}
      </div>

      <section className="bg-secondary py-20">
        <Reveal className="mx-auto max-w-3xl px-6 text-center">
          <p className="eyebrow">Not sure which service you need?</p>
          <h2 className="mt-4 text-4xl text-primary md:text-5xl">Tell us how we can help.</h2>
          <p className="mt-4 text-lg text-muted-foreground">Call, message us on WhatsApp or send an email, and our team will point you to the right service.</p>
          <div className="mt-8"><Btn to="/contact">Contact us</Btn></div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24">
        <Reveal>
          <p className="eyebrow">Questions</p>
          <h2 className="mt-4 text-5xl text-primary">Good to know before you come.</h2>
        </Reveal>
        <div className="mt-8">{faqs.map((f) => <Faq key={f.q} {...f} />)}</div>
      </section>
    </>
  );
}
