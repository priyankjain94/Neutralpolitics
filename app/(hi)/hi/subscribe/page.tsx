import { SubscribeRoute } from "@/lib/render";
import { pageMetadata } from "@/lib/seo";
import { t } from "@/lib/i18n";
const m = t("hi");
export const metadata = pageMetadata({
  lang: "hi",
  path: "/subscribe",
  title: m.newsletterTitle,
  description: m.newsletterBody,
});
export default function Page() { return <SubscribeRoute lang="hi" />; }
