import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "पृष्ठ नहीं मिला | Neutral Politics" },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="wrap prose-page">
      <h1 className="page-title">पृष्ठ नहीं मिला</h1>
      <p>यह पृष्ठ साइट पर नहीं है। ड्राफ्ट प्रकाशित नहीं होते।</p>
      <p>
        <Link href="/hi">मुखपृष्ठ पर वापस</Link>
      </p>
    </div>
  );
}