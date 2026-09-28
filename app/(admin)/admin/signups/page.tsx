import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SignupsPage() {
  if (!(await isAdmin())) redirect("/admin");
  const db = getDb();
  const { data } = db ? await db.from("signups").select("*").order("created_at", { ascending: false }).limit(300) : { data: [] };
  return (
    <AdminShell current="signups">
      <h1 className="page-title">Signups</h1>
      {!isDatabaseConfigured() ? <p className="closed">The database is not configured.</p> : null}
      <p>
        <a href="/admin/signups/export">Export CSV</a>
      </p>
      <p className="dek">{data?.length || 0} rows. Nothing is sent from this list yet.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>Language</th>
              <th>Channel</th>
              <th>Topics</th>
              <th>Unsubscribed</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).length === 0 ? (
              <tr>
                <td colSpan={7}>Nothing here yet.</td>
              </tr>
            ) : (
              data!.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.created_at, "en")}</td>
                  <td>{row.email || "—"}</td>
                  <td>{row.whatsapp_e164 || "—"}</td>
                  <td>{row.language}</td>
                  <td>{row.channel}</td>
                  <td>{(row.topics || []).join(", ")}</td>
                  <td>{row.unsubscribed_at ? "yes" : "no"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
