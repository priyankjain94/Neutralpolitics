import { postUnsubscribe } from "@/lib/http/unsubscribe";

export function POST(request: Request) {
  return postUnsubscribe(request);
}
