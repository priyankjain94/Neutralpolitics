import { postAdminLogout } from "../../../lib/http/admin-session";

export function onRequestPost(context: { request: Request }) {
  return postAdminLogout(context.request);
}
