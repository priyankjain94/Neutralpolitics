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

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HI_MONTHS = [
  "जनवरी",
  "फ़रवरी",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुलाई",
  "अगस्त",
  "सितंबर",
  "अक्टूबर",
  "नवंबर",
  "दिसंबर",
];

function kolkataParts(iso: string): { day: number; month: number; year: string; hour: number; minute: string } | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const map: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    day: Number(map.day),
    month: Number(map.month),
    year: map.year,
    hour: Number(map.hour),
    minute: map.minute.padStart(2, "0"),
  };
}

/** "28 Sep 2026, 1:58 PM IST" / "28 सितंबर 2026, दोपहर 1:58 IST" */
export function formatDateTime(iso: string, lang: Lang): string {
  const parts = kolkataParts(iso);
  if (!parts) return iso;
  const hour12 = parts.hour % 12 || 12;
  const clock = `${hour12}:${parts.minute}`;
  if (lang === "hi") {
    let period = "रात";
    if (parts.hour >= 4 && parts.hour < 12) period = "सुबह";
    else if (parts.hour >= 12 && parts.hour < 16) period = "दोपहर";
    else if (parts.hour >= 16 && parts.hour < 20) period = "शाम";
    return `${parts.day} ${HI_MONTHS[parts.month - 1]} ${parts.year}, ${period} ${clock} IST`;
  }
  const period = parts.hour >= 12 ? "PM" : "AM";
  return `${parts.day} ${EN_MONTHS[parts.month - 1]} ${parts.year}, ${clock} ${period} IST`;
}

/** Source timestamps in the import are often "28 Sep 17:35 IST", not ISO. Show those as written. */
export function formatSourceTime(value: string, lang: Lang): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDateTime(value, lang);
}

/** ISO-8601 in Asia/Kolkata with a numeric +05:30 offset. India does not observe DST. */
export function isoIst(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const map: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}:${map.second}+05:30`;
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
