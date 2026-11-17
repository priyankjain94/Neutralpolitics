import { postSubscribe } from "@/lib/http/subscribe";

export function POST(request: Request) {
  return postSubscribe(request);
}
