import { ContactPage } from "@/components/ContactPage";
import { staticMeta } from "@/lib/render";
export const metadata = staticMeta("en", "contact", "/contact");
export default function Page() { return <ContactPage lang="en" />; }
