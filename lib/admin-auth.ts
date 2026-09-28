import { createHash, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, readSession, signSession } from "./admin-session";

export function adminConfigured(): boolean {
  const email = process.env.ADMIN_EMAIL || "";
  const hash = process.env.ADMIN_PASSWORD_HASH || "";
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  return Boolean(email && secret && hash.startsWith("scrypt$") && hash.split("$").length === 3);
}

export function verifyPassword(password: string, stored: string): boolean {
  const [kind, salt, key] = stored.split("$");
  if (kind !== "scrypt" || !salt || !key) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(key, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function sameEmail(input: string, expected: string): boolean {
  const left = createHash("sha256").update(input.trim().toLowerCase()).digest();
  const right = createHash("sha256").update(expected.trim().toLowerCase()).digest();
  return timingSafeEqual(left, right);
}

export function credentialsMatch(email: string, password: string): boolean {
  if (!adminConfigured()) return false;
  const okEmail = sameEmail(email, process.env.ADMIN_EMAIL || "");
  const okPassword = verifyPassword(password, process.env.ADMIN_PASSWORD_HASH || "");
  return okEmail && okPassword;
}

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
