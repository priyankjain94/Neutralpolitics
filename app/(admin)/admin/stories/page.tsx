import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { CATEGORIES } from "@/lib/categories";
import { loadArticles } from "@/lib/content";
import { listOverrides } from "@/lib/desk";
import { formatDateTime } from "@/lib/format";
import type { Article } from "@/lib/types";

type DeskRow = Article & { sensitive: boolean };

export const dynamic = "force-dynamic";

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; lang?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const query = await searchParams;
  const overrides = await listOverrides();
  let rows: DeskRow[] = loadArticles()
    .filter((article) => article.lang === (query.lang === "hi" ? "hi" : "en"))
    .map((article) => {
    const over = overrides.find((item) => item.slug === article.slug && item.lang === article.lang);
    return {
      ...article,
      status: over?.status === "published" || over?.status === "draft" ? over.status : article.status,
      title: over?.title || article.title,
      category: over?.category || article.category,
      sensitive: Boolean(over?.sensitive),
    };
  });
  if (query.status === "published" || query.status === "draft") rows = rows.filter((article) => article.status === query.status);
  if (query.category) rows = rows.filter((article) => article.category === query.category);
  const q = (query.q || "").trim().toLowerCase();
  if (q) rows = rows.filter((article) => `${article.title} ${article.slug}`.toLowerCase().includes(q));

  return (
    <AdminShell current="stories">
      <h1 className="page-title">Stories</h1>
      <p className="dek">Files in the repository are the base. Saves go to the story_overrides table when the database is configured. They are not committed to git.</p>
      <form className="filters" method="get">
        <input name="q" defaultValue={query.q || ""} placeholder="Search title or slug" aria-label="Search" />
        <select name="status" defaultValue={query.status || ""} aria-label="Status">
          <option value="">Published and drafts</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select name="category" defaultValue={query.category || ""} aria-label="Category">
          <option value="">All sections</option>
          {CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.en}
            </option>
          ))}
        </select>
        <select name="lang" defaultValue={query.lang || "en"} aria-label="Language">
          <option value="en">English</option>
          <option value="hi">Hindi</option>
        </select>
        <button className="button" type="submit">
          Filter
        </button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Status</th>
              <th>Section</th>
              <th>Title</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((article) => (
              <tr key={article.slug}>
                <td>{formatDateTime(article.publishedAt, "en")}</td>
                <td>
                  {article.status}
                  {article.sensitive ? " · sensitive" : ""}
                </td>
                <td>{article.category}</td>
                <td>{article.title}</td>
                <td>
                  <Link href={`/admin/stories/${article.slug}`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
