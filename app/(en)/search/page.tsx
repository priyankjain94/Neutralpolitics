import { SearchRoute, searchMeta } from "@/lib/render";

export const metadata = searchMeta("en");

export default function Page() {
  return <SearchRoute lang="en" query="" />;
}
