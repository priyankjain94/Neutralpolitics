import { CategoryRoute, categoryMeta, categoryStaticParams } from "@/lib/render";
export const dynamicParams = false;
export function generateStaticParams() { return categoryStaticParams(); }
export function generateMetadata(props: { params: Promise<{ name: string }> }) {
  return categoryMeta("hi", props.params);
}
export default function Page(props: { params: Promise<{ name: string }> }) {
  return CategoryRoute("hi", props.params);
}
