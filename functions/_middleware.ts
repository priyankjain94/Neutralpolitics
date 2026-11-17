import published from "../data/published.json";
import { articleRedirect, searchQueryNoindex, shouldNoindexHost } from "../lib/host-gate";

type MiddlewareContext = { request: Request; next: () => Promise<Response> };

function stamped(response: Response, noindex: boolean): Response {
  if (!noindex) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function onRequest(context: MiddlewareContext): Promise<Response> {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();
  if (host === "neutralpolitics.in") {
    url.protocol = "https:";
    url.hostname = "www.neutralpolitics.in";
    url.port = "";
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return Response.redirect(url.toString(), 308);
  }
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return stamped(new Response(null, { status: 308, headers: { Location: `${url.pathname}${url.search}` } }), shouldNoindexHost(host));
  }
  const dest = articleRedirect(url.pathname, published);
  if (dest) {
    return new Response(null, {
      status: 302,
      headers: { Location: dest, "X-Robots-Tag": "noindex, nofollow" },
    });
  }
  const response = await context.next();
  const noindex = shouldNoindexHost(host) || searchQueryNoindex(url.pathname, url.searchParams);
  return stamped(response, noindex);
}
