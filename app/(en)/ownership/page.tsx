import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("en", "ownership", "/ownership");
export default function Page() { return <StaticRoute lang="en" name="ownership" />; }
