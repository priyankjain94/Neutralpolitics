import { ContributePage } from "@/components/ContributePage";
import { pageMetadata } from "@/lib/seo";
import { t } from "@/lib/i18n";
const m = t("hi");
export const metadata = pageMetadata({
  lang: "hi",
  path: "/contribute",
  title: m.contributeTitle,
  description: m.contributeSub,
});
export default function Page() { return <ContributePage lang="hi" />; }
