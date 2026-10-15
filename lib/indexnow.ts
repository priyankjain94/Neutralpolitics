const INDEXNOW_KEY = "7f3a9c2e1b8d4f06a5c7e9b1d3f64820";
const sent = new Set<string>();

export function indexNowKey(): string {
  return INDEXNOW_KEY;
}

function canPing(): boolean {
  if (process.env.NEXT_PHASE === "phase-production-build") return false;
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return false;
  return true;
}

/** Tell Bing and other IndexNow engines about newly public URLs. The key file is public. */
export async function pingIndexNow(urls: string[]): Promise<void> {
  if (!canPing()) return;
  const fresh = [...new Set(urls.map((url) => url.trim()).filter(Boolean))].filter((url) => !sent.has(url));
  if (!fresh.length) return;
  for (const url of fresh) sent.add(url);
  const host = "www.neutralpolitics.in";
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
        urlList: fresh.slice(0, 10000),
      }),
    });
  } catch {
    for (const url of fresh) sent.delete(url);
  }
}
