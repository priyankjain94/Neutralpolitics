import { z } from "zod";

export const VIDEO_MIMES = ["video/mp4", "video/quicktime", "video/3gpp", "video/webm"] as const;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 5 * 60;
export const CONSENT_VERSION = "2026-09-28";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  let local = digits;
  if (local.startsWith("91") && local.length === 12) local = local.slice(2);
  if (local.startsWith("0") && local.length === 11) local = local.slice(1);
  if (!/^[6-9]\d{9}$/.test(local)) return null;
  return `+91${local}`;
}

export const contributeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  description: z.string().trim().min(30).max(5000),
  event_date: z.string().trim().min(4).max(40),
  event_location: z.string().trim().min(2).max(200),
  language: z.enum(["en", "hi"]),
  extra_notes: z.string().trim().max(2000).optional().or(z.literal("")),
  social_handle: z.string().trim().max(80).optional().or(z.literal("")),
  credit_preference: z.enum(["name", "anonymous"]),
  video_size_bytes: z.number().int().positive().max(MAX_VIDEO_BYTES),
  video_mime: z.enum(VIDEO_MIMES),
  video_duration_s: z.number().int().positive().max(MAX_VIDEO_SECONDS).nullable().optional(),
  consent: z.literal(true),
  age18: z.literal(true),
  turnstile_token: z.string().optional(),
});

export const signupSchema = z
  .object({
    email: z.string().trim().max(200).optional().or(z.literal("")),
    whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
    language: z.enum(["en", "hi", "both"]),
    topics: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
    consent: z.literal(true),
    source_page: z.string().trim().max(200).optional().or(z.literal("")),
    turnstile_token: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const email = value.email || "";
    const whatsapp = value.whatsapp || "";
    if (!email && !whatsapp) {
      ctx.addIssue({ code: "custom", message: "email or whatsapp required", path: ["email"] });
    }
    if (email && !z.string().email().safeParse(email).success) {
      ctx.addIssue({ code: "custom", message: "invalid email", path: ["email"] });
    }
  });

export const reportSchema = z.object({
  type: z.enum(["correction", "factcheck", "contact"]),
  article_url: z.string().trim().max(500).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(5000),
  email: z.string().trim().max(200).optional().or(z.literal("")),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  turnstile_token: z.string().optional(),
});

export const unsubscribeSchema = z.object({
  email: z.string().trim().max(200).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
});
