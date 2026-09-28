import Link from "next/link";
import { logout } from "@/app/(admin)/admin/actions";

const LINKS = [
  ["/admin", "dashboard", "Dashboard"],
  ["/admin/stories", "stories", "Stories"],
  ["/admin/submissions", "submissions", "Submissions"],
  ["/admin/signups", "signups", "Signups"],
  ["/admin/corrections", "corrections", "Corrections"],
  ["/admin/reports", "reports", "Reports"],
] as const;

export function AdminShell({
  current,
  children,
}: {
  current: (typeof LINKS)[number][1];
  children: React.ReactNode;
}) {
  return (
    <div className="wrap">
      <div className="admin-bar">
        <strong>Neutral Politics desk</strong>
        <nav>
          {LINKS.map(([href, id, label]) => (
            <Link key={id} href={href} aria-current={current === id ? "page" : undefined}>
              {label}
            </Link>
          ))}
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
