import { createFileRoute, Link } from "@tanstack/react-router";
import { photos } from "@/lib/photos";
import { HospitalTour } from "@/components/tour";
import { Btn, meta } from "@/components/site";
import { Reveal } from "@/components/wow";

const title = "About De-Yula Specialist Hospital — Our story and our promise";
const desc = "De-Yula Specialist Hospital was founded in 2018 and is celebrating 8 years of service. Learn about our story and our commitment to patient- and family-centred care.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      ...meta(title, desc).meta,
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const glance = [
  { l: "Year established", v: "2018" },
  { l: "Years of service", v: "8" },
  { l: "Founding promise", v: "We are committed to providing patient- and family-centred care." },
];

const values = [
  { t: "Patients first", d: "We listen to each patient and take time to understand their concerns." },
  { t: "Families involved", d: "Families are part of the care. We keep them informed and include them where we can." },
  { t: "Clear explanations", d: "We explain diagnoses and treatment in simple, everyday language." },
  { t: "Respect", d: "Every patient is treated with courtesy, dignity and privacy." },
];

function AboutPage() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="eyebrow animate-rise">About us · Since 2018</p>
          <h1 className="mt-5 animate-rise text-5xl leading-[1.05] text-primary md:text-7xl">Caring for our community since <em className="text-gold">2018</em>.</h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">De-Yula Specialist Hospital is celebrating 8 years of service to patients and families in Lagos.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Btn to="/appointments">Book an appointment</Btn>
            <Btn to="/services" variant="outline">See our services</Btn>
          </div>
        </div>
        <img src={photos.building} alt="De-Yula Specialist Hospital building" width={1600} height={1008} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl" />
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow">Our story</p>
          <h2 className="mt-4 text-5xl text-primary md:text-6xl">8 years of service.</h2>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">De-Yula Specialist Hospital was founded in 2018, and this year we are celebrating 8 years of service.</p>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">We are still growing. Our aim is to keep doing the important things well: listening to patients, explaining things clearly and treating every family with respect.</p>
        </Reveal>
        <Reveal>
          <dl className="rounded-3xl border bg-card p-4 shadow-xl">
            {glance.map((g) => (
              <div key={g.l} className="border-b p-5 last:border-0">
                <dt className="text-sm font-semibold text-primary">{g.l}</dt>
                <dd className="mt-1 text-muted-foreground">{g.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section className="bg-ink py-24 text-ink-foreground">
        <Reveal className="mx-auto max-w-4xl px-6 text-center">
          <p className="eyebrow">Our founding promise</p>
          <p className="mt-6 font-display text-4xl leading-snug md:text-5xl">We are committed to providing <em className="text-gold">patient- and family-centred</em> care.</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="eyebrow">What we value</p>
          <h2 className="mt-4 max-w-3xl text-5xl text-primary md:text-6xl">How we care for patients.</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.t}>
              <div className="h-full rounded-3xl border bg-card p-8 transition hover:-translate-y-2 hover:shadow-xl">
                <p className="font-display text-6xl text-gold">0{i + 1}</p>
                <h3 className="mt-6 text-2xl text-primary">{v.t}</h3>
                <p className="mt-3 text-muted-foreground">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <HospitalTour dark />

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground md:px-16">
          <h2 className="text-4xl md:text-5xl">Visit us or get in touch</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/75">Book by phone, WhatsApp or email, or send a request online.</p>
          <div className="mt-8"><Link to="/appointments" className="inline-flex rounded-full bg-gold px-7 py-3 text-sm font-semibold text-primary transition hover:scale-105">Book an appointment</Link></div>
        </div>
      </section>
    </>
  );
}
