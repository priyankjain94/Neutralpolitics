import { redirect } from "next/navigation";
import { updateReport } from "../actions";
import { AdminShell } from "@/components/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  if (!(await isAdmin())) redirect("/admin");
  const db = getDb();
  const { data } = db ? await db.from("reports").select("*").order("created_at", { ascending: false }).limit(200) : { data: [] };
  return (
    <AdminShell current="reports">
      <h1 className="page-title">Reports</h1>
      {!isDatabaseConfigured() ? <p className="closed">The database is not configured.</p> : null}
      <div className="table-wrap">
        {(data || []).length === 0 ? <p>Nothing here yet.</p> : null}
        {(data || []).map((row) => (
          <form key={row.id} action={updateReport} className="form" style={{ borderTop: "1px solid #e2e2e2", paddingTop: "0.8rem" }}>
            <input type="hidden" name="id" value={row.id} />
            <p>
              <strong>{row.type}</strong> · {formatDateTime(row.created_at, "en")} · {row.email || "no email"}
            </p>
            {row.article_url ? <p>{row.article_url}</p> : null}
            <p>{row.message}</p>
            <label>
              Status
              <select name="status" defaultValue={row.status}>
                <option>new</option>
                <option>reviewing</option>
                <option>done</option>
                <option>dismissed</option>
              </select>
            </label>
            <label>
              Notes
              <textarea name="notes" defaultValue={row.notes || ""} />
            </label>
            <button className="button" type="submit">
              Save
            </button>
          </form>
        ))}
      </div>
    </AdminShell>
  );
}
