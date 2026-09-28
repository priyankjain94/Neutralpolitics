"use client";

import { useState } from "react";
import Link from "next/link";
import { OAuthButtons } from "./OAuthButtons";
import { CATEGORIES } from "@/lib/categories";
import { t } from "@/lib/i18n";
import { withLang } from "@/lib/paths";
import type { Lang } from "@/lib/types";

export function NewsletterForm({
  lang,
  source,
  enabled,
  compact = false,
  band = false,
}: {
  lang: Lang;
  source: string;
  enabled: boolean;
  compact?: boolean;
  band?: boolean;
}) {
  const m = t(lang);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const topics = form.getAll("topics").map(String);
    setStatus("sending");
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        whatsapp: form.get("whatsapp"),
        language: form.get("language"),
        topics,
        consent: form.get("consent") === "on",
        source_page: source,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error || m.error);
      return;
    }
    setStatus("done");
    setMessage(m.newsletterSuccess);
  }

  return (
    <form className={`form newsletter${compact ? " compact" : ""}${band ? " band" : ""}`} onSubmit={onSubmit}>
      <h2 style={{ fontSize: compact ? "1.15rem" : undefined }}>{m.newsletterTitle}</h2>
      <p className="dek">{m.newsletterBody}</p>
      <OAuthButtons
        lang={lang}
        nextPath={withLang(lang, source === "/" ? "/subscribe" : source)}
        onProfile={(profile) => {
          if (profile.email) setEmail(profile.email);
        }}
      />
      {!enabled ? <p className="closed">{m.newsletterDisabled}</p> : null}
      <fieldset disabled={!enabled || status === "sending"}>
        <label>
          {m.email} <span className="fine">({m.optional})</span>
          <input name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          {m.whatsappNumber} <span className="fine">({m.optional})</span>
          <input name="whatsapp" type="tel" inputMode="tel" placeholder="+91" />
        </label>
        {compact ? <input type="hidden" name="language" value={lang === "hi" ? "hi" : "en"} /> : (
          <label>
            {m.language}
            <select name="language" defaultValue={lang === "hi" ? "hi" : "en"}>
              <option value="en">{m.langEn}</option>
              <option value="hi">{m.langHi}</option>
              <option value="both">{m.langBoth}</option>
            </select>
          </label>
        )}
        <div>
          <div>{m.topics}</div>
          <div className="topics">
            <label>
              <input type="checkbox" name="topics" value="all" defaultChecked /> {m.topicAll}
            </label>
            <label>
              <input type="checkbox" name="topics" value="breaking" /> {m.topicBreaking}
            </label>
            {compact
              ? null
              : CATEGORIES.slice(0, 5).map((category) => (
                  <label key={category.slug}>
                    <input type="checkbox" name="topics" value={category.slug} />
                    {lang === "hi" ? category.hi : category.en}
                  </label>
                ))}
          </div>
          {compact ? (
            <p className="fine">
              <Link href={withLang(lang, "/subscribe")}>{m.moreOptions}</Link>
            </p>
          ) : null}
        </div>
        <label className="check">
          <input type="checkbox" name="consent" required />
          <span>{m.newsletterConsent}</span>
        </label>
        <button className="button" type="submit">
          {status === "sending" ? m.sending : m.signUp}
        </button>
      </fieldset>
      {message ? <p className={status === "error" ? "error-text" : "success"}>{message}</p> : null}
    </form>
  );
}
