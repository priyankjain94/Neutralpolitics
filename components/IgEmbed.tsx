"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function IgEmbed({
  lang,
  shortcode,
  type,
  poster,
  sample,
}: {
  lang: Lang;
  shortcode: string;
  type: "reel" | "carousel" | "image";
  poster: string;
  sample: boolean;
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
          <img src={poster} alt="" width={800} height={1000} />
          <span className="embed-cta">▶ {m.watch}</span>
        </button>
      )}
      {sample ? <p className="embed-note">{m.sampleEmbed}</p> : null}
    </div>
  );
}
