import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("en", "privacy", "/privacy");
export default function Page() { return <StaticRoute lang="en" name="privacy" />; }
