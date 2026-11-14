import { TopicRoute, topicMeta, topicStaticParams } from "@/lib/render";

export const dynamicParams = false;

export function generateStaticParams() {
  return topicStaticParams();
}

export function generateMetadata(props: { params: Promise<{ tag: string }> }) {
  return topicMeta("en", props.params);
}

export default function Page(props: { params: Promise<{ tag: string }> }) {
  return TopicRoute("en", props.params);
}
