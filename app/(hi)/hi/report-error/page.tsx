import { ErrorReportForm } from "@/components/ErrorReportForm";
import { isDatabaseConfigured } from "@/lib/env";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "hi",
  path: "/report-error",
  title: "गलती बताएँ",
  description: "न्यूट्रल पॉलिटिक्स को बताएँ कि किसी खबर में क्या सुधारना है।",
  noindex: true,
});

export default async function Page({ searchParams }: { searchParams: Promise<{ story?: string }> }) {
  const query = await searchParams;
  const m = t("hi");
  return (
    <div className="wrap prose-page">
      <h1 className="page-title">{m.reportError}</h1>
      <ErrorReportForm lang="hi" enabled={isDatabaseConfigured()} story={query.story || ""} />
    </div>
  );
}
