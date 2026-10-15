import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Page not found | Neutral Politics" },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="wrap prose-page">
      <h1 className="page-title">Page not found</h1>
      <p>That page is not on the site. Drafts are not published.</p>
      <p>
        <Link href="/">Back to the front page</Link>
      </p>
    </div>
  );
}
