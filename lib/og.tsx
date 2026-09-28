import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

async function font(file: string): Promise<ArrayBuffer> {
  const data = await readFile(file);
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

export async function renderOg(input: { kicker: string; title: string; lang: "en" | "hi" }) {
  const file =
    input.lang === "hi"
      ? path.join(process.cwd(), "node_modules/@fontsource/noto-serif-devanagari/files/noto-serif-devanagari-devanagari-600-normal.woff")
      : path.join(process.cwd(), "node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff");
  const data = await font(file);
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
          fontFamily: "Serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, letterSpacing: input.lang === "hi" ? 0 : 2, color: "#B3121B" }}>{input.kicker}</div>
          <div style={{ width: 120, height: 4, background: "#B3121B", marginTop: 16 }} />
        </div>
        <div style={{ fontSize: input.title.length > 80 ? 48 : 60, lineHeight: 1.2, display: "flex" }}>{input.title}</div>
        <div style={{ fontSize: 28, color: "#555555" }}>Neutral Politics</div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [{ name: "Serif", data, weight: 600, style: "normal" }],
    },
  );
}
