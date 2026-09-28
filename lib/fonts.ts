import localFont from "next/font/local";

/** Devanagari-only files. Latin on Hindi pages stays on the system stack. */
export const devanagari = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-devanagari",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["Mukta", "sans-serif"],
});
