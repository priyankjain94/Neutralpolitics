"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function ErrorReportForm({
  lang,
  enabled,
  story = "",
}: {
  lang: Lang;
  enabled: boolean;
  story?: string;
}) {
  const m = t(lang);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled) return;
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setMessage("");
    const response = await fetch("/api/error-reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        story_ref: form.get("story_ref"),
        what_wrong: form.get("what_wrong"),
        suggested_correction: form.get("suggested_correction"),
        source_url: form.get("source_url"),
        name: form.get("name"),
        email: form.get("email"),
        language: lang,
        consent_contact: form.get("consent_contact") === "on",
        website: form.get("website"),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; ok?: boolean };
    if (!response.ok) {
      setStatus("error");
      setMessage(
        data.error === "unavailable"
          ? m.reportUnavailable
          : data.error === "rate"
            ? m.reportRate
            : data.error === "email"
              ? m.valEmail
              : data.error === "source"
                ? m.reportSource
                : m.error,
      );
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="success-card" role="status">
        <p className="kicker">{m.reportError}</p>
        <h2>{m.reportSuccessTitle}</h2>
        <p>{m.reportSuccess}</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2>{m.reportError}</h2>
      <p className="dek">{m.reportLead}</p>
      {!enabled ? (
        <p className="closed">
          {m.reportUnavailable}{" "}
          <a href="mailto:corrections@theneutralpolitics.in">corrections@theneutralpolitics.in</a>
        </p>
      ) : null}
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <fieldset disabled={!enabled || status === "sending"}>
        <label>
          {m.storyField}
          <input name="story_ref" required minLength={2} defaultValue={story} />
        </label>
        <label>
          {m.whatWrong}
          <textarea name="what_wrong" required minLength={10} />
        </label>
        <label>
          {m.suggestedFix}
          <textarea name="suggested_correction" required minLength={10} />
        </label>
        <label>
          {m.sourceLink} <span className="fine">({m.optional})</span>
          <input name="source_url" type="url" placeholder="https://" />
        </label>
        <label>
          {m.yourName} <span className="fine">({m.optional})</span>
          <input name="name" autoComplete="name" />
        </label>
        <label>
          {m.email} <span className="fine">({m.optional})</span>
          <input name="email" type="email" autoComplete="email" />
        </label>
        <label className="check">
          <input name="consent_contact" type="checkbox" required />
          <span>{m.contactConsent}</span>
        </label>
        <button className="button" type="submit">
          {status === "sending" ? m.sending : m.submit}
        </button>
      </fieldset>
      {message ? <p className="error-text" role="alert">{message}</p> : null}
    </form>
  );
}
