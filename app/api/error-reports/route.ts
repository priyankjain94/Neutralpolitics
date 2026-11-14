import { postErrorReport } from "@/lib/http/error-reports";

export function POST(request: Request) {
  return postErrorReport(request);
}
