import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("en", "contribute-terms", "/contribute/terms");
export default function Page() { return <StaticRoute lang="en" name="contribute-terms" />; }
