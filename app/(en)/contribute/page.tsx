import { ContributePage } from "@/components/ContributePage";
import { pageMetadata } from "@/lib/seo";
import { t } from "@/lib/i18n";
const m = t("en");
export const metadata = pageMetadata({
  lang: "en",
  path: "/contribute",
  title: m.contributeTitle,
  description: m.contributeSub,
});
export default function Page() { return <ContributePage lang="en" />; }
