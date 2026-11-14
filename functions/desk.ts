import published from "../data/published.json";
import { ADMIN_COOKIE, readSession } from "../lib/admin-session";
import { adminConfigured } from "../lib/admin-credentials";
import { getDb } from "../lib/db";

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sessionEmail(request: Request): Promise<string | null> {
  const raw = request.headers.get("cookie") || "";
  let token = "";
  for (const part of raw.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === ADMIN_COOKIE) token = decodeURIComponent(rest.join("="));
  }
  const session = await readSession(token, process.env.ADMIN_SESSION_SECRET || "");
  return session?.email || null;
}

export function page(title: string, body: string): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${esc(title)} | Neutral Politics</title>
  <style>
    body { font: 16px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 2rem auto; max-width: 52rem; padding: 0 1rem; color: #121212; }
    a { color: #0b3d91; }
    form { display: grid; gap: 0.8rem; max-width: 22rem; }
    label { display: grid; gap: 0.25rem; }
    input, button { font: inherit; padding: 0.45rem 0.6rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid #ddd; text-align: left; padding: 0.35rem 0.4rem; vertical-align: top; }
    .nav a { margin-right: 0.8rem; }
    .error { color: #8d1d1d; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
  });
}

export function loginPage(error: string): Response {
  const message =
    error === "1" ? `<p class="error">That email or password is not right.</p>` : error === "rate" ? `<p class="error">Too many tries. Wait 15 minutes and try again.</p>` : "";
  if (!adminConfigured()) {
    return page(
      "Desk",
      `<p>Neutral Politics</p><h1>Desk</h1><p>Admin is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET.</p>`,
    );
  }
  return page(
    "Desk",
    `<p>Neutral Politics</p>
<h1>Desk</h1>
<form method="post" action="/api/admin/login">
  <label>Email <input name="email" type="email" autocomplete="username" required /></label>
  <label>Password <input name="password" type="password" autocomplete="current-password" required /></label>
  <button type="submit">Enter</button>
</form>
${message}`,
  );
}

function nav(current: string): string {
  const links = [
    ["dashboard", "/admin", "Dashboard"],
    ["stories", "/admin/stories", "Stories"],
    ["submissions", "/admin/submissions", "Submissions"],
    ["signups", "/admin/signups", "Signups"],
    ["errors", "/admin/error-reports", "Error reports"],
  ];
  return `<p class="nav">${links
    .map(([id, href, label]) => (id === current ? `<strong>${label}</strong>` : `<a href="${href}">${label}</a>`))
    .join(" ")} <form style="display:inline" method="post" action="/api/admin/logout"><button type="submit">Log out</button></form></p>`;
}

export async function dashboardPage(email: string): Promise<Response> {
  const db = getDb();
  const publishedCount = new Set([...published.en, ...published.hi]).size;
  let pending = "—";
  let signups = "—";
  let openReports = "—";
  let activity = "<li>No admin actions yet.</li>";
  if (db) {
    const submissions = await db.from("submissions").select("desk_status, status").limit(500);
    pending = String(
      (submissions.data || []).filter((row) => {
        const status = String(row.desk_status || row.status || "new");
        return status === "new" || status === "under_review" || status === "verifying";
      }).length,
    );
    const signupRows = await db.from("signups").select("id").limit(500);
    signups = String(signupRows.data?.length || 0);
    const reports = await db.from("error_reports").select("status").limit(500);
    openReports = String((reports.data || []).filter((row) => row.status === "new" || row.status === "reviewing").length);
    const audit = await db.from("audit_log").select("id, at, action, target, detail").order("at", { ascending: false }).limit(12);
    if (audit.data && audit.data.length) {
      activity = audit.data
        .map(
          (row) =>
            `<li><time>${esc(row.at)}</time> ${esc(row.action)}${row.target ? ` · ${esc(row.target)}` : ""}${row.detail ? ` · ${esc(row.detail)}` : ""}</li>`,
        )
        .join("");
    }
  }
  return page(
    "Desk",
    `${nav("dashboard")}
<h1>Dashboard</h1>
<p>Signed in as ${esc(email)}.</p>
${!db ? "<p>The database is not configured. Story counts below come from the files baked at build time. Submissions, signups and error reports need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the Pages function.</p>" : ""}
<ul>
  <li>Published story files: ${publishedCount}</li>
  <li>Draft files waiting for a rebuild: ${published.draft.length}</li>
  <li>Open submissions: ${esc(pending)}</li>
  <li>Signups: ${esc(signups)}</li>
  <li>Open error reports: ${esc(openReports)}</li>
</ul>
<p>Publishing a story is still a git commit. The next Cloudflare build writes the new HTML. Unpublishing a live story also takes effect on that build, not on the next click.</p>
<h2>Recent activity</h2>
<ul>${activity}</ul>`,
  );
}

export async function tablePage(kind: string): Promise<Response> {
  const db = getDb();
  if (!db) return page(kind, `${nav(kind)}<h1>${esc(kind)}</h1><p>The database is not configured.</p>`);
  if (kind === "stories") {
    const rows = [...published.en].sort().map((key) => `<tr><td>${esc(key)}</td><td>${published.hi.includes(key) ? "en + hi" : "en"}</td></tr>`);
    return page(
      "Stories",
      `${nav("stories")}<h1>Stories</h1><p>These are the files in this build. The story editor that writes Supabase overrides still runs with <code>npm run dev</code>. A new public page needs a new build.</p><table><thead><tr><th>Slug</th><th>Languages</th></tr></thead><tbody>${rows.join("")}</tbody></table>`,
    );
  }
  if (kind === "signups") {
    const { data, error } = await db.from("signups").select("created_at, email, whatsapp_e164, language, channel").order("created_at", { ascending: false }).limit(100);
    if (error) return page("Signups", `${nav("signups")}<h1>Signups</h1><p class="error">Could not load signups.</p>`);
    const rows = (data || [])
      .map(
        (row) =>
          `<tr><td>${esc(row.created_at)}</td><td>${esc(row.email)}</td><td>${esc(row.whatsapp_e164)}</td><td>${esc(row.language)}</td><td>${esc(row.channel)}</td></tr>`,
      )
      .join("");
    return page(
      "Signups",
      `${nav("signups")}<h1>Signups</h1><table><thead><tr><th>When</th><th>Email</th><th>WhatsApp</th><th>Language</th><th>Channel</th></tr></thead><tbody>${rows || `<tr><td colspan="5">Nothing here yet.</td></tr>`}</tbody></table>`,
    );
  }
  if (kind === "errors") {
    const { data, error } = await db
      .from("error_reports")
      .select("created_at, status, language, story_ref, what_wrong")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return page("Error reports", `${nav("errors")}<h1>Error reports</h1><p class="error">Could not load error reports.</p>`);
    const rows = (data || [])
      .map(
        (row) =>
          `<tr><td>${esc(row.created_at)}</td><td>${esc(row.status)}</td><td>${esc(row.language)}</td><td>${esc(row.story_ref)}</td><td>${esc(row.what_wrong)}</td></tr>`,
      )
      .join("");
    return page(
      "Error reports",
      `${nav("errors")}<h1>Error reports</h1><table><thead><tr><th>When</th><th>Status</th><th>Language</th><th>Story</th><th>What is wrong</th></tr></thead><tbody>${rows || `<tr><td colspan="5">Nothing here yet.</td></tr>`}</tbody></table>`,
    );
  }
  const { data, error } = await db
    .from("submissions")
    .select("created_at, reference, name, city, desk_status, video_mime")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return page("Submissions", `${nav("submissions")}<h1>Submissions</h1><p class="error">Could not load submissions.</p>`);
  const rows = (data || [])
    .map(
      (row) =>
        `<tr><td>${esc(row.created_at)}</td><td>${esc(row.reference)}</td><td>${esc(row.name)}</td><td>${esc(row.city)}</td><td>${esc(row.desk_status)}</td><td>${esc(row.video_mime)}</td></tr>`,
    )
    .join("");
  return page(
    "Submissions",
    `${nav("submissions")}<h1>Submissions</h1><p>Status changes from the old desk screens still run with <code>npm run dev</code>. New videos still upload through the public contribute form.</p><table><thead><tr><th>When</th><th>Reference</th><th>Name</th><th>City</th><th>Status</th><th>Video</th></tr></thead><tbody>${rows || `<tr><td colspan="6">Nothing here yet.</td></tr>`}</tbody></table>`,
  );
}
