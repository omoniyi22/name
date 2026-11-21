import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/unsubscribe/$id")({
  head: () => ({ meta: [{ title: "Unsubscribe — De-Yula Specialist Hospital" }, { name: "robots", content: "noindex" }] }),
  component: UnsubscribePage,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function UnsubscribePage() {
  const { id } = Route.useParams();
  const [state, setState] = useState<"working" | "done" | "missing" | "error">("working");

  // Runs in the browser only, so email link-scanners that just fetch the page don't unsubscribe anyone.
  useEffect(() => {
    if (!UUID.test(id)) return setState("missing");
    void supabase.rpc("unsubscribe_contact", { p_id: id }).then(({ data, error }) => setState(error ? "error" : data ? "done" : "missing"));
  }, [id]);

  const view = {
    working: { icon: <Loader2 className="h-10 w-10 animate-spin text-gold" />, title: "Updating your preferences…", text: "One moment." },
    done: { icon: <CheckCircle2 className="h-10 w-10 text-gold" />, title: "You're unsubscribed", text: "You won't receive our newsletter any more. You'll still hear from us if you book or message us directly." },
    missing: { icon: <CircleAlert className="h-10 w-10 text-gold" />, title: "We couldn't find that subscription", text: "The link may be old or incomplete. If you still receive emails, contact us and we'll remove you." },
    error: { icon: <CircleAlert className="h-10 w-10 text-destructive" />, title: "Something went wrong", text: "Please try the link again in a moment, or contact us and we'll remove you." },
  }[state];

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      {view.icon}
      <h1 className="mt-6 text-4xl text-primary">{view.title}</h1>
      <p className="mt-3 text-muted-foreground">{view.text}</p>
      <Link to="/" className="mt-8 rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition hover:bg-primary/90">Back to the website</Link>
    </section>
  );
}
