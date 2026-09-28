"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminConfigured, clearAdminCookie, credentialsMatch, isAdmin, setAdminCookie } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { revalidateStory, writeAudit } from "@/lib/desk";
import { DESK_STATUSES, legacyStatus } from "@/lib/desk-status";
import { isCategory } from "@/lib/categories";
import { rateLimit } from "@/lib/rate-limit";
import type { Source } from "@/lib/types";

async function guard() {
  if (!(await isAdmin())) redirect("/admin");
  const db = getDb();
  if (!db) redirect("/admin?db=0");
  return db;
}

export async function login(formData: FormData) {
  if (!adminConfigured()) redirect("/admin");
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "local";
  if (!rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000)) redirect("/admin?e=rate");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  if (!credentialsMatch(email, password)) {
    await writeAudit("login_failed", email.trim().toLowerCase());
    redirect("/admin?e=1");
  }
  await setAdminCookie(email);
  await writeAudit("login", email.trim().toLowerCase());
  redirect("/admin");
}

export async function logout() {
  await writeAudit("logout", process.env.ADMIN_EMAIL || "admin");
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
  if (!DESK_STATUSES.includes(status as (typeof DESK_STATUSES)[number])) redirect(`/admin/submissions/${id}?e=status`);
  const { data } = await db.from("submissions").select("desk_status, status").eq("id", id).maybeSingle();
  if (!data) redirect("/admin/submissions");
  const now = new Date().toISOString();
  await db
    .from("submissions")
    .update({
      desk_status: status,
      status: legacyStatus(status),
      status_changed_at: now,
      reviewer: process.env.ADMIN_EMAIL || "admin",
      rejection_reason: rejection || null,
      posted_ig_url: postedUrl || null,
      posted_article_slug: postedSlug || null,
    })
    .eq("id", id);
  await db.from("submission_events").insert({
    submission_id: id,
    actor: process.env.ADMIN_EMAIL || "admin",
    from_status: data.desk_status || data.status,
    to_status: status,
    note: rejection || postedSlug || postedUrl || null,
  });
  await writeAudit("submission_status", id, status);
  redirect(`/admin/submissions/${id}`);
}

export async function savePayment(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id") || "");
  const track = String(formData.get("payment_track") || "unpaid");
  if (!["unpaid", "pending", "paid"].includes(track)) redirect(`/admin/submissions/${id}?e=pay`);
  const amountRaw = String(formData.get("payment_amount_inr") || "").trim();
  const amount = amountRaw ? Number(amountRaw) : null;
  if (amountRaw && (!Number.isFinite(amount) || (amount as number) < 0)) redirect(`/admin/submissions/${id}?e=pay`);
  const paidAt = String(formData.get("payment_at") || "").trim();
  await db
    .from("submissions")
    .update({
      payment_track: track,
      payment_amount_inr: amount,
      payment_method: String(formData.get("payment_method") || "").trim() || null,
      payment_reference: String(formData.get("payment_reference") || "").trim() || null,
      payment_at: paidAt ? new Date(paidAt).toISOString() : null,
    })
    .eq("id", id);
  await writeAudit("submission_payment", id, track);
  redirect(`/admin/submissions/${id}`);
}

export async function addNote(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id") || "");
  const note = String(formData.get("note") || "").trim();
  if (!note) redirect(`/admin/submissions/${id}`);
  const { data } = await db.from("submissions").select("status, desk_status, notes").eq("id", id).maybeSingle();
  if (!data) redirect("/admin/submissions");
  const stamped = `${new Date().toISOString()} — ${note}`;
  const notes = data.notes ? `${data.notes}\n${stamped}` : stamped;
  await db.from("submissions").update({ notes }).eq("id", id);
  await db.from("submission_events").insert({
    submission_id: id,
    actor: process.env.ADMIN_EMAIL || "admin",
    from_status: data.desk_status || data.status,
    to_status: data.desk_status || data.status,
    note,
  });
  await writeAudit("submission_note", id);
  redirect(`/admin/submissions/${id}`);
}

export async function saveChecklist(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id") || "");
  const keys = ["contacted", "metadata", "corroborated", "sources", "blurred", "legal"];
  const checklist = Object.fromEntries(keys.map((key) => [key, formData.get(key) === "on"]));
  await db.from("submissions").update({ checklist }).eq("id", id);
  await writeAudit("submission_checklist", id);
  redirect(`/admin/submissions/${id}`);
}

export async function updateReport(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "new");
  const notes = String(formData.get("notes") || "");
  if (!["new", "reviewing", "done", "dismissed"].includes(status)) redirect("/admin/reports");
  await db.from("reports").update({ status, notes }).eq("id", id);
  await writeAudit("report_status", id, status);
  redirect("/admin/reports");
}

export async function deleteSignup(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id") || "");
  await db.from("signups").delete().eq("id", id);
  await writeAudit("signup_delete", id);
  redirect("/admin/signups");
}

function parseSources(raw: string): Source[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [outlet, url] = line.split("|").map((part) => part.trim());
      return { outlet: outlet || "Source", url: url || outlet };
    })
    .filter((source) => source.url.startsWith("http"));
}

export async function saveStory(formData: FormData) {
  const db = await guard();
  const slug = String(formData.get("slug") || "");
  const year = String(formData.get("year") || "");
  const month = String(formData.get("month") || "");
  const lang = String(formData.get("lang") || "");
  const status = String(formData.get("status") || "");
  const category = String(formData.get("category") || "");
  if (!slug || (lang !== "en" && lang !== "hi")) redirect("/admin/stories");
  if (status !== "published" && status !== "draft" && status !== "") redirect(`/admin/stories/${slug}?e=status`);
  if (category && !isCategory(category)) redirect(`/admin/stories/${slug}?e=category`);
  const row = {
    slug,
    year,
    month,
    lang,
    status: status || null,
    sensitive: formData.get("sensitive") === "on",
    title: String(formData.get("title") || "").trim() || null,
    standfirst: String(formData.get("standfirst") || "").trim() || null,
    body: String(formData.get("body") || "").trim() || null,
    category: category || null,
    sources: parseSources(String(formData.get("sources") || "")),
    updated_at: new Date().toISOString(),
  };
  const existing = await db.from("story_overrides").select("id").eq("slug", slug).eq("lang", lang).maybeSingle();
  if (existing.data?.id) {
    await db.from("story_overrides").update(row).eq("id", existing.data.id);
  } else {
    await db.from("story_overrides").insert(row);
  }
  if (formData.get("sensitive_both") === "on") {
    const other = lang === "en" ? "hi" : "en";
    const twin = await db.from("story_overrides").select("id").eq("slug", slug).eq("lang", other).maybeSingle();
    if (twin.data?.id) await db.from("story_overrides").update({ sensitive: row.sensitive }).eq("id", twin.data.id);
  }
  await writeAudit("story_save", `${slug}:${lang}`, status || "fields");
  revalidateStory(year, month, slug, category || undefined);
  redirect(`/admin/stories/${slug}`);
}

export async function saveCorrection(formData: FormData) {
  const db = await guard();
  const id = String(formData.get("id") || "");
  const note = String(formData.get("note") || "").trim();
  const lang = String(formData.get("lang") || "both");
  if (note.length < 5 || !["en", "hi", "both"].includes(lang)) redirect("/admin/corrections?e=1");
  const row = {
    note,
    lang,
    article_slug: String(formData.get("article_slug") || "").trim() || null,
    article_year: String(formData.get("article_year") || "").trim() || null,
    article_month: String(formData.get("article_month") || "").trim() || null,
    visible: formData.get("visible") === "on",
    updated_at: new Date().toISOString(),
  };
  if (id) await db.from("desk_corrections").update(row).eq("id", id);
  else await db.from("desk_corrections").insert(row);
  await writeAudit(id ? "correction_edit" : "correction_add", id || note.slice(0, 80));
  revalidateStory("", "", "");
  redirect("/admin/corrections");
}
