import { postReport } from "../../lib/http/reports";

export function onRequestPost(context: { request: Request }) {
  return postReport(context.request);
}
