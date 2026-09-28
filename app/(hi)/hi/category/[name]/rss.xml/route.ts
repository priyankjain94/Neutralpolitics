import { CATEGORIES } from "@/lib/categories";
import { categoryRss } from "@/lib/feeds";
export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ name: category.slug }));
}
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!CATEGORIES.some((category) => category.slug === name)) return new Response("Not found", { status: 404 });
  return new Response(categoryRss("hi", name), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
