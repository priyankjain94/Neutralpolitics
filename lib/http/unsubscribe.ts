import { getDb } from "../db";
import { isDatabaseConfigured } from "../env";
import { rateLimit } from "../rate-limit";
import { clientIp } from "../request";
import { normalizeIndianMobile, unsubscribeSchema } from "../validators";

export async function postUnsubscribe(request: Request): Promise<Response> {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Signups are not open on this copy of the site." }, { status: 503 });
  }
  const ip = clientIp(request);
  if (!rateLimit(`unsub:${ip}`, 20, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Add an email or a WhatsApp number." }, { status: 400 });
  const email = (parsed.data.email || "").trim().toLowerCase();
  const whatsapp = parsed.data.whatsapp ? normalizeIndianMobile(parsed.data.whatsapp) : null;
  if (!email && !whatsapp) return Response.json({ error: "Add an email or a WhatsApp number." }, { status: 400 });
  const db = getDb();
  if (!db) return Response.json({ error: "Signups are not open on this copy of the site." }, { status: 503 });
  const now = new Date().toISOString();
  if (email) await db.from("signups").update({ unsubscribed_at: now }).ilike("email", email).is("unsubscribed_at", null);
  if (whatsapp) await db.from("signups").update({ unsubscribed_at: now }).eq("whatsapp_e164", whatsapp).is("unsubscribed_at", null);
  return Response.json({ ok: true });
}
