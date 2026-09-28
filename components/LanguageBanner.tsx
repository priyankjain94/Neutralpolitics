"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { switchLang } from "@/lib/paths";

export function LanguageBanner() {
  const pathname = usePathname() || "/";
  const params = useSearchParams();
  const [show, setShow] = useState(false);
  const notice = params.get("notice");

  useEffect(() => {
    if (pathname === "/hi" || pathname.startsWith("/hi/")) return;
    if (localStorage.getItem("np-hi-banner") === "off") return;
    const languages = navigator.languages || [navigator.language];
    if (languages.some((language) => language.toLowerCase().startsWith("hi"))) setShow(true);
  }, [pathname]);

  return (
    <>
      {notice === "hi-soon" ? <p className="notice wrap">उस खबर का हिंदी रूप अभी प्रकाशित नहीं है। The Hindi version is not published yet.</p> : null}
      {notice === "en-soon" ? <p className="notice wrap">That story’s English version is not published yet.</p> : null}
      {show ? (
        <p className="notice wrap">
          यह साइट हिंदी में भी है।{" "}
          <Link href={switchLang(pathname, "hi")}>हिंदी में पढ़ें</Link>
          <button
            type="button"
            className="ghost"
            style={{ marginLeft: "0.6rem" }}
            onClick={() => {
              localStorage.setItem("np-hi-banner", "off");
              setShow(false);
            }}
          >
            बंद करें
          </button>
        </p>
      ) : null}
    </>
  );
}
