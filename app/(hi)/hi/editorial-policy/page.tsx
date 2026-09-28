import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("hi", "editorial-policy", "/editorial-policy");
export default function Page() { return <StaticRoute lang="hi" name="editorial-policy" />; }
