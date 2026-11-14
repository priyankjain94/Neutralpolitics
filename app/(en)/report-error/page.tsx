import { ErrorReportForm } from "@/components/ErrorReportForm";
import { publicDatabaseFormsEnabled } from "@/lib/env";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/report-error",
  title: "Report an error",
  description: "Tell Neutral Politics what to correct on a story.",
  noindex: true,
});

export default function Page() {
  const m = t("en");
  return (
    <div className="wrap prose-page">
      <h1 className="page-title">{m.reportError}</h1>
      <ErrorReportForm lang="en" enabled={publicDatabaseFormsEnabled()} />
    </div>
  );
}
