import { postUnsubscribe } from "../../lib/http/unsubscribe";

export function onRequestPost(context: { request: Request }) {
  return postUnsubscribe(context.request);
}
