import { NextResponse, type NextRequest } from "next/server";
import published from "./data/published.json";

function keyOf(match: RegExpMatchArray | null): string {
  return match ? `${match[1]}/${match[2]}/${match[3]}` : "";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hindi = pathname.match(/^\/hi\/news\/(\d{4})\/(\d{2})\/([^/]+)\/?$/);
  const english = pathname.match(/^\/news\/(\d{4})\/(\d{2})\/([^/]+)\/?$/);
  if (hindi) {
    const key = keyOf(hindi);
    if (!published.hi.includes(key) && (published.draft.includes(key) || published.en.includes(key))) {
      const url = request.nextUrl.clone();
      url.pathname = "/hi";
      url.searchParams.set("notice", "hi-soon");
      return NextResponse.redirect(url, 302);
    }
  }
  if (english) {
    const key = keyOf(english);
    if (!published.en.includes(key) && (published.draft.includes(key) || published.hi.includes(key))) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("notice", "en-soon");
      return NextResponse.redirect(url, 302);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/news/:path*", "/hi/news/:path*"],
};
