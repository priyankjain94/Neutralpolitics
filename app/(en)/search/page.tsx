import { SearchRoute, searchMeta } from "@/lib/render";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  const meta = searchMeta("en");
  if (query.q) return { ...meta, robots: { index: false, follow: false } };
  return meta;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  return <SearchRoute lang="en" query={query.q || ""} />;
}
