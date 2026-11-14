import { getDb } from "../db";
import { isDatabaseConfigured } from "../env";
import { rateLimit } from "../rate-limit";
import { clientIp, hashIp } from "../request";
import { errorReportSchema } from "../validators";

export async function postErrorReport(request: Request): Promise<Response> {
  if (!isDatabaseConfigured()) return Response.json({ error: "unavailable" }, { status: 503 });
  const ip = clientIp(request);
  if (!rateLimit(`error-report:${ip}`, 5, 15 * 60 * 1000)) return Response.json({ error: "rate" }, { status: 429 });
  const parsed = errorReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "check" }, { status: 400 });
  if ((parsed.data.website || "").trim()) return Response.json({ ok: true });
  const email = (parsed.data.email || "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "email" }, { status: 400 });
  const source = (parsed.data.source_url || "").trim();
  if (source && !/^https?:\/\//i.test(source)) return Response.json({ error: "source" }, { status: 400 });
  const db = getDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });
  const now = new Date().toISOString();
  const { error } = await db.from("error_reports").insert({
    story_ref: parsed.data.story_ref.trim(),
    what_wrong: parsed.data.what_wrong.trim(),
    suggested_correction: parsed.data.suggested_correction.trim(),
    source_url: source || null,
    name: (parsed.data.name || "").trim() || null,
    email: email || null,
    language: parsed.data.language,
    consent_contact: true,
    consent_at: now,
    consent_ip_hash: hashIp(ip),
    status: "new",
  });
  if (error) return Response.json({ error: "save" }, { status: 500 });
  return Response.json({ ok: true });
}
