import { postErrorReport } from "../../lib/http/error-reports";

export function onRequestPost(context: { request: Request }) {
  return postErrorReport(context.request);
}
