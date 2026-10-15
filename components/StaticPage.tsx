import { notFound } from "next/navigation";
import { JsonLd } from "./JsonLd";
import { Markdown } from "./Markdown";
import { loadPage } from "@/lib/content";
import { organizationNode } from "@/lib/seo";
import type { Lang } from "@/lib/types";

const TRUST = new Set(["about", "editorial-policy", "ownership", "privacy", "terms"]);

export function StaticPage({ lang, name }: { lang: Lang; name: string }) {
  const page = loadPage(name, lang);
  if (!page) notFound();
  return (
    <div className="wrap prose-page">
      {TRUST.has(name) ? <JsonLd data={organizationNode()} /> : null}
      <h1 className="page-title">{page.title}</h1>
      {page.description ? <p className="lede">{page.description}</p> : null}
      <Markdown>{page.body}</Markdown>
    </div>
  );
}
