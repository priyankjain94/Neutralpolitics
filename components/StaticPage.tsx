import { notFound } from "next/navigation";
import { Markdown } from "./Markdown";
import { loadPage } from "@/lib/content";
import type { Lang } from "@/lib/types";

export function StaticPage({ lang, name }: { lang: Lang; name: string }) {
  const page = loadPage(name, lang);
  if (!page) notFound();
  return (
    <div className="wrap prose-page">
      <h1 className="page-title">{page.title}</h1>
      {page.description ? <p className="lede">{page.description}</p> : null}
      <Markdown>{page.body}</Markdown>
    </div>
  );
}
