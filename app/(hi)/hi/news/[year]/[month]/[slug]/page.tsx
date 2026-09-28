import { ArticleRoute, articleMeta, articleStaticParams } from "@/lib/render";
export const dynamicParams = false;
export function generateStaticParams() { return articleStaticParams("hi"); }
export function generateMetadata(props: { params: Promise<{ year: string; month: string; slug: string }> }) {
  return articleMeta("hi", props.params);
}
export default function Page(props: { params: Promise<{ year: string; month: string; slug: string }> }) {
  return ArticleRoute("hi", props.params);
}
