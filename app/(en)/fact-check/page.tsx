import { FactCheckPage } from "@/components/FactCheckPage";
import { staticMeta } from "@/lib/render";
export const metadata = staticMeta("en", "fact-check", "/fact-check");
export default function Page() { return <FactCheckPage lang="en" />; }
