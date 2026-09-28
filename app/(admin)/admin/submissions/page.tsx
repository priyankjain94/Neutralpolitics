import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "verifying", "approved", "rejected", "posted"];

function bytes(value: number | null) {
  if (!value) return "—";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; db?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const query = await searchParams;
  const dbReady = isDatabaseConfigured();
  let rows: Record<string, unknown>[] = [];
  if (dbReady) {
    const db = getDb();
    if (db) {
      let request = db.from("submissions").select("*").order("created_at", { ascending: false }).limit(200);
      if (query.status && STATUSES.includes(query.status)) request = request.eq("status", query.status);
      const { data } = await request;
      rows = data || [];
      const q = (query.q || "").toLowerCase();
      if (q) {
        rows = rows.filter((row) =>
          [row.reference, row.name, row.city, row.description].join(" ").toLowerCase().includes(q),
        );
      }
    }
  }
  return (
    <AdminShell current="submissions">
      <h1 className="page-title">Submissions</h1>
      {!dbReady || query.db === "0" ? (
        <p className="closed">
          The database is not configured, so there are no rows to review. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
          The review screen below is ready.
        </p>
      ) : null}
      <form className="filters" method="get">
        <select name="status" defaultValue={query.status || ""} aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <input name="q" defaultValue={query.q || ""} placeholder="Search name, city, reference" aria-label="Search" />
        <button className="button" type="submit">
          Filter
        </button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Received</th>
              <th>Name</th>
              <th>City</th>
              <th>Description</th>
              <th>Size</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>Nothing here yet.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={String(row.id)}>
                  <td>
                    <Link href={`/admin/submissions/${row.id}`}>{String(row.reference)}</Link>
                  </td>
                  <td>{formatDateTime(String(row.created_at), "en")}</td>
                  <td>{String(row.name)}</td>
                  <td>{String(row.city)}</td>
                  <td>{String(row.description).slice(0, 80)}</td>
                  <td>{bytes(Number(row.video_size_bytes) || null)}</td>
                  <td>
                    <span className={`chip chip-${row.status}`}>{String(row.status)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
