import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashIp } from "@/lib/request";
import { errorReportSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const ip = clientIp(request);
  if (!rateLimit(`error-report:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "rate" }, { status: 429 });
  }
  const parsed = errorReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "check" }, { status: 400 });
  if ((parsed.data.website || "").trim()) return NextResponse.json({ ok: true });
  const email = (parsed.data.email || "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "email" }, { status: 400 });
  }
  const source = (parsed.data.source_url || "").trim();
  if (source && !/^https?:\/\//i.test(source)) {
    return NextResponse.json({ error: "source" }, { status: 400 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "unavailable" }, { status: 503 });
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
  if (error) return NextResponse.json({ error: "save" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
