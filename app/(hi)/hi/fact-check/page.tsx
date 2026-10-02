import { FactCheckPage } from "@/components/FactCheckPage";
import { staticMeta } from "@/lib/render";
export const revalidate = 60;
export const metadata = staticMeta("hi", "fact-check", "/fact-check");
export default function Page() { return <FactCheckPage lang="hi" />; }
