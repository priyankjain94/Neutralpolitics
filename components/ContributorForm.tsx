"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OAuthButtons } from "./OAuthButtons";
import { t } from "@/lib/i18n";
import { withLang } from "@/lib/paths";
import { INDIAN_STATES, MAX_VIDEO_BYTES, VIDEO_MIMES, normalizeIndianMobile } from "@/lib/validators";
import type { Lang } from "@/lib/types";

const ALLOWED = new Set<string>(VIDEO_MIMES);
const EXT_MIME: Record<string, (typeof VIDEO_MIMES)[number]> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  "3gp": "video/3gpp",
  webm: "video/webm",
};

type Step = 1 | 2 | 3 | 4;

function mimeOf(file: File): string {
  if (ALLOWED.has(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return EXT_MIME[ext] || file.type;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContributorForm({ lang, enabled }: { lang: Lang; enabled: boolean }) {
  const m = t(lang);
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("Delhi");
  const [notes, setNotes] = useState("");
  const [credit, setCredit] = useState("name");
  const [age18, setAge18] = useState(false);
  const [consent, setConsent] = useState(false);
  const [filled, setFilled] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "preview">("idle");
  const [reference, setReference] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const labels = [m.formStepVideo, m.formStepWhat, m.formStepYou, m.formStepConsent];

  function takeFile(next: File | null) {
    setError("");
    if (!next) {
      setFile(null);
      return;
    }
    const mime = mimeOf(next);
    if (!ALLOWED.has(mime)) {
      setError(m.valType);
      return;
    }
    if (next.size > MAX_VIDEO_BYTES) {
      setError(m.valSize);
      return;
    }
    setFile(next);
  }

  function validate(current: Step): string {
    if (current === 1) {
      if (!file && enabled) return m.valVideo;
      if (file && !ALLOWED.has(mimeOf(file))) return m.valType;
      if (file && file.size > MAX_VIDEO_BYTES) return m.valSize;
    }
    if (current === 2) {
      if (where.trim().length < 2) return m.valWhere;
      if (!when) return m.valWhen;
      if (description.trim().length < 30) return m.valDesc;
    }
    if (current === 3) {
      if (name.trim().length < 2) return m.valName;
      if (!normalizeIndianMobile(phone)) return m.valPhone;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return m.valEmail;
      if (city.trim().length < 2) return m.valCity;
    }
    if (current === 4) {
      if (!age18) return m.valAge;
      if (!consent) return m.valConsent;
    }
    return "";
  }

  function goNext() {
    const problem = validate(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep((value) => (value < 4 ? ((value + 1) as Step) : value));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 4) {
      goNext();
      return;
    }
    const problem = validate(4);
    if (problem) {
      setError(problem);
      return;
    }
    if (!enabled || !file) {
      setStatus("preview");
      return;
    }
    setStatus("uploading");
    setProgress(0);
    setError("");
    const payload = {
      name: name.trim(),
      phone,
      email: email.trim(),
      city: city.trim(),
      state: stateName,
      description: description.trim(),
      event_date: when,
      event_location: where.trim(),
      language: lang,
      extra_notes: notes.trim(),
      social_handle: "",
      credit_preference: credit,
      video_size_bytes: file.size,
      video_mime: mimeOf(file),
      video_duration_s: null,
      consent: true,
      age18: true,
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
      setStatus("idle");
      setError(started.error || m.error);
      return;
    }
    try {
      await upload(started.uploadUrl, file, started.headers || {}, mimeOf(file));
    } catch {
      setStatus("idle");
      setError(m.error);
      return;
    }
    const complete = await fetch("/api/contribute/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: started.id }),
    });
    const done = (await complete.json().catch(() => ({}))) as { error?: string; reference?: string };
    if (!complete.ok) {
      setStatus("idle");
      setError(done.error || m.error);
      return;
    }
    setReference(done.reference || started.reference || "");
    setStatus("done");
  }

  function upload(url: string, video: File, headers: Record<string, string>, mime: string) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
      if (!headers["content-type"] && !headers["Content-Type"]) xhr.setRequestHeader("content-type", mime);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("upload failed")));
      xhr.onerror = () => reject(new Error("upload failed"));
      xhr.send(video);
    });
  }

  if (status === "done" || status === "preview") {
    return (
      <div className="success-card" role="status">
        <p className="kicker">{m.contributeKicker}</p>
        <h2>{m.successTitle}</h2>
        {status === "preview" ? <p>{m.successPreview}</p> : null}
        {reference ? (
          <p>
            {m.reference}: <strong>{reference}</strong>
          </p>
        ) : null}
        <ol className="next-list">
          <li>{m.successNext1}</li>
          <li>{m.successNext2}</li>
          <li>{m.successNext3}</li>
        </ol>
        {status === "done" ? <p className="fine">{m.referenceHint}</p> : null}
      </div>
    );
  }

  return (
    <form className="form contribute-form" onSubmit={onSubmit}>
      {!enabled ? (
        <p className="closed">
          <strong>{m.uploadsSoon}.</strong> {m.uploadsSoonDetail}
        </p>
      ) : null}
      <ol className="progress" aria-label={m.stepOf.replace("{n}", String(step))}>
        {labels.map((label, index) => {
          const number = (index + 1) as Step;
          const state = number === step ? "step" : number < step ? "done" : undefined;
          return (
            <li key={label} aria-current={state === "step" ? "step" : undefined} className={state === "done" ? "is-done" : undefined}>
              <span>{number}</span> {label}
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <div>
          <div
            className={over ? "drop over" : "drop"}
            onDragOver={(event) => {
              event.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setOver(false);
              takeFile(event.dataTransfer.files?.[0] || null);
            }}
          >
            <strong>{m.dropTitle}</strong>
            <p className="fine">{m.dropHint}</p>
            <div className="drop-actions">
              <label className="ghost-btn">
                {m.uploadButton}
                <input
                  className="sr-only"
                  type="file"
                  accept="video/mp4,video/quicktime,video/3gpp,video/webm,.mp4,.mov,.3gp,.webm"
                  onChange={(event) => takeFile(event.target.files?.[0] || null)}
                />
              </label>
              <label className="ghost-btn">
                {m.recordButton}
                <input
                  className="sr-only"
                  type="file"
                  accept="video/*"
                  capture="environment"
                  onChange={(event) => takeFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>
          {file && previewUrl ? (
            <div className="file-preview">
              <video src={previewUrl} controls muted playsInline />
              <p>
                <strong>{file.name}</strong>
                <span className="fine">
                  {" "}
                  · {formatBytes(file.size)} · {mimeOf(file)}
                </span>
              </p>
              <button type="button" className="ghost-btn" onClick={() => takeFile(null)}>
                {m.removeFile}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="step-fields">
          <label>
            {m.where}
            <input value={where} onChange={(event) => setWhere(event.target.value)} required autoComplete="off" />
          </label>
          <label>
            {m.when}
            <input value={when} onChange={(event) => setWhen(event.target.value)} required type="datetime-local" />
          </label>
          <label>
            {m.whatHappened}
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} required minLength={30} placeholder={m.whatHint} />
          </label>
          <label>
            {m.notes} <span className="fine">({m.optional})</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="step-fields">
          <OAuthButtons
            lang={lang}
            nextPath={withLang(lang, "/contribute")}
            onProfile={(profile) => {
              if (profile.name && !name) setName(profile.name);
              if (profile.email && !email) setEmail(profile.email);
              if (profile.name || profile.email) setFilled(true);
            }}
          />
          {filled ? <p className="fine">{m.oauthFill}</p> : null}
          <label>
            {m.fullName}
            <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} autoComplete="name" />
          </label>
          <label>
            {m.phone}
            <input value={phone} onChange={(event) => setPhone(event.target.value)} required type="tel" inputMode="tel" placeholder="+91 98XXXXXXX" autoComplete="tel" />
          </label>
          <label>
            {m.email}
            <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" autoComplete="email" />
          </label>
          <label>
            {m.city}
            <input value={city} onChange={(event) => setCity(event.target.value)} required autoComplete="address-level2" />
          </label>
          <label>
            {m.state}
            <select value={stateName} onChange={(event) => setStateName(event.target.value)} required>
              {INDIAN_STATES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="step-fields">
          <label>
            {m.credit}
            <select value={credit} onChange={(event) => setCredit(event.target.value)}>
              <option value="name">{m.creditName}</option>
              <option value="anonymous">{m.creditAnon}</option>
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={age18} onChange={(event) => setAge18(event.target.checked)} />
            <span>{m.ageBox}</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>
              {m.consentBox} <Link href={withLang(lang, "/contribute/terms")}>{m.termsLink}</Link>
            </span>
          </label>
        </div>
      ) : null}

      {error ? <p className="error-text" role="alert">{error}</p> : null}
      {status === "uploading" ? <p className="fine">{m.progress} {progress}%</p> : null}
      <div className="form-nav">
        {step > 1 ? (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setError("");
              setStep((value) => (value > 1 ? ((value - 1) as Step) : value));
            }}
          >
            {m.back}
          </button>
        ) : (
          <span />
        )}
        {step < 4 ? (
          <button type="button" className="button" onClick={goNext}>
            {m.next}
          </button>
        ) : (
          <button className="button" type="submit" disabled={status === "uploading"}>
            {status === "uploading" ? `${m.progress} ${progress}%` : m.submit}
          </button>
        )}
      </div>
    </form>
  );
}
