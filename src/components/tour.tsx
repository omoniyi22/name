import { useState } from "react";
import { tour } from "@/lib/photos";
import { Reveal } from "@/components/wow";

/** "Step inside" photo tour: one large featured photo with clickable thumbnails. */
export function HospitalTour({ dark = false }: { dark?: boolean }) {
  const [i, setI] = useState(0);
  const cur = tour[i]!;
  return (
    <section className={dark ? "bg-ink py-24 text-ink-foreground" : "py-24"}>
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="eyebrow">Step inside</p>
          <h2 className={`mt-4 max-w-3xl text-5xl md:text-6xl ${dark ? "" : "text-primary"}`}>A look around the hospital.</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div key={i} className="animate-rise relative overflow-hidden rounded-3xl shadow-2xl">
            <img src={cur.src} alt={cur.t} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 text-ink-foreground">
              <p className="font-display text-4xl">{cur.t}</p>
              <p className="mt-1 text-ink-foreground/80">{cur.d}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {tour.map((p, k) => (
              <button key={p.t} type="button" onClick={() => setI(k)} aria-label={p.t}
                className={`overflow-hidden rounded-2xl border-2 transition ${k === i ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"}`}>
                <img src={p.src} alt="" loading="lazy" className="aspect-square h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
