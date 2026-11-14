import { cookies } from "next/headers";
import { adminConfigured, credentialsMatch, verifyPassword } from "./admin-credentials";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, readSession, signSession } from "./admin-session";

export { adminConfigured, credentialsMatch, verifyPassword };

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const jar = await cookies();
  const session = await readSession(jar.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET || "");
  return Boolean(session);
}

export async function setAdminCookie(email: string): Promise<void> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Admin session secret is not configured");
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await signSession(email.trim().toLowerCase(), secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
