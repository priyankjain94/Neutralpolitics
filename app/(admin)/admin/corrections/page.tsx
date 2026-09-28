import { redirect } from "next/navigation";
import { saveCorrection } from "../actions";
import { AdminShell } from "@/components/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CorrectionsAdmin({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const query = await searchParams;
  const db = getDb();
  const rows = db ? await db.from("desk_corrections").select("*").order("created_at", { ascending: false }).limit(100) : { data: [] };
  return (
    <AdminShell current="corrections">
      <h1 className="page-title">Corrections</h1>
      <p className="dek">Entries here are shown on the public corrections page, in addition to notes stored on story files.</p>
      {!isDatabaseConfigured() ? <p className="closed">The database is not configured.</p> : null}
      {query.e ? <p className="error-text">Write a note of at least a few words.</p> : null}
      <form action={saveCorrection} className="form">
        <h2>Add an entry</h2>
        <label>
          Note
          <textarea name="note" required minLength={5} />
        </label>
        <label>
          Language
          <select name="lang" defaultValue="both">
            <option value="both">English and Hindi</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </label>
        <label>
          Story slug <span className="fine">(optional)</span>
          <input name="article_slug" />
        </label>
        <label>
          Year
          <input name="article_year" placeholder="2026" />
        </label>
        <label>
          Month
          <input name="article_month" placeholder="09" />
        </label>
        <label className="check">
          <input type="checkbox" name="visible" defaultChecked />
          <span>Visible on the public page</span>
        </label>
        <button className="button" type="submit" disabled={!isDatabaseConfigured()}>
          Save
        </button>
      </form>
      <ul className="log">
        {(rows.data || []).map((row) => (
          <li key={String(row.id)}>
            <time dateTime={String(row.created_at)}>{formatDateTime(String(row.created_at), "en")}</time>
            <form action={saveCorrection} className="form">
              <input type="hidden" name="id" value={String(row.id)} />
              <label>
                Note
                <textarea name="note" defaultValue={String(row.note || "")} />
              </label>
              <label>
                Language
                <select name="lang" defaultValue={String(row.lang || "both")}>
                  <option value="both">English and Hindi</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </label>
              <label>
                Story slug
                <input name="article_slug" defaultValue={String(row.article_slug || "")} />
              </label>
              <input type="hidden" name="article_year" value={String(row.article_year || "")} />
              <input type="hidden" name="article_month" value={String(row.article_month || "")} />
              <label className="check">
                <input type="checkbox" name="visible" defaultChecked={row.visible !== false} />
                <span>Visible</span>
              </label>
              <button className="button" type="submit">
                Update
              </button>
            </form>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
