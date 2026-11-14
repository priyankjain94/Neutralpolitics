import { postAdminLogout } from "@/lib/http/admin-session";

export function POST(request: Request) {
  return postAdminLogout(request);
}
