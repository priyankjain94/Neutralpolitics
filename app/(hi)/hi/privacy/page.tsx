import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("hi", "privacy", "/privacy");
export default function Page() { return <StaticRoute lang="hi" name="privacy" />; }
