import { postSubscribe } from "../../lib/http/subscribe";

export function onRequestPost(context: { request: Request }) {
  return postSubscribe(context.request);
}
