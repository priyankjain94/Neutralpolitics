import { postContributeComplete } from "@/lib/http/contribute-complete";

export function POST(request: Request) {
  return postContributeComplete(request);
}
