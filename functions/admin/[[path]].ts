import { loginPage, sessionEmail, tablePage } from "../desk";

const PAGES: Record<string, string> = {
  stories: "stories",
  submissions: "submissions",
  signups: "signups",
  "error-reports": "errors",
};

export async function onRequestGet(context: { request: Request }) {
  const email = await sessionEmail(context.request);
  if (!email) return loginPage("");
  const url = new URL(context.request.url);
  const part = url.pathname.replace(/^\/admin\/?/, "").split("/")[0] || "";
  const kind = PAGES[part];
  if (!kind) {
    return new Response(null, { status: 302, headers: { Location: "/admin", "X-Robots-Tag": "noindex, nofollow" } });
  }
  return tablePage(kind);
}
