import { ContactPage } from "@/components/ContactPage";
import { staticMeta } from "@/lib/render";
export const metadata = staticMeta("hi", "contact", "/contact");
export default function Page() { return <ContactPage lang="hi" />; }
