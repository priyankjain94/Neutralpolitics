export const ADMIN_COOKIE = "np_admin";
export const ADMIN_MAX_AGE = 60 * 60 * 12;

function toB64Url(bytes: Uint8Array): string {
  let raw = "";
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(value: string): Uint8Array {
  const pad = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = pad + "=".repeat((4 - (pad.length % 4)) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toB64Url(new Uint8Array(sig));
}

export async function signSession(email: string, secret: string): Promise<string> {
  const payload = toB64Url(
    new TextEncoder().encode(JSON.stringify({ email, exp: Date.now() + ADMIN_MAX_AGE * 1000 })),
  );
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function readSession(token: string | undefined, secret: string): Promise<{ email: string } | null> {
  if (!token || !secret) return null;
  const split = token.lastIndexOf(".");
  if (split <= 0) return null;
  const payload = token.slice(0, split);
  const sig = token.slice(split + 1);
  const expected = await hmac(secret, payload);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromB64Url(payload))) as { email?: string; exp?: number };
    if (!data.email || typeof data.exp !== "number" || data.exp <= Date.now()) return null;
    const allowed = process.env.ADMIN_EMAIL || "";
    if (!allowed || data.email.toLowerCase() !== allowed.toLowerCase()) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}
