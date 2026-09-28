"use server";

import { redirect } from "next/navigation";
import { adminConfigured, clearAdminCookie, isAdmin, passwordMatches, setAdminCookie } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

const NEXT: Record<string, string[]> = {
  new: ["verifying"],
  verifying: ["approved", "rejected"],
  approved: ["posted", "rejected"],
  rejected: ["verifying"],
  posted: [],
};

async function guard() {
  if (!(await isAdmin())) redirect("/admin");
  const db = getDb();
  if (!db) redirect("/admin/submissions?db=0");
  return db;
}

export async function login(formData: FormData) {
  if (!adminConfigured()) redirect("/admin");
  const password = String(formData.get("password") || "");
  if (!passwordMatches(password)) redirect("/admin?e=1");
  await setAdminCookie();
  redirect("/admin/submissions");
}

export async function logout() {
  await clearAdminCookie();
  redirect("/admin");
}

export async function updateStatus(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const rejection = String(formData.get("rejection_reason") || "").trim();
  const postedUrl = String(formData.get("posted_ig_url") || "").trim();
  const postedSlug = String(formData.get("posted_article_slug") || "").trim();
  const { data } = await db.from("submissions").select("status").eq("id", id).maybeSingle();
  if (!data) redirect("/admin/submissions");
  if (!NEXT[data.status]?.includes(status)) redirect(`/admin/submissions/${id}?e=status`);
  if (status === "rejected" && rejection.length < 3) redirect(`/admin/submissions/${id}?e=reason`);
  if (status === "posted" && !postedUrl && !postedSlug) redirect(`/admin/submissions/${id}?e=posted`);
  const now = new Date().toISOString();
  await db
    .from("submissions")
    .update({
      status,
      status_changed_at: now,
      reviewer: "admin",
      rejection_reason: status === "rejected" ? rejection : data.status === "rejected" ? null : undefined,
      posted_ig_url: postedUrl || null,
      posted_article_slug: postedSlug || null,
    })
    .eq("id", id);
  await db.from("submission_events").insert({
    submission_id: id,
    actor: "admin",
    from_status: data.status,
    to_status: status,
    note: rejection || postedUrl || postedSlug || null,
  });
  redirect(`/admin/submissions/${id}`);
}

export async function addNote(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id") || "");
  const note = String(formData.get("note") || "").trim();
  if (!note) redirect(`/admin/submissions/${id}`);
  const { data } = await db.from("submissions").select("status, notes").eq("id", id).maybeSingle();
  if (!data) redirect("/admin/submissions");
  const stamped = `${new Date().toISOString()} — ${note}`;
  const notes = data.notes ? `${data.notes}\n${stamped}` : stamped;
  await db.from("submissions").update({ notes }).eq("id", id);
  await db.from("submission_events").insert({
    submission_id: id,
    actor: "admin",
    from_status: data.status,
    to_status: data.status,
    note,
  });
  redirect(`/admin/submissions/${id}`);
}

export async function saveChecklist(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id") || "");
  const keys = ["contacted", "metadata", "corroborated", "sources", "blurred", "legal"];
  const checklist = Object.fromEntries(keys.map((key) => [key, formData.get(key) === "on"]));
  await db.from("submissions").update({ checklist }).eq("id", id);
  redirect(`/admin/submissions/${id}`);
}

export async function updateReport(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "new");
  const notes = String(formData.get("notes") || "");
  if (!["new", "reviewing", "done", "dismissed"].includes(status)) redirect("/admin/reports");
  await db.from("reports").update({ status, notes }).eq("id", id);
  redirect("/admin/reports");
}
