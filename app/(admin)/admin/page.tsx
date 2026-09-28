import { login } from "./actions";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (await isAdmin()) redirect("/admin/submissions");
  const query = await searchParams;
  const configured = adminConfigured();
  return (
    <main className="wrap login">
      <p className="kicker">Neutral Politics</p>
      <h1 className="page-title">Desk</h1>
      {!configured ? (
        <p className="closed">Admin is not configured. Set ADMIN_PASSWORD in the environment. No default password is shipped.</p>
      ) : (
        <form className="form" action={login}>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="button" type="submit">
            Enter
          </button>
          {query.e ? <p className="error-text">That password is not right.</p> : null}
        </form>
      )}
    </main>
  );
}
