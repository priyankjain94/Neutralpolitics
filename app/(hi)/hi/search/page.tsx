import { SearchRoute, searchMeta } from "@/lib/render";

export const metadata = searchMeta("hi");

export default function Page() {
  return <SearchRoute lang="hi" query="" />;
}
