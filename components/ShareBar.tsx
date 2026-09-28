"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function ShareBar({ lang, title, url }: { lang: Lang; title: string; url: string }) {
  const m = t(lang);
  const [copied, setCopied] = useState(false);
  const text = `${title} ${url}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* dismissed */
      }
    } else {
      await copy();
    }
  }
  return (
    <div className="share">
      <span>{m.share}</span>
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
        {m.whatsapp}
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
        X
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
      <button type="button" onClick={copy}>
        {copied ? m.copied : m.copy}
      </button>
      <button type="button" onClick={nativeShare}>
        {m.share}
      </button>
    </div>
  );
}
