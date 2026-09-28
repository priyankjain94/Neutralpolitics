import { login } from "./actions";
import { AdminShell } from "@/components/AdminShell";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { allMerged } from "@/lib/desk";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ e?: string; db?: string }> }) {
  const query = await searchParams;
  const configured = adminConfigured();
  if (!(await isAdmin())) {
    return (
      <main className="wrap login">
        <p className="kicker">Neutral Politics</p>
        <h1 className="page-title">Desk</h1>
        {!configured ? (
          <p className="closed">
            Admin is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET. There is no default password, and the password is not stored in the repository.
          </p>
        ) : (
          <form className="form" action={login}>
            <label>
              Email
              <input name="email" type="email" autoComplete="username" required />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button className="button" type="submit">
              Enter
            </button>
            {query.e === "1" ? <p className="error-text">That email or password is not right.</p> : null}
            {query.e === "rate" ? <p className="error-text">Too many tries. Wait 15 minutes and try again.</p> : null}
          </form>
        )}
      </main>
    );
  }

  const articles = await allMerged();
  const published = new Set(articles.filter((article) => article.status === "published").map((article) => article.slug)).size;
  const drafts = new Set(articles.filter((article) => article.status !== "published").map((article) => article.slug)).size;
  const db = getDb();
  const submissions = db ? await db.from("submissions").select("desk_status, status").limit(500) : { data: [] };
  const pending = (submissions.data || []).filter((row) => {
    const status = String(row.desk_status || row.status || "new");
    return status === "new" || status === "under_review" || status === "verifying";
  }).length;
  const signups = db ? await db.from("signups").select("id").limit(500) : { data: [] };
  const audit = db ? await db.from("audit_log").select("*").order("at", { ascending: false }).limit(12) : { data: [] };

  return (
    <AdminShell current="dashboard">
      <h1 className="page-title">Dashboard</h1>
      {!isDatabaseConfigured() || query.db === "0" ? (
        <p className="closed">The database is not configured. Counts of stories still come from the files. Submissions, signups and edits need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.</p>
      ) : null}
      <div className="cat-grid">
        <article>
          <p className="kicker">Published</p>
          <h2>{published}</h2>
        </article>
        <article>
          <p className="kicker">Drafts</p>
          <h2>{drafts}</h2>
        </article>
        <article>
          <p className="kicker">Open submissions</p>
          <h2>{db ? pending : "—"}</h2>
        </article>
        <article>
          <p className="kicker">Signups</p>
          <h2>{db ? signups.data?.length || 0 : "—"}</h2>
        </article>
      </div>
      <h2 className="rule-title">Recent activity</h2>
      <ul className="log">
        {(audit.data || []).length === 0 ? <li>No admin actions yet.</li> : null}
        {(audit.data || []).map((row) => (
          <li key={String(row.id)}>
            <time dateTime={String(row.at)}>{formatDateTime(String(row.at), "en")}</time>
            <p>
              {String(row.action)}
              {row.target ? ` · ${row.target}` : ""}
              {row.detail ? ` · ${row.detail}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
