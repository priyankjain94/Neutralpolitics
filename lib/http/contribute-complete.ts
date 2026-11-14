import { getDb } from "../db";
import { isR2Configured } from "../env";
import { presignR2 } from "../r2";
import { z } from "zod";

const schema = z.object({ id: z.string().uuid() });

async function objectExists(key: string, provider: string, mime: string, size: number): Promise<boolean> {
  if (provider === "r2" && isR2Configured()) {
    const headUrl = presignR2({ method: "HEAD", key, expires: 120 });
    const head = await fetch(headUrl, { method: "HEAD" });
    if (!head.ok) return false;
    const length = Number(head.headers.get("content-length") || 0);
    const type = head.headers.get("content-type") || "";
    if (length && Math.abs(length - size) > 1024) return false;
    if (type && !type.startsWith(mime.split("/")[0])) return false;
    return true;
  }
  const db = getDb();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "submissions";
  if (!db || !bucket) return false;
  const signed = await db.storage.from(bucket).createSignedUrl(key, 120);
  if (signed.error || !signed.data?.signedUrl) return false;
  const head = await fetch(signed.data.signedUrl, { method: "HEAD" });
  return head.ok;
}

export async function postContributeComplete(request: Request): Promise<Response> {
  const db = getDb();
  if (!db) return Response.json({ error: "Uploads are not open on this copy of the site." }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Missing submission." }, { status: 400 });
  const { data, error } = await db.from("submissions").select("*").eq("id", parsed.data.id).maybeSingle();
  if (error || !data) return Response.json({ error: "Submission not found." }, { status: 404 });
  if (data.upload_completed_at) return Response.json({ reference: data.reference });
  const ok = await objectExists(data.video_key, data.video_provider, data.video_mime, Number(data.video_size_bytes));
  if (!ok) return Response.json({ error: "The video did not arrive. Try the upload again." }, { status: 400 });
  const now = new Date().toISOString();
  await db.from("submissions").update({ upload_completed_at: now }).eq("id", data.id);
  await db.from("submission_events").insert({
    submission_id: data.id,
    actor: "system",
    from_status: "new",
    to_status: "new",
    note: "Upload completed",
  });
  return Response.json({ reference: data.reference });
}
