import { staticMeta, StaticRoute } from "@/lib/render";
export const metadata = staticMeta("hi", "about", "/about");
export default function Page() { return <StaticRoute lang="hi" name="about" />; }
