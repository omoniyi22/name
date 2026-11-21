import { format } from "date-fns";

export const fmtDate = (iso: string | null | undefined) => (iso ? format(new Date(iso), "d MMM yyyy") : "—");
export const fmtDateTime = (iso: string | null | undefined) => (iso ? format(new Date(iso), "d MMM yyyy, h:mm a") : "—");

/** PostgREST `or(...)` strings can't safely contain these characters. */
export const cleanSearch = (q: string) => q.replace(/[,()"\\%*_]/g, " ").trim();

export const errMessage = (e: unknown, fallback = "Something went wrong") =>
  e instanceof Error && e.message ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : fallback;
