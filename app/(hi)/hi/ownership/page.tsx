import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("hi", "ownership", "/ownership");
export default function Page() { return <StaticRoute lang="hi" name="ownership" />; }
