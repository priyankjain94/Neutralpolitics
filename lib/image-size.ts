import fs from "fs";
import path from "path";

const cache = new Map<string, { width: number; height: number }>();

function fromBuffer(buf: Buffer): { width: number; height: number } | null {
  if (buf.length > 24 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (chunk === "VP8 " && buf.length >= 30) {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === "VP8L" && buf.length >= 25) {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  if (buf.length > 16 && buf.toString("ascii", 0, 5).includes("<svg")) {
    const text = buf.toString("utf8");
    const width = /width="([\d.]+)"/.exec(text);
    const height = /height="([\d.]+)"/.exec(text);
    if (width && height) return { width: Math.round(Number(width[1])), height: Math.round(Number(height[1])) };
  }
  return null;
}

/** Pixel size of a file in /public, or a 4:5 fallback when the file cannot be read. */
export function posterDimensions(src: string): { width: number; height: number } {
  const cached = cache.get(src);
  if (cached) return cached;
  const fallback = { width: 1200, height: 1500 };
  if (!src.startsWith("/") || src.startsWith("//")) {
    cache.set(src, fallback);
    return fallback;
  }
  const file = path.join(process.cwd(), "public", src.replace(/^\/+/, ""));
  try {
    const found = fromBuffer(fs.readFileSync(file)) || fallback;
    cache.set(src, found);
    return found;
  } catch {
    cache.set(src, fallback);
    return fallback;
  }
}
