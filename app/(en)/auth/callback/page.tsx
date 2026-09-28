"use client";

import { useEffect, useState } from "react";
import { browserSupabase } from "@/lib/supabase-browser";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) return "/";
  return value;
}

export default function AuthCallbackPage() {
  const [problem, setProblem] = useState("");

  useEffect(() => {
    const next = safeNext(sessionStorage.getItem("np_oauth_next"));
    sessionStorage.removeItem("np_oauth_next");
    const supabase = browserSupabase();
    if (!supabase) {
      window.location.replace(next);
      return;
    }
    const code = new URLSearchParams(window.location.search).get("code");
    const finish = async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setProblem(error.message);
          return;
        }
      }
      window.location.replace(next);
    };
    finish().catch((error: unknown) => {
      setProblem(error instanceof Error ? error.message : "Sign-in did not finish.");
    });
  }, []);

  return (
    <div className="wrap prose-page">
      <h1 className="page-title">Signing you in</h1>
      <p>{problem || "Taking you back to the page you came from."}</p>
    </div>
  );
}
