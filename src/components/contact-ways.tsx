import { useContactDetails, phoneNumbers, fmtPhone, telHref, waHref } from "@/lib/contact";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/wow";

const card = "flex h-full flex-col rounded-3xl border bg-card p-8 transition duration-500 hover:-translate-y-1 hover:shadow-xl";
const solid = "inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90";
const outline = "inline-flex items-center rounded-full border border-primary/30 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5";

/** Phone / WhatsApp and email cards: the ways to book an appointment or make an enquiry. */
export function ContactWays() {
  const { data: c, isLoading } = useContactDetails();
  if (isLoading || !c)
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-60 w-full rounded-3xl" />)}
      </div>
    );
  const emails = [c.email, c.email_secondary].filter(Boolean);
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {phoneNumbers(c).map((p) => (
        <Reveal key={p}>
          <div className={card}>
            <p className="eyebrow">Phone / WhatsApp</p>
            <p className="mt-5 font-display text-3xl text-primary">{fmtPhone(p)}</p>
            <p className="mt-3 flex-1 text-muted-foreground">Call or send a WhatsApp message to book an appointment or ask a question.</p>
            <div className="mt-7 flex flex-wrap gap-3 border-t pt-5">
              <a href={telHref(p)} className={solid}>Call</a>
              <a href={waHref(p)} target="_blank" rel="noreferrer" className={outline}>WhatsApp</a>
            </div>
          </div>
        </Reveal>
      ))}
      {emails.length > 0 && (
        <Reveal>
          <div className={card}>
            <p className="eyebrow">Email</p>
            <p className="mt-5 whitespace-pre-line break-all font-display text-xl text-primary">{emails.join("\n")}</p>
            <p className="mt-3 flex-1 text-muted-foreground">Send us an email with your request or question and we will reply.</p>
            <div className="mt-7 flex flex-wrap gap-3 border-t pt-5">
              <a href={`mailto:${c.email}`} className={solid}>Send an email</a>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
