import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ContactDetails = {
  email: string;
  email_secondary: string;
  /** First phone / WhatsApp number. */
  phone: string;
  /** Second phone / WhatsApp number. */
  whatsapp: string;
  instagram: string;
  facebook: string;
  address: string;
};

/** Used for any field left empty in the database, so the site never shows a blank contact. */
export const DEFAULT_CONTACT: ContactDetails = {
  email: "deyulaspecialisthospital@gmail.com",
  email_secondary: "",
  phone: "08160274768",
  whatsapp: "08084391239",
  instagram: "",
  facebook: "",
  address: "1 Akinlade Avenue, off Alaja Road, Ayobo, Lagos",
};

export const contactQueryKey = ["contact-details"] as const;

export function useContactDetails() {
  return useQuery({
    queryKey: contactQueryKey,
    queryFn: async (): Promise<ContactDetails> => {
      const { data, error } = await supabase
        .from("contact_details")
        .select("email, email_secondary, phone, whatsapp, instagram, facebook, address")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      const row: Partial<ContactDetails> = data ?? {};
      const pick = (k: keyof ContactDetails) => (row[k] ?? "").trim() || DEFAULT_CONTACT[k];
      return {
        email: pick("email"),
        email_secondary: pick("email_secondary"),
        phone: pick("phone"),
        whatsapp: pick("whatsapp"),
        instagram: pick("instagram"),
        facebook: pick("facebook"),
        address: pick("address"),
      };
    },
    staleTime: 60_000,
  });
}

/** Both phone / WhatsApp numbers, without blanks or duplicates. */
export const phoneNumbers = (c: ContactDetails) =>
  [c.phone, c.whatsapp].map((n) => n.trim()).filter((n, i, all) => n && all.indexOf(n) === i);

/** 08160274768 -> 0816 027 4768 (other formats are shown as typed). */
export const fmtPhone = (n: string) => {
  const d = n.trim();
  return /^0\d{10}$/.test(d) ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : d;
};

export const telHref = (n: string) => `tel:${n.replace(/[^\d+]/g, "")}`;
export const waHref = (n: string) => {
  const digits = n.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
};
export const linkHref = (v: string, base: string) =>
  /^https?:\/\//.test(v) ? v : `${base}${v.replace(/^@/, "")}`;
