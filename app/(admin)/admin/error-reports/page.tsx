import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS = ["", "new", "reviewing", "fixed", "rejected"] as const;

export default async function ErrorReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const query = await searchParams;
  const status = FILTERS.includes(query.status as (typeof FILTERS)[number]) ? query.status || "" : "";
  const db = getDb();
  const rows = db ? await db.from("error_reports").select("*").order("created_at", { ascending: false }).limit(300) : { data: [] };
  const list = (rows.data || []).filter((row) => !status || row.status === status);
  return (
    <AdminShell current="errors">
      <h1 className="page-title">Error reports</h1>
      {!isDatabaseConfigured() ? <p className="closed">The database is not configured.</p> : null}
      <p>
        <a href="/admin/error-reports/export">Export CSV</a>
      </p>
      <p className="filters">
        {FILTERS.map((item) => (
          <Link key={item || "all"} href={item ? `/admin/error-reports?status=${item}` : "/admin/error-reports"} aria-current={!status && !item || status === item ? "page" : undefined}>
            {item || "All"}
          </Link>
        ))}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Status</th>
              <th>Language</th>
              <th>Story</th>
              <th>What is wrong</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5}>Nothing here yet.</td>
              </tr>
            ) : null}
            {list.map((row) => (
              <tr key={String(row.id)}>
                <td>{formatDateTime(String(row.created_at), "en")}</td>
                <td>{String(row.status)}</td>
                <td>{String(row.language)}</td>
                <td>{String(row.story_ref)}</td>
                <td>
                  <Link href={`/admin/error-reports/${row.id}`}>{String(row.what_wrong).slice(0, 140)}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
