import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("en", "about", "/about");
export default function Page() { return <StaticRoute lang="en" name="about" />; }
