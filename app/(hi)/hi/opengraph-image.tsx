import { ogSize, renderOg } from "@/lib/og";
export const alt = "Neutral Politics";
export const size = ogSize;
export const contentType = "image/png";
export default async function Image() {
  return renderOg({ lang: "hi", kicker: "दो या अधिक स्रोत", title: "न्यूट्रल पॉलिटिक्स" });
}
