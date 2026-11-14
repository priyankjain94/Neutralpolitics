import { articleWithDesk } from "@/lib/desk";
import { categoryLabel } from "@/lib/categories";
import { ogSize, renderOg } from "@/lib/og";
import { articleStaticParams } from "@/lib/render";
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return articleStaticParams("en");
}
export const alt = "Neutral Politics";
export const size = ogSize;
export const contentType = "image/png";
export default async function Image({ params }: { params: Promise<{ year: string; month: string; slug: string }> }) {
  const { year, month, slug } = await params;
  const article = await articleWithDesk("en", year, month, slug);
  return renderOg({
    lang: "en",
    kicker: article ? categoryLabel(article.category, "en") : "Neutral Politics",
    title: article?.title || "Neutral Politics",
  });
}
