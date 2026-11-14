import { randomBytes, randomUUID } from "crypto";
import { isCategory } from "../categories";
import { getDb } from "../db";
import { isUploadConfigured, storageBucket, uploadProvider } from "../env";
import { presignR2 } from "../r2";
import { rateLimit } from "../rate-limit";
import { clientIp, hashIp, verifyTurnstile } from "../request";
import { CONSENT_VERSION, INDIAN_STATES, contributeSchema, normalizeIndianMobile } from "../validators";

const EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/3gpp": "3gp",
  "video/webm": "webm",
};

export async function postContributeStart(request: Request): Promise<Response> {
  if (!isUploadConfigured()) {
    return Response.json({ error: "Uploads are not open on this copy of the site." }, { status: 503 });
  }
  const ip = clientIp(request);
  if (!rateLimit(`contribute:${ip}`, 8, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const parsed = contributeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the form and try again." }, { status: 400 });
  const phone = normalizeIndianMobile(parsed.data.phone);
  if (!phone) return Response.json({ error: "Enter an Indian mobile number." }, { status: 400 });
  if (!INDIAN_STATES.includes(parsed.data.state as (typeof INDIAN_STATES)[number])) {
    return Response.json({ error: "Choose a state." }, { status: 400 });
  }
  const category = parsed.data.category && isCategory(parsed.data.category) ? parsed.data.category : null;
  if (!(await verifyTurnstile(parsed.data.turnstile_token, ip))) {
    return Response.json({ error: "Captcha check failed." }, { status: 400 });
  }
  const provider = uploadProvider();
  const db = getDb();
  if (!provider || !db) return Response.json({ error: "Uploads are not open on this copy of the site." }, { status: 503 });

  const id = randomUUID();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const key = `submissions/${year}/${month}/${id}.${EXT[parsed.data.video_mime]}`;
  const reference = `NP-${year}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const { error } = await db.from("submissions").insert({
    id,
    reference,
    name: parsed.data.name,
    phone,
    email: parsed.data.email,
    city: parsed.data.city,
    state: parsed.data.state,
    description: parsed.data.description,
    event_date: new Date(parsed.data.event_date).toISOString(),
    event_location: parsed.data.event_location,
    language: parsed.data.language,
    extra_notes: parsed.data.extra_notes || null,
    social_handle: parsed.data.social_handle || null,
    credit_preference: parsed.data.credit_preference,
    category,
    desk_status: "new",
    payment_track: "unpaid",
    video_key: key,
    video_provider: provider,
    video_size_bytes: parsed.data.video_size_bytes,
    video_mime: parsed.data.video_mime,
    video_duration_s: parsed.data.video_duration_s ?? null,
    consent_version: CONSENT_VERSION,
    consent_at: now.toISOString(),
    age_confirmed_at: now.toISOString(),
    consent_ip_hash: hashIp(ip),
    status: "new",
  });
  if (error) return Response.json({ error: "Could not save the submission." }, { status: 500 });

  if (provider === "r2") {
    const uploadUrl = presignR2({ method: "PUT", key, contentType: parsed.data.video_mime, expires: 1800 });
    return Response.json({ id, reference, uploadUrl, headers: { "content-type": parsed.data.video_mime } });
  }
  const bucket = storageBucket();
  const signed = await db.storage.from(bucket).createSignedUploadUrl(key);
  if (signed.error || !signed.data) return Response.json({ error: "Could not prepare the upload." }, { status: 500 });
  return Response.json({
    id,
    reference,
    uploadUrl: signed.data.signedUrl,
    headers: { "content-type": parsed.data.video_mime },
  });
}
