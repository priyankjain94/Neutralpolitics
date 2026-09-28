import { ArticleRoute, articleMeta, articleStaticParams } from "@/lib/render";
export const dynamicParams = true;
export const revalidate = 60;
export function generateStaticParams() { return articleStaticParams("en"); }
export function generateMetadata(props: { params: Promise<{ year: string; month: string; slug: string }> }) {
  return articleMeta("en", props.params);
}
export default function Page(props: { params: Promise<{ year: string; month: string; slug: string }> }) {
  return ArticleRoute("en", props.params);
}
