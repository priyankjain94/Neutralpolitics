import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("hi", "terms", "/terms");
export default function Page() { return <StaticRoute lang="hi" name="terms" />; }
