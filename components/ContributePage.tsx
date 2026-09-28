import { ContributorForm } from "./ContributorForm";
import { isUploadConfigured } from "@/lib/env";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function ContributePage({ lang }: { lang: Lang }) {
  const m = t(lang);
  const steps = [
    [m.step1t, m.step1d],
    [m.step2t, m.step2d],
    [m.step3t, m.step3d],
  ];
  return (
    <div className="wrap">
      <p className="kicker">{m.contributeKicker}</p>
      <h1 className="page-title">{m.contributeTitle}</h1>
      <p className="lede">{m.contributeSub}</p>
      <p className="prose">{m.contributeIntro}</p>
      <div className="steps">
        {steps.map(([title, body], index) => (
          <article key={title}>
            <span>0{index + 1}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <ContributorForm lang={lang} enabled={isUploadConfigured()} />
    </div>
  );
}
