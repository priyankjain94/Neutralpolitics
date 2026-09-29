import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

function cell(value: unknown): string {
  const text = value == null ? "" : String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  const db = getDb();
  if (!db) return new NextResponse("Database is not configured", { status: 503 });
  const { data } = await db.from("error_reports").select("*").order("created_at", { ascending: false });
  const header = [
    "created_at",
    "status",
    "language",
    "story_ref",
    "what_wrong",
    "suggested_correction",
    "source_url",
    "name",
    "email",
    "consent_contact",
    "consent_at",
    "notes",
  ];
  const lines = [header.join(",")];
  for (const row of data || []) {
    lines.push(header.map((key) => cell(row[key])).join(","));
  }
  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=error-reports.csv",
    },
  });
}
