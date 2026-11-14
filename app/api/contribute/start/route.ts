import { postContributeStart } from "@/lib/http/contribute-start";

export function POST(request: Request) {
  return postContributeStart(request);
}
