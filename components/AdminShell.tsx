import Link from "next/link";
import { logout } from "@/app/(admin)/admin/actions";

export function AdminShell({
  current,
  children,
}: {
  current: "submissions" | "signups" | "reports";
  children: React.ReactNode;
}) {
  const item = (href: string, id: typeof current, label: string) => (
    <Link href={href} aria-current={current === id ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <div className="wrap">
      <div className="admin-bar">
        <strong>Neutral Politics desk</strong>
        <nav>
          {item("/admin/submissions", "submissions", "Submissions")}
          {item("/admin/signups", "signups", "Signups")}
          {item("/admin/reports", "reports", "Reports")}
        </nav>
        <form action={logout}>
          <button className="ghost" type="submit">
            Log out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
