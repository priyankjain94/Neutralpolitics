import { SearchRoute, searchMeta } from "@/lib/render";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  const meta = searchMeta("hi");
  if (query.q) return { ...meta, robots: { index: false, follow: false } };
  return meta;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  return <SearchRoute lang="hi" query={query.q || ""} />;
}
