import { postContributeStart } from "../../../lib/http/contribute-start";

export function onRequestPost(context: { request: Request }) {
  return postContributeStart(context.request);
}
