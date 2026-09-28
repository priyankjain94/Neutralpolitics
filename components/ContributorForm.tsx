"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { withLang } from "@/lib/paths";
import { INDIAN_STATES, MAX_VIDEO_BYTES, VIDEO_MIMES } from "@/lib/validators";
import type { Lang } from "@/lib/types";

const ALLOWED = new Set<string>(VIDEO_MIMES);

export function ContributorForm({ lang, enabled }: { lang: Lang; enabled: boolean }) {
  const m = t(lang);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("video");
    if (!(file instanceof File) || file.size === 0) {
      setStatus("error");
      setMessage(m.formInvalid);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setStatus("error");
      setMessage(m.tooBig);
      return;
    }
    if (!ALLOWED.has(file.type)) {
      setStatus("error");
      setMessage(m.badType);
      return;
    }
    setStatus("uploading");
    setProgress(0);
    const payload = {
      name: data.get("name"),
      phone: data.get("phone"),
      email: data.get("email"),
      city: data.get("city"),
      state: data.get("state"),
      description: data.get("description"),
      event_date: data.get("event_date"),
      event_location: data.get("event_location"),
      language: lang,
      extra_notes: data.get("extra_notes"),
      social_handle: data.get("social_handle"),
      credit_preference: data.get("credit_preference"),
      video_size_bytes: file.size,
      video_mime: file.type,
      video_duration_s: null,
      consent: data.get("consent") === "on",
      age18: data.get("age18") === "on",
    };
    const start = await fetch("/api/contribute/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const started = (await start.json().catch(() => ({}))) as {
      error?: string;
      uploadUrl?: string;
      headers?: Record<string, string>;
      id?: string;
      reference?: string;
    };
    if (!start.ok || !started.uploadUrl || !started.id) {
      setStatus("error");
      setMessage(started.error || m.error);
      return;
    }
    try {
      await upload(started.uploadUrl, file, started.headers || {});
    } catch {
      setStatus("error");
      setMessage(m.error);
      return;
    }
    const complete = await fetch("/api/contribute/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: started.id }),
    });
    const done = (await complete.json().catch(() => ({}))) as { error?: string; reference?: string };
    if (!complete.ok) {
      setStatus("error");
      setMessage(done.error || m.error);
      return;
    }
    setReference(done.reference || started.reference || "");
    setStatus("done");
    form.reset();
  }

  function upload(url: string, file: File, headers: Record<string, string>) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("upload failed")));
      xhr.onerror = () => reject(new Error("upload failed"));
      xhr.send(file);
    });
  }

  if (status === "done") {
    return (
      <div className="success">
        <p>{m.saved}</p>
        <p>
          {m.reference}: <strong>{reference}</strong>
        </p>
        <p>{m.referenceHint}</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {!enabled ? <p className="closed">{m.uploadClosed}</p> : null}
      <fieldset disabled={!enabled || status === "uploading"}>
        <label>
          {m.fullName}
          <input name="name" required minLength={2} autoComplete="name" />
        </label>
        <label>
          {m.phone}
          <input name="phone" required type="tel" inputMode="tel" placeholder="+91 98XXXXXXX" autoComplete="tel" />
        </label>
        <label>
          {m.email}
          <input name="email" required type="email" autoComplete="email" />
        </label>
        <label>
          {m.city}
          <input name="city" required />
        </label>
        <label>
          {m.state}
          <select name="state" required defaultValue="Delhi">
            {INDIAN_STATES.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
        </label>
        <label>
          {m.whatHappened}
          <textarea name="description" required minLength={30} placeholder={m.whatHint} />
        </label>
        <label>
          {m.when}
          <input name="event_date" required type="datetime-local" />
        </label>
        <label>
          {m.where}
          <input name="event_location" required />
        </label>
        <label>
          {m.video}
          <input name="video" required type="file" accept="video/mp4,video/quicktime,video/3gpp,video/webm" />
          <span className="fine">{m.videoHint}</span>
        </label>
        <label>
          {m.notes} <span className="fine">({m.optional})</span>
          <textarea name="extra_notes" />
        </label>
        <label>
          {m.handle} <span className="fine">({m.optional})</span>
          <input name="social_handle" />
        </label>
        <label>
          {m.credit}
          <select name="credit_preference" defaultValue="name">
            <option value="name">{m.creditName}</option>
            <option value="anonymous">{m.creditAnon}</option>
          </select>
        </label>
        <label className="check">
          <input name="age18" type="checkbox" required />
          <span>{m.ageBox}</span>
        </label>
        <label className="check">
          <input name="consent" type="checkbox" required />
          <span>
            {m.consentBox}{" "}
            <Link href={withLang(lang, "/contribute/terms")}>{m.termsLink}</Link>
          </span>
        </label>
        <button className="button" type="submit">
          {status === "uploading" ? `${m.progress} ${progress}%` : m.submit}
        </button>
      </fieldset>
      {message ? <p className="error-text">{message}</p> : null}
    </form>
  );
}
