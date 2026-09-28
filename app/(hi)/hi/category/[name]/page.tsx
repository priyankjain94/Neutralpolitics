import { CategoryRoute, categoryMeta, categoryStaticParams } from "@/lib/render";
export const dynamic = "force-dynamic";
export const dynamicParams = false;
export function generateStaticParams() { return categoryStaticParams(); }
export function generateMetadata(props: { params: Promise<{ name: string }> }) {
  return categoryMeta("hi", props.params);
}
export default function Page(props: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return CategoryRoute("hi", props.params, props.searchParams);
}
