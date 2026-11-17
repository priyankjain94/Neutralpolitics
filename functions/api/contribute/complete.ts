import { postContributeComplete } from "../../../lib/http/contribute-complete";

export function onRequestPost(context: { request: Request }) {
  return postContributeComplete(context.request);
}
