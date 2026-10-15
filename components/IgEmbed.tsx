"use client";

import { useState } from "react";
import Image from "next/image";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function IgEmbed({
  lang,
  shortcode,
  type,
  poster,
  sample,
  alt,
  width,
  height,
}: {
  lang: Lang;
  shortcode: string;
  type: "reel" | "carousel" | "image";
  poster: string;
  sample: boolean;
  alt: string;
  width: number;
  height: number;
}) {
  const [open, setOpen] = useState(false);
  const m = t(lang);
  const kind = type === "reel" ? "reel" : "p";
  return (
    <div className="embed">
      {open ? (
        <iframe
          className="embed-frame"
          src={`https://www.instagram.com/${kind}/${shortcode}/embed`}
          title="Instagram"
          loading="lazy"
          allow="encrypted-media"
        />
      ) : (
        <button type="button" className="embed-button" onClick={() => setOpen(true)}>
          <Image src={poster} alt={alt} width={width} height={height} priority style={{ width: "100%", height: "auto", objectFit: "contain", background: "#fff" }} sizes="(min-width: 960px) 640px, 100vw" />
          <span className="embed-cta">▶ {m.watch}</span>
        </button>
      )}
      {sample ? <p className="embed-note">{m.sampleEmbed}</p> : null}
    </div>
  );
}
