import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createCorrectionFromReport, updateErrorReport } from "../../actions";
import { AdminShell } from "@/components/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { storyParts } from "@/lib/story-ref";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "reviewing", "fixed", "rejected"] as const;

export default async function ErrorReportDetail({
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
      <AdminShell current="errors">
        <p className="closed">The database is not configured.</p>
      </AdminShell>
    );
  }
  const { data } = await db.from("error_reports").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const parts = storyParts(String(data.story_ref || ""));
  const storyHref = parts ? parts.path : String(data.story_ref || "").startsWith("http") ? String(data.story_ref) : "";
  return (
    <AdminShell current="errors">
      <p>
        <Link href="/admin/error-reports">Back</Link>
      </p>
      <h1 className="page-title">Error report</h1>
      <p>
        <span className="chip">{String(data.status)}</span>
      </p>
      {query.e === "note" ? <p className="error-text">The suggested correction is too short to publish.</p> : null}
      {query.e === "status" ? <p className="error-text">That status is not allowed.</p> : null}
      <ul>
        <li>When: {formatDateTime(String(data.created_at), "en")}</li>
        <li>Language: {String(data.language)}</li>
        <li>
          Story:{" "}
          {storyHref ? (
            <a href={storyHref}>{String(data.story_ref)}</a>
          ) : (
            String(data.story_ref)
          )}
        </li>
        <li>Name: {data.name || "—"}</li>
        <li>Email: {data.email ? <a href={`mailto:${data.email}`}>{data.email}</a> : "—"}</li>
        <li>May contact: {data.consent_contact ? "yes" : "no"}</li>
        <li>Consent at: {data.consent_at ? formatDateTime(String(data.consent_at), "en") : "—"}</li>
        <li>
          Source:{" "}
          {data.source_url ? (
            <a href={String(data.source_url)}>{String(data.source_url)}</a>
          ) : (
            "—"
          )}
        </li>
      </ul>
      <h2>What is wrong</h2>
      <p>{data.what_wrong}</p>
      <h2>Suggested correction</h2>
      <p>{data.suggested_correction}</p>
      <form action={updateErrorReport} className="form">
        <h2>Status and notes</h2>
        <input type="hidden" name="id" value={id} />
        <label>
          Status
          <select name="status" defaultValue={String(data.status)}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Internal notes
          <textarea name="notes" defaultValue={data.notes || ""} />
        </label>
        <button className="button" type="submit">
          Save
        </button>
      </form>
      <form action={createCorrectionFromReport} className="form">
        <h2>Public correction</h2>
        <p className="fine">One click copies the suggested correction onto the public corrections page. You can edit it afterwards.</p>
        <input type="hidden" name="id" value={id} />
        {data.desk_correction_id ? (
          <p>
            <Link href="/admin/corrections">A correction entry already exists.</Link>
          </p>
        ) : (
          <button className="button" type="submit">
            Create correction entry
          </button>
        )}
      </form>
    </AdminShell>
  );
}
