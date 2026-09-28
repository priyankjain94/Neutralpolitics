"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { browserSupabase, isOAuthConfigured } from "@/lib/supabase-browser";
import type { Lang } from "@/lib/types";

type Provider = "google" | "facebook";

export function OAuthButtons({
  lang,
  nextPath,
  onProfile,
}: {
  lang: Lang;
  nextPath: string;
  onProfile?: (profile: { email?: string; name?: string }) => void;
}) {
  const m = t(lang);
  const ready = isOAuthConfigured();
  const [note, setNote] = useState("");
  const onProfileRef = useRef(onProfile);
  onProfileRef.current = onProfile;

  useEffect(() => {
    if (!ready || !onProfileRef.current) return;
    const supabase = browserSupabase();
    if (!supabase) return;
    let cancel = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancel || !data.user) return;
      const meta = data.user.user_metadata || {};
      const name = String(meta.full_name || meta.name || "").trim();
      onProfileRef.current?.({ email: data.user.email || undefined, name: name || undefined });
    });
    return () => {
      cancel = true;
    };
  }, [ready]);

  async function start(provider: Provider) {
    const supabase = browserSupabase();
    if (!supabase) return;
    sessionStorage.setItem("np_oauth_next", nextPath.startsWith("/") ? nextPath : "/");
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) setNote(error.message);
  }

  return (
    <div className="oauth-block">
      <div className="oauth-row">
        <button
          type="button"
          className="oauth oauth-google"
          disabled={!ready}
          onClick={() => start("google")}
        >
          <GoogleMark />
          <span>{m.continueGoogle}</span>
          {ready ? null : <span className="oauth-soon">{m.comingSoonLabel}</span>}
        </button>
        <button
          type="button"
          className="oauth oauth-facebook"
          disabled={!ready}
          onClick={() => start("facebook")}
        >
          <FacebookMark />
          <span>{m.continueFacebook}</span>
          {ready ? null : <span className="oauth-soon">{m.comingSoonLabel}</span>}
        </button>
      </div>
      <p className="or-line">{m.orDivider}</p>
      {note ? <p className="error-text">{note}</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="oauth-mark" viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l6.3 5.3C37.4 38.4 44 33 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg className="oauth-mark" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d="M14.5 8.5V6.8c0-.6.4-.8.7-.8h1.6V3.5h-2.2C11.6 3.5 10.7 5.2 10.7 6.9v1.6H9v2.6h1.7V20h2.8v-8.9h2.1l.4-2.6h-2.5z" />
    </svg>
  );
}
