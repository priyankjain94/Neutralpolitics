import { SearchRoute, searchMeta } from "@/lib/render";
export const metadata = searchMeta("hi");
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  return <SearchRoute lang="hi" query={query.q || ""} />;
}
