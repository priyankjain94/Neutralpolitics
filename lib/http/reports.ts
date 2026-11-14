import { getDb } from "../db";
import { isDatabaseConfigured } from "../env";
import { rateLimit } from "../rate-limit";
import { clientIp, hashIp, verifyTurnstile } from "../request";
import { reportSchema } from "../validators";

export async function postReport(request: Request): Promise<Response> {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Messages are not open on this copy of the site." }, { status: 503 });
  }
  const ip = clientIp(request);
  if (!rateLimit(`report:${ip}`, 20, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the form and try again." }, { status: 400 });
  if (parsed.data.email && !parsed.data.email.includes("@")) {
    return Response.json({ error: "Check the email address." }, { status: 400 });
  }
  if (!(await verifyTurnstile(parsed.data.turnstile_token, ip))) {
    return Response.json({ error: "Captcha check failed." }, { status: 400 });
  }
  const db = getDb();
  if (!db) return Response.json({ error: "Messages are not open on this copy of the site." }, { status: 503 });
  const { error } = await db.from("reports").insert({
    type: parsed.data.type,
    article_url: parsed.data.article_url || null,
    message: parsed.data.message,
    email: parsed.data.email || null,
    name: parsed.data.name || null,
    consent_ip_hash: hashIp(ip),
  });
  if (error) return Response.json({ error: "Could not save the message." }, { status: 500 });
  return Response.json({ ok: true });
}
