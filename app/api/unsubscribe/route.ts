import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { normalizeIndianMobile, unsubscribeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Signups are not open on this copy of the site." }, { status: 503 });
  }
  const ip = clientIp(request);
  if (!rateLimit(`unsub:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Add an email or a WhatsApp number." }, { status: 400 });
  const email = (parsed.data.email || "").trim().toLowerCase();
  const whatsapp = parsed.data.whatsapp ? normalizeIndianMobile(parsed.data.whatsapp) : null;
  if (!email && !whatsapp) return NextResponse.json({ error: "Add an email or a WhatsApp number." }, { status: 400 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Signups are not open on this copy of the site." }, { status: 503 });
  const now = new Date().toISOString();
  if (email) await db.from("signups").update({ unsubscribed_at: now }).ilike("email", email).is("unsubscribed_at", null);
  if (whatsapp) await db.from("signups").update({ unsubscribed_at: now }).eq("whatsapp_e164", whatsapp).is("unsubscribed_at", null);
  return NextResponse.json({ ok: true });
}
