import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("hi", "contribute-terms", "/contribute/terms");
export default function Page() { return <StaticRoute lang="hi" name="contribute-terms" />; }
