import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { saveStory } from "../../actions";
import { AdminShell } from "@/components/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { CATEGORIES } from "@/lib/categories";
import { loadArticles } from "@/lib/content";
import { listOverrides, mergeArticle } from "@/lib/desk";
import { isDatabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

function sourceLines(article: { sources: { outlet: string; url: string }[] }) {
  return article.sources.map((source) => `${source.outlet} | ${source.url}`).join("\n");
}

export default async function StoryEdit({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const { slug } = await params;
  const query = await searchParams;
  const overrides = await listOverrides();
  const pair = loadArticles().filter((article) => article.slug === slug);
  if (!pair.length) notFound();
  const view = (lang: "en" | "hi") => {
    const base = pair.find((article) => article.lang === lang);
    if (!base) return null;
    return mergeArticle(base, overrides.find((item) => item.slug === slug && item.lang === lang));
  };
  const en = view("en");
  const hi = view("hi");
  const sensitive = overrides.some((item) => item.slug === slug && item.sensitive);

  return (
    <AdminShell current="stories">
      <p>
        <Link href="/admin/stories">Stories</Link>
      </p>
      <h1 className="page-title">{en?.title || hi?.title}</h1>
      {!isDatabaseConfigured() ? <p className="closed">The database is not configured, so this form cannot save. The text below is what the files currently say.</p> : null}
      {query.e ? <p className="error-text">That save was rejected. Check the section and status.</p> : null}
      <div className="detail-grid">
        {[en, hi].filter(Boolean).map((article) =>
          article ? (
            <form key={article.lang} action={saveStory} className="form">
              <h2>{article.lang === "hi" ? "Hindi" : "English"}</h2>
              <input type="hidden" name="slug" value={article.slug} />
              <input type="hidden" name="year" value={article.year} />
              <input type="hidden" name="month" value={article.month} />
              <input type="hidden" name="lang" value={article.lang} />
              <p className="fine">
                File status: {pair.find((item) => item.lang === article.lang)?.status}. Public status after overrides: {article.status}.
                {sensitive ? " Marked sensitive." : ""}
              </p>
              <label>
                Title
                <input name="title" defaultValue={article.title} />
              </label>
              <label>
                Summary
                <textarea name="standfirst" defaultValue={article.standfirst} rows={3} />
              </label>
              <label>
                Body
                <textarea name="body" defaultValue={article.body} rows={14} />
              </label>
              <label>
                Section
                <select name="category" defaultValue={article.category}>
                  {CATEGORIES.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.en}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Public status
                <select name="status" defaultValue={article.status}>
                  <option value="published">published</option>
                  <option value="draft">draft</option>
                </select>
              </label>
              <label className="check">
                <input type="checkbox" name="sensitive" defaultChecked={sensitive} />
                <span>Sensitive. Stays an internal flag. Publishing still depends on the status above.</span>
              </label>
              <label>
                Sources, one per line: Outlet | https://…
                <textarea name="sources" defaultValue={sourceLines(article)} rows={6} />
              </label>
              <button className="button" type="submit" disabled={!isDatabaseConfigured()}>
                Save {article.lang === "hi" ? "Hindi" : "English"}
              </button>
            </form>
          ) : null,
        )}
      </div>
    </AdminShell>
  );
}
