import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "np_admin";
const MAX_AGE = 60 * 60 * 12;

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(password: string, payload: string): string {
  return createHmac("sha256", password).update(payload).digest("hex");
}

export function signAdminToken(password: string): string {
  const payload = `v1.${Date.now() + MAX_AGE * 1000}`;
  return `${payload}.${sign(password, payload)}`;
}

export function verifyAdminToken(token: string | undefined, password: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = sign(password, payload);
  const left = Buffer.from(parts[2]);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;
  const exp = Number(parts[1]);
  return Number.isFinite(exp) && exp > Date.now();
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  const left = createHash("sha256").update(input).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export async function isAdmin(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const jar = await cookies();
  return verifyAdminToken(jar.get(COOKIE)?.value, password);
}

export async function setAdminCookie(): Promise<void> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("Admin password is not configured");
  const jar = await cookies();
  jar.set(COOKIE, signAdminToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
