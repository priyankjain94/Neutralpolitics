import Link from "next/link";

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
