import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("en", "editorial-policy", "/editorial-policy");
export default function Page() { return <StaticRoute lang="en" name="editorial-policy" />; }
