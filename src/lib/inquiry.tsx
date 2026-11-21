import { submitInquiry } from "@/lib/admin.functions";

/** Reads a public form (by field name) and saves it as an inquiry. Throws a friendly Error on failure. */
export async function sendInquiryFromForm(form: HTMLFormElement, type: "contact" | "appointment") {
  const f = new FormData(form);
  const get = (k: string) => String(f.get(k) ?? "").trim();
  await submitInquiry({
    data: {
      type,
      name: get("name"),
      email: get("email"),
      phone: get("phone"),
      subject: get("subject"),
      message: get("message"),
      service: get("service"),
      preferredDate: get("preferredDate"),
      website: get("website"),
    },
  });
}

export const honeypot = (
  <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />
);
