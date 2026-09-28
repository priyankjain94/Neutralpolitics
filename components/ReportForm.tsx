"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function ReportForm({
  lang,
  type,
  enabled,
  articleUrl = "",
}: {
  lang: Lang;
  type: "correction" | "factcheck" | "contact";
  enabled: boolean;
  articleUrl?: string;
}) {
  const m = t(lang);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const heading = type === "factcheck" ? m.sendClaim : type === "contact" ? m.contact : m.reportError;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type,
        article_url: form.get("article_url"),
        message: form.get("message"),
        email: form.get("email"),
        name: form.get("name"),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error || m.error);
      return;
    }
    setStatus("done");
    setMessage(m.saved);
    event.currentTarget.reset();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2>{heading}</h2>
      {!enabled ? <p className="closed">{m.newsletterDisabled}</p> : null}
      <fieldset disabled={!enabled || status === "sending"}>
        <label>
          {m.yourName} <span className="fine">({m.optional})</span>
          <input name="name" />
        </label>
        <label>
          {m.email} <span className="fine">({m.optional})</span>
          <input name="email" type="email" />
        </label>
        {type !== "contact" ? (
          <label>
            {m.articleUrl}
            <input name="article_url" defaultValue={articleUrl} />
          </label>
        ) : (
          <input type="hidden" name="article_url" value="" />
        )}
        <label>
          {type === "factcheck" ? m.claimLabel : m.message}
          <textarea name="message" required minLength={10} />
        </label>
        <button className="button" type="submit">
          {status === "sending" ? m.sending : m.submit}
        </button>
      </fieldset>
      {message ? <p className={status === "error" ? "error-text" : "success"}>{message}</p> : null}
    </form>
  );
}
