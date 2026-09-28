import { SearchRoute, searchMeta } from "@/lib/render";
export const metadata = searchMeta("en");
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  return <SearchRoute lang="en" query={query.q || ""} />;
}
