import { ContributorForm } from "./ContributorForm";
import { isUploadConfigured } from "@/lib/env";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function ContributePage({ lang }: { lang: Lang }) {
  const m = t(lang);
  const steps = [
    ["1", m.howRecord, m.howRecordBody],
    ["2", m.howUpload, m.howUploadBody],
    ["3", m.howVerify, m.howVerifyBody],
  ];
  return (
    <div className="wrap contribute-page">
      <p className="kicker">{m.contributeKicker}</p>
      <h1 className="page-title">{m.contributeTitle}</h1>
      <p className="lede">{m.contributeIntro}</p>
      <ol className="how-steps">
        {steps.map(([number, title, body]) => (
          <li key={number}>
            <span>{number}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </li>
        ))}
      </ol>
      <ContributorForm lang={lang} enabled={isUploadConfigured()} />
      <section className="faq">
        <h2>{m.faqTitle}</h2>
        <details>
          <summary>{m.faqPayQ}</summary>
          <p>{m.faqPayA}</p>
        </details>
        <details>
          <summary>{m.faqIdQ}</summary>
          <p>{m.faqIdA}</p>
        </details>
      </section>
    </div>
  );
}
