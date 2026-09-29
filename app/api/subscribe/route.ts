import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, verifyTurnstile } from "@/lib/request";
import { CONSENT_VERSION, normalizeIndianMobile, signupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Signups are not open on this copy of the site." }, { status: 503 });
  }
  const ip = clientIp(request);
  if (!rateLimit(`signup:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Add an email or a WhatsApp number." }, { status: 400 });
  if (!(await verifyTurnstile(parsed.data.turnstile_token, ip))) {
    return NextResponse.json({ error: "Captcha check failed." }, { status: 400 });
  }
  const email = (parsed.data.email || "").trim().toLowerCase();
  const whatsapp = parsed.data.whatsapp ? normalizeIndianMobile(parsed.data.whatsapp) : null;
  if (parsed.data.whatsapp && !whatsapp) return NextResponse.json({ error: "Enter an Indian mobile number." }, { status: 400 });
  if (!email && !whatsapp) return NextResponse.json({ error: "Add an email or a WhatsApp number." }, { status: 400 });
  const channel = email && whatsapp ? "both" : email ? "email" : "whatsapp";
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Signups are not open on this copy of the site." }, { status: 503 });
  const { error } = await db.from("signups").insert({
    email: email || null,
    whatsapp_e164: whatsapp,
    language: parsed.data.language,
    topics: parsed.data.topics,
    channel,
    consent_text_version: CONSENT_VERSION,
    consent_at: new Date().toISOString(),
    source_page: parsed.data.source_page || null,
  });
  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    return NextResponse.json({ error: "Could not save the signup." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
