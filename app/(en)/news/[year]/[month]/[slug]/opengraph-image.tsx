import { getArticle } from "@/lib/content";
import { categoryLabel } from "@/lib/categories";
import { ogSize, renderOg } from "@/lib/og";
export const alt = "Neutral Politics";
export const size = ogSize;
export const contentType = "image/png";
export default async function Image({ params }: { params: Promise<{ year: string; month: string; slug: string }> }) {
  const { year, month, slug } = await params;
  const article = getArticle("en", year, month, slug);
  return renderOg({
    lang: "en",
    kicker: article ? categoryLabel(article.category, "en") : "Neutral Politics",
    title: article?.title || "Neutral Politics",
  });
}
