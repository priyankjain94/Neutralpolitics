import { dashboardPage, loginPage, sessionEmail } from "../desk";

export async function onRequestGet(context: { request: Request }) {
  const url = new URL(context.request.url);
  const email = await sessionEmail(context.request);
  if (!email) return loginPage(url.searchParams.get("e") || "");
  return dashboardPage(email);
}
