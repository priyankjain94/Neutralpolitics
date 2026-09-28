"use client";

import { useState } from "react";
import { NewsletterForm } from "./NewsletterForm";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function SubscribePage({ lang, enabled }: { lang: Lang; enabled: boolean }) {
  const m = t(lang);
  const [message, setMessage] = useState("");

  async function unsubscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), whatsapp: form.get("whatsapp") }),
    });
    setMessage(response.ok ? m.unsubscribed : m.error);
  }

  return (
    <div className="wrap">
      <h1 className="page-title">{m.newsletterTitle}</h1>
      <NewsletterForm lang={lang} source="/subscribe" enabled={enabled} />
      <form className="form" onSubmit={unsubscribe}>
        <h2>{m.unsubscribe}</h2>
        <fieldset disabled={!enabled}>
          <label>
            {m.email}
            <input name="email" type="email" />
          </label>
          <label>
            {m.whatsappNumber}
            <input name="whatsapp" type="tel" />
          </label>
          <button className="button" type="submit">
            {m.unsubscribe}
          </button>
        </fieldset>
        {message ? <p className="success">{message}</p> : null}
      </form>
    </div>
  );
}
