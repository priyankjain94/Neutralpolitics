import { adminConfigured, credentialsMatch } from "../admin-credentials";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, signSession } from "../admin-session";
import { getDb } from "../db";
import { rateLimit } from "../rate-limit";
import { clientIp } from "../request";

function cookie(token: string, request: Request): string {
  const secure = new URL(request.url).protocol === "https:";
  return `${ADMIN_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${ADMIN_MAX_AGE}${secure ? "; Secure" : ""}`;
}

async function audit(action: string, target: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.from("audit_log").insert({
    actor: process.env.ADMIN_EMAIL || "admin",
    action,
    target,
    detail: null,
  });
}

export async function postAdminLogin(request: Request): Promise<Response> {
  const back = (code: string) =>
    new Response(null, { status: 303, headers: { Location: code ? `/admin?e=${code}` : "/admin" } });
  if (!adminConfigured()) return back("");
  const ip = clientIp(request);
  if (!rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000)) return back("rate");
  const form = await request.formData().catch(() => null);
  const email = String(form?.get("email") || "");
  const password = String(form?.get("password") || "");
  if (!credentialsMatch(email, password)) {
    await audit("login_failed", email.trim().toLowerCase());
    return back("1");
  }
  const token = await signSession(email.trim().toLowerCase(), process.env.ADMIN_SESSION_SECRET || "");
  await audit("login", email.trim().toLowerCase());
  return new Response(null, {
    status: 303,
    headers: { Location: "/admin", "Set-Cookie": cookie(token, request) },
  });
}

export async function postAdminLogout(request: Request): Promise<Response> {
  await audit("logout", process.env.ADMIN_EMAIL || "admin");
  const secure = new URL(request.url).protocol === "https:";
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/admin",
      "Set-Cookie": `${ADMIN_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? "; Secure" : ""}`,
    },
  });
}
