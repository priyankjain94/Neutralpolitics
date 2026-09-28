import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("en", "terms", "/terms");
export default function Page() { return <StaticRoute lang="en" name="terms" />; }
