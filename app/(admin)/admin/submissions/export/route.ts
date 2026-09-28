import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { deskStatusOf } from "@/lib/desk-status";

function cell(value: unknown): string {
  const text = value == null ? "" : String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  const db = getDb();
  if (!db) return new NextResponse("Database is not configured", { status: 503 });
  const { data } = await db.from("submissions").select("*").order("created_at", { ascending: false });
  const header = [
    "reference",
    "created_at",
    "name",
    "email",
    "phone",
    "city",
    "state",
    "category",
    "event_location",
    "event_date",
    "desk_status",
    "payment_track",
    "payment_amount_inr",
    "payment_method",
    "payment_reference",
    "payment_at",
    "posted_article_slug",
    "consent_at",
  ];
  const lines = [header.join(",")];
  for (const row of data || []) {
    const flat = { ...row, desk_status: deskStatusOf(row) };
    lines.push(header.map((key) => cell(flat[key])).join(","));
  }
  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=submissions.csv",
    },
  });
}
