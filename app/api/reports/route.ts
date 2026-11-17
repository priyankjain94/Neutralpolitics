import { postReport } from "@/lib/http/reports";

export function POST(request: Request) {
  return postReport(request);
}
