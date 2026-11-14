import { postAdminLogin } from "../../../lib/http/admin-session";

export function onRequestPost(context: { request: Request }) {
  return postAdminLogin(context.request);
}
