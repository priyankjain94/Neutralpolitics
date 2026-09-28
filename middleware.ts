import { NextResponse, type NextRequest } from "next/server";
import published from "./data/published.json";
import { readSession } from "./lib/admin-session";

function keyOf(match: RegExpMatchArray | null): string {
  return match ? `${match[1]}/${match[2]}/${match[3]}` : "";
}

async function overrideStatus(slug: string, lang: "en" | "hi"): Promise<string | null> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;
  try {
    const url = new URL("/rest/v1/story_overrides", base);
    url.searchParams.set("slug", `eq.${slug}`);
    url.searchParams.set("lang", `eq.${lang}`);
    url.searchParams.set("select", "status");
    const response = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const rows = (await response.json()) as { status?: string | null }[];
    return rows[0]?.status || null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin/") || pathname.startsWith("/api/admin")) {
    const secret = process.env.ADMIN_SESSION_SECRET || "";
    const session = await readSession(request.cookies.get("np_admin")?.value, secret);
    if (!session) {
      if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const hindi = pathname.match(/^\/hi\/news\/(\d{4})\/(\d{2})\/([^/]+)\/?$/);
  const english = pathname.match(/^\/news\/(\d{4})\/(\d{2})\/([^/]+)\/?$/);
  if (hindi || english) {
    const match = hindi || english;
    const lang = hindi ? "hi" : "en";
    const key = keyOf(match);
    const slug = match?.[3] || "";
    const override = await overrideStatus(slug, lang);
    const listed = lang === "hi" ? published.hi.includes(key) : published.en.includes(key);
    const live = override === "published" ? true : override === "draft" ? false : listed;
    if (!live) {
      const url = request.nextUrl.clone();
      url.pathname = lang === "hi" ? "/hi" : "/";
      url.searchParams.set("notice", lang === "hi" ? "hi-soon" : "en-soon");
      return NextResponse.redirect(url, 302);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/news/:path*", "/hi/news/:path*", "/admin/:path*", "/api/admin/:path*"],
};
