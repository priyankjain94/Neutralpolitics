import { postAdminLogin } from "@/lib/http/admin-session";

export function POST(request: Request) {
  return postAdminLogin(request);
}
