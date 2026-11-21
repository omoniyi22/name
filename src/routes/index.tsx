import { createFileRoute, Link } from "@tanstack/react-router";
import { photos } from "@/lib/photos";
import { services } from "@/lib/data";
import { Btn, meta } from "@/components/site";
import { Reveal } from "@/components/wow";

const title = "De-Yula Specialist Hospital — Patient- and family-centred care in Ayobo, Lagos";
const desc = "De-Yula Specialist Hospital in Ayobo, Lagos offers outpatient, maternity, paediatric, surgical and inpatient care. Founded in 2018.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      ...meta(title, desc).meta,
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const facts = [
  ["2018", "year we were founded"],
  ["8 years", "of service to patients and families"],
  [String(services.length), "areas of care"],
];

function Index() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="eyebrow">Specialist hospital · Ayobo, Lagos</p>
          <h1 className="mt-5 text-5xl leading-[1.05] text-primary md:text-7xl">Caring for you and your <em className="text-gold">family</em>.</h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">De-Yula Specialist Hospital provides patient- and family-centred care for adults, mothers and children.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Btn to="/appointments">Book an appointment</Btn>
            <Btn to="/services" variant="outline">See our services</Btn>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
          <div className="absolute -right-3 -top-3 h-full w-full rounded-[2rem] border-2 border-gold/60" aria-hidden="true" />
          <img
            src={photos.signpost}
            alt="De-Yula Specialist Hospital signboard on Akinlade Avenue, Ayobo, Lagos"
            width={1080}
            height={1080}
            fetchPriority="high"
            className="relative aspect-square w-full rounded-[2rem] object-cover shadow-2xl"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="grid gap-px overflow-hidden rounded-3xl border bg-border shadow-xl sm:grid-cols-3">
          {facts.map(([n, l]) => (
            <div key={l} className="bg-card p-8">
              <p className="font-display text-5xl text-primary">{n}</p>
              <p className="mt-2 text-sm text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-6 py-20">
        <Reveal>
          <p className="eyebrow">Our services</p>
          <h2 className="mt-4 max-w-3xl text-5xl text-primary md:text-6xl">How we can help you</h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">Choose a service to book an appointment, or <Link to="/services" className="font-semibold text-primary underline">read more about each one</Link>.</p>
        </Reveal>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.id} className={i === 0 ? "md:col-span-2" : ""}>
              <Link to="/appointments" className="group relative block h-full overflow-hidden rounded-3xl border bg-card shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="relative overflow-hidden">
                  <img src={s.img} alt={s.name} loading="lazy" width={1024} height={1280} className={`w-full object-cover transition duration-[1.5s] group-hover:scale-110 ${i === 0 ? "aspect-[21/9]" : "aspect-[16/10]"}`} />
                  <span className="absolute left-5 top-5 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary">{s.plain}</span>
                </div>
                <div className="p-7">
                  <h3 className="text-3xl text-primary">{s.name}</h3>
                  <p className="mt-3 text-muted-foreground">{s.summary}</p>
                  <div className="mt-6 flex items-center justify-between border-t pt-5">
                    <span className="font-semibold text-primary">Book an appointment</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:translate-x-1 group-hover:bg-gold">→</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-ink py-24 text-ink-foreground">
        <Reveal className="mx-auto max-w-4xl px-6 text-center">
          <p className="eyebrow">Our promise</p>
          <p className="mt-6 font-display text-4xl leading-snug md:text-5xl">We are committed to providing <em className="text-gold">patient- and family-centred</em> care.</p>
          <div className="mt-8"><Btn to="/about" variant="outline"><span className="text-ink-foreground">About us</span></Btn></div>
        </Reveal>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-6">
        <div className="rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground md:px-16">
          <h2 className="text-4xl md:text-5xl">Book an appointment or ask a question</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/75">You can reach us by phone, WhatsApp or email.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/appointments" className="inline-flex rounded-full bg-gold px-7 py-3 text-sm font-semibold text-primary">Book an appointment</Link>
            <Link to="/contact" className="inline-flex rounded-full border border-primary-foreground/40 px-7 py-3 text-sm font-semibold">Contact us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
