import type { Lang } from "./types";

const TZ = "Asia/Kolkata";

export function formatMastheadDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string, lang: Lang): string {
  return (
    new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
      timeZone: TZ,
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(iso)) + " IST"
  );
}

/** Source timestamps in the import are often "28 Sep 17:35 IST", not ISO. Show those as written. */
export function formatSourceTime(value: string, lang: Lang): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDateTime(value, lang);
}

export function formatTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function formatDay(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
