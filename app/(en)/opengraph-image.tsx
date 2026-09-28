import { ogSize, renderOg } from "@/lib/og";
export const alt = "Neutral Politics";
export const size = ogSize;
export const contentType = "image/png";
export default async function Image() {
  return renderOg({ lang: "en", kicker: "Verified by 2+ sources", title: "Neutral Politics" });
}
