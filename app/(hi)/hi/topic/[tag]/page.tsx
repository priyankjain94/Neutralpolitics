import { TopicRoute, topicMeta, topicStaticParams } from "@/lib/render";

export const revalidate = 60;
export const dynamicParams = true;

export function generateStaticParams() {
  return topicStaticParams();
}

export function generateMetadata(props: { params: Promise<{ tag: string }> }) {
  return topicMeta("hi", props.params);
}

export default function Page(props: { params: Promise<{ tag: string }> }) {
  return TopicRoute("hi", props.params);
}
