import { CorrectionsPage } from "@/components/CorrectionsPage";
import { staticMeta } from "@/lib/render";
export const revalidate = 60;
export const metadata = staticMeta("hi", "corrections", "/corrections");
export default function Page() { return <CorrectionsPage lang="hi" />; }
