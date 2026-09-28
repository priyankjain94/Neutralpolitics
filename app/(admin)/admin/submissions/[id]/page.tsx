import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addNote, saveChecklist, updateStatus } from "../../actions";
import { AdminShell } from "@/components/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { isR2Configured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { presignR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

const CHECKS = [
  ["contacted", "Contacted the contributor"],
  ["metadata", "Original file and metadata checked"],
  ["corroborated", "Location and time corroborated"],
  ["sources", "Two independent sources, or an official confirmation"],
  ["blurred", "Faces and minors blurred where needed"],
  ["legal", "Legal and sensitivity check"],
];

export default async function SubmissionDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const query = await searchParams;
  const db = getDb();
  if (!db) {
    return (
      <AdminShell current="submissions">
        <p className="closed">The database is not configured.</p>
      </AdminShell>
    );
  }
  const { data } = await db.from("submissions").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const events = await db.from("submission_events").select("*").eq("submission_id", id).order("at", { ascending: false });
  let videoUrl = "";
  if (data.video_key && data.upload_completed_at && data.video_provider === "r2" && isR2Configured()) {
    videoUrl = presignR2({ method: "GET", key: data.video_key, expires: 300 });
  }
  if (data.video_key && data.upload_completed_at && data.video_provider === "supabase" && process.env.SUPABASE_STORAGE_BUCKET) {
    const signed = await db.storage.from(process.env.SUPABASE_STORAGE_BUCKET).createSignedUrl(data.video_key, 300);
    videoUrl = signed.data?.signedUrl || "";
  }
  const checklist = (data.checklist || {}) as Record<string, boolean>;
  const error =
    query.e === "reason"
      ? "A rejection needs a reason."
      : query.e === "posted"
        ? "Add an Instagram URL or an article slug."
        : query.e === "status"
          ? "That status change is not allowed."
          : "";
  return (
    <AdminShell current="submissions">
      <p>
        <Link href="/admin/submissions">Back</Link>
      </p>
      <h1 className="page-title">{String(data.reference)}</h1>
      <p>
        <span className={`chip chip-${data.status}`}>{String(data.status)}</span>
      </p>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="detail-grid">
        <section>
          {videoUrl ? (
            <div className="video-box">
              <video src={videoUrl} controls />
            </div>
          ) : (
            <p className="dek">No completed video on this submission.</p>
          )}
          {videoUrl ? (
            <p>
              <a href={videoUrl}>Open video</a>
            </p>
          ) : null}
          <ul>
            <li>Name: {data.name}</li>
            <li>
              Phone: <a href={`tel:${data.phone}`}>{data.phone}</a>
            </li>
            <li>
              Email: <a href={`mailto:${data.email}`}>{data.email}</a>
            </li>
            <li>
              City: {data.city}, {data.state}
            </li>
            <li>When: {data.event_date ? formatDateTime(String(data.event_date), "en") : "—"}</li>
            <li>Where: {data.event_location}</li>
            <li>Credit: {data.credit_preference}</li>
            <li>Handle: {data.social_handle || "—"}</li>
            <li>
              Consent: {data.consent_version} at {formatDateTime(String(data.consent_at), "en")}
            </li>
            <li>Payment: —</li>
          </ul>
          <p>{data.description}</p>
          {data.extra_notes ? <p>{data.extra_notes}</p> : null}
        </section>
        <section>
          <form action={saveChecklist} className="form">
            <h2>Verification checklist</h2>
            <input type="hidden" name="id" value={id} />
            <div className="checks">
              {CHECKS.map(([key, label]) => (
                <label key={key} className="check">
                  <input type="checkbox" name={key} defaultChecked={Boolean(checklist[key])} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <button className="button" type="submit">
              Save checklist
            </button>
          </form>
          <form action={addNote} className="form">
            <h2>Internal notes</h2>
            <input type="hidden" name="id" value={id} />
            <textarea name="note" placeholder="Add a note" />
            <button className="button" type="submit">
              Add note
            </button>
            {data.notes ? <pre style={{ whiteSpace: "pre-wrap" }}>{data.notes}</pre> : null}
          </form>
          <form action={updateStatus} className="form">
            <h2>Status</h2>
            <input type="hidden" name="id" value={id} />
            <label>
              Move to
              <select name="status" defaultValue="verifying">
                <option value="verifying">verifying</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="posted">posted</option>
              </select>
            </label>
            <label>
              Reason for rejection
              <input name="rejection_reason" />
            </label>
            <label>
              Instagram URL
              <input name="posted_ig_url" defaultValue={data.posted_ig_url || ""} />
            </label>
            <label>
              Article slug
              <input name="posted_article_slug" defaultValue={data.posted_article_slug || ""} />
            </label>
            <button className="button" type="submit">
              Update status
            </button>
          </form>
          <h2>History</h2>
          <ul className="log">
            {(events.data || []).map((event) => (
              <li key={event.id}>
                <time dateTime={event.at}>{formatDateTime(event.at, "en")}</time>
                {event.from_status} → {event.to_status}
                {event.note ? ` — ${event.note}` : ""}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}
