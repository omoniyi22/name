import { Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useContactDetails, phoneNumbers, fmtPhone, telHref, waHref, linkHref } from "@/lib/contact";
import { Skeleton } from "@/components/ui/skeleton";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/contact", label: "Contact" },
] as const;

function NavLink({ to, label, mobile, className = "" }: { to: string; label: string; mobile?: boolean; className?: string }) {
  const idle = mobile
    ? "whitespace-nowrap border-b-2 border-transparent px-3 py-1 text-muted-foreground transition hover:text-primary hover:border-primary/40"
    : "px-3 py-1 text-muted-foreground transition hover:text-primary";
  const active = mobile
    ? "whitespace-nowrap border-b-2 border-primary bg-primary/10 text-primary font-semibold"
    : "px-3 py-1 rounded-full bg-primary text-primary-foreground font-semibold shadow-sm";
  return (
    <Link
      to={to}
      className={className ? `${className} ${idle}` : idle}
      activeProps={{ className: className ? `${className} ${active}` : active }}
      activeOptions={{ exact: true }}
    >
      {label}
    </Link>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 sm:flex sm:justify-between">
        <Link to="/" className="min-w-0 font-display text-xl text-primary sm:text-2xl">
          De-Yula Hospital
        </Link>
        <nav className="hidden gap-8 text-sm md:flex">
          {nav.map((n) => <NavLink key={n.to} to={n.to} label={n.label} />)}
          <NavLink to="/appointments" label="Appointment" />
        </nav>
        <div className="shrink-0"><Btn to="/appointments">Book visit</Btn></div>
      </div>
      <nav className="flex gap-5 overflow-x-auto px-6 pb-3 text-sm md:hidden">
        {nav.map((n) => <NavLink key={n.to} to={n.to} label={n.label} mobile />)}
        <NavLink to="/appointments" label="Appointment" mobile className="hidden whitespace-nowrap min-[540px]:block" />
      </nav>
    </header>
  );
}

export function Btn({ to, children, variant = "solid" }: { to: string; children: ReactNode; variant?: "solid" | "outline" }) {
  const cls =
    variant === "solid"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "border border-primary/30 text-primary hover:bg-primary/5";
  return (
    <Link to={to} className={`inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold transition ${cls}`}>
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <p className="font-display text-3xl">De-Yula Hospital</p>
          <p className="mt-4 max-w-sm text-primary-foreground/70">Patient- and family-centred care in Ayobo, Lagos.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="eyebrow">Explore</p>
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="block text-primary-foreground/80 hover:text-gold">{n.label}</Link>
          ))}
          <Link to="/appointments" className="block text-primary-foreground/80 hover:text-gold">Book a visit</Link>
        </div>
        <FooterContact />
      </div>
      <Subscribe />
      <p className="border-t border-primary-foreground/10 py-6 text-center text-xs text-primary-foreground/50">© 2026 De-Yula Specialist Hospital</p>
    </footer>
  );
}

function FooterContact() {
  const { data, isLoading } = useContactDetails();
  if (isLoading || !data)
    return (
      <>
        <div className="space-y-3"><Skeleton className="h-3 w-16 bg-primary-foreground/20" /><Skeleton className="h-4 w-40 bg-primary-foreground/20" /><Skeleton className="h-4 w-32 bg-primary-foreground/20" /></div>
        <div className="space-y-3"><Skeleton className="h-3 w-16 bg-primary-foreground/20" /><Skeleton className="h-4 w-36 bg-primary-foreground/20" /><Skeleton className="h-4 w-44 bg-primary-foreground/20" /><Skeleton className="h-4 w-28 bg-primary-foreground/20" /></div>
      </>
    );
  return (
    <>
      <div className="space-y-2 text-sm">
        <p className="eyebrow">Visit</p>
        <p className="whitespace-pre-line text-primary-foreground/80">{data.address}</p>
      </div>
      <div className="space-y-2 text-sm">
        <p className="eyebrow">Contact</p>
        {phoneNumbers(data).map((p) => (
          <div key={p} className="flex flex-wrap items-center gap-x-3">
            <a href={telHref(p)} className="text-primary-foreground/80 hover:text-gold">{fmtPhone(p)}</a>
            <a href={waHref(p)} target="_blank" rel="noreferrer" className="text-xs text-primary-foreground/60 hover:text-gold">WhatsApp</a>
          </div>
        ))}
        {data.email && <a href={`mailto:${data.email}`} className="block break-all text-primary-foreground/80 hover:text-gold">{data.email}</a>}
        {data.email_secondary && <a href={`mailto:${data.email_secondary}`} className="block break-all text-primary-foreground/80 hover:text-gold">{data.email_secondary}</a>}
        <div className="flex gap-4 pt-2">
          {data.instagram && <a href={linkHref(data.instagram, "https://instagram.com/")} target="_blank" rel="noreferrer" className="text-primary-foreground/80 hover:text-gold">Instagram</a>}
          {data.facebook && <a href={linkHref(data.facebook, "https://facebook.com/")} target="_blank" rel="noreferrer" className="text-primary-foreground/80 hover:text-gold">Facebook</a>}
        </div>
      </div>
    </>
  );
}

export function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-12 pt-20">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 max-w-3xl text-5xl leading-tight text-primary md:text-6xl">{title}</h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{text}</p>
    </section>
  );
}

export const meta = (title: string, description: string) => ({
  meta: [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
  ],
});

function Subscribe() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState("busy");
    const { error } = await supabase.rpc("subscribe_newsletter", { p_email: email.trim() });
    if (error) return setState("error");
    setEmail("");
    setState("done");
  };
  return (
    <div className="mx-auto max-w-7xl border-t border-primary-foreground/10 px-6 py-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-2xl">Stay in touch</p>
          <p className="mt-1 text-sm text-primary-foreground/70">Occasional updates from De-Yula Hospital. Unsubscribe at any time.</p>
        </div>
        {state === "done" ? (
          <p role="status" className="text-gold">Thank you — you're subscribed ✓</p>
        ) : (
          <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <input required type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }} placeholder="you@email.com" aria-label="Email address" className="min-w-0 flex-1 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-3 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/50 focus:border-gold" />
            <button disabled={state === "busy"} className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:scale-105 disabled:opacity-60">{state === "busy" ? "Subscribing…" : "Subscribe"}</button>
          </form>
        )}
      </div>
      {state === "error" && <p role="alert" className="mt-3 text-sm text-gold">That email doesn't look right. Please check it and try again.</p>}
    </div>
  );
}
