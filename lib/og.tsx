import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

async function font(file: string): Promise<ArrayBuffer> {
  const data = await readFile(file);
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

const latinFile = path.join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf");
const devanagariFile = path.join(
  process.cwd(),
  "node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-600-normal.woff",
);

export async function renderOg(input: { kicker: string; title: string; lang: "en" | "hi" }) {
  const latin = await font(latinFile);
  const fonts: { name: string; data: ArrayBuffer; weight: 600; style: "normal" }[] = [
    { name: "Sans", data: latin, weight: 600, style: "normal" },
  ];
  if (input.lang === "hi") {
    fonts.unshift({ name: "Sans", data: await font(devanagariFile), weight: 600, style: "normal" });
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ffffff",
          color: "#121212",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: "Sans",
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, letterSpacing: input.lang === "hi" ? 0 : -0.5, color: "#B3121B" }}>{input.kicker}</div>
          <div style={{ width: 120, height: 4, background: "#B3121B", marginTop: 16 }} />
        </div>
        <div style={{ fontSize: input.title.length > 80 ? 48 : 60, lineHeight: 1.2, letterSpacing: input.lang === "hi" ? 0 : -1, display: "flex" }}>{input.title}</div>
        <div style={{ fontSize: 28, color: "#555555" }}>Neutral Politics</div>
      </div>
    ),
    {
      ...ogSize,
      fonts,
    },
  );
}
