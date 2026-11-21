import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { contactQueryKey, useContactDetails, type ContactDetails } from "@/lib/contact";
import { errMessage } from "@/lib/admin-format";
import { ErrorNote, fieldCls, labelCls, PageHeader, Panel } from "@/components/admin/parts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/_panel/contact-details")({ component: ContactDetailsPage });

const fields: { key: keyof ContactDetails; label: string; placeholder: string; textarea?: boolean }[] = [
  { key: "email", label: "Email", placeholder: "care@hospital.com" },
  { key: "email_secondary", label: "Second email (e.g. marketing)", placeholder: "mkt@hospital.com" },
  { key: "phone", label: "Phone / WhatsApp number 1", placeholder: "08160274768" },
  { key: "whatsapp", label: "Phone / WhatsApp number 2", placeholder: "08084391239" },
  { key: "instagram", label: "Instagram page", placeholder: "https://instagram.com/yourpage" },
  { key: "facebook", label: "Facebook page", placeholder: "https://facebook.com/yourpage" },
  { key: "address", label: "Address", placeholder: "Street, city, country", textarea: true },
];

function ContactDetailsPage() {
  const { data, isLoading, isError, error, refetch } = useContactDetails();
  const qc = useQueryClient();
  const [form, setForm] = useState<ContactDetails | null>(null);
  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);

  const save = useMutation({
    mutationFn: async (f: ContactDetails) => {
      const { error } = await supabase.from("contact_details").upsert({ id: 1, ...f, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: contactQueryKey }); toast.success("Contact details saved. The website is updated."); },
    onError: (e) => toast.error(errMessage(e)),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); if (form) save.mutate(form); };

  return (
    <>
      <PageHeader title="Contact details" description="The phone numbers, emails, social links and address shown across the public website." />
      <Panel className="max-w-3xl p-6 sm:p-8">
        {isError ? (
          <ErrorNote message={errMessage(error, "Couldn't load contact details.")} onRetry={() => void refetch()} />
        ) : isLoading || !form ? (
          <div className="space-y-5">{fields.map((f) => <Skeleton key={f.key} className="h-14 w-full" />)}</div>
        ) : (
          <form onSubmit={submit}>
            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((f) => (
                <label key={f.key} className={`${labelCls} ${f.textarea ? "sm:col-span-2" : ""}`}>
                  {f.label}
                  {f.textarea ? (
                    <textarea rows={3} value={form[f.key]} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={`${fieldCls} mt-2`} />
                  ) : (
                    <input value={form[f.key]} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={`${fieldCls} mt-2`} />
                  )}
                </label>
              ))}
            </div>
            <Button type="submit" size="lg" className="mt-7 w-full rounded-full" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />} Save contact details
            </Button>
          </form>
        )}
      </Panel>
    </>
  );
}
