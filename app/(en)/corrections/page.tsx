import { CorrectionsPage } from "@/components/CorrectionsPage";
import { staticMeta } from "@/lib/render";
export const metadata = staticMeta("en", "corrections", "/corrections");
export default function Page() { return <CorrectionsPage lang="en" />; }
