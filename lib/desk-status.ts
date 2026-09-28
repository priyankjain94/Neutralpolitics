export const DESK_STATUSES = ["new", "under_review", "verified", "rejected", "published"] as const;
export type DeskStatus = (typeof DESK_STATUSES)[number];

export const PAYMENT_TRACKS = ["unpaid", "pending", "paid"] as const;

const FROM_ENUM: Record<string, DeskStatus> = {
  new: "new",
  verifying: "under_review",
  under_review: "under_review",
  approved: "verified",
  verified: "verified",
  rejected: "rejected",
  posted: "published",
  published: "published",
};

export function deskStatusOf(row: { desk_status?: string | null; status?: string | null }): DeskStatus {
  const raw = row.desk_status || row.status || "new";
  return FROM_ENUM[raw] || "new";
}

export function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

/** Keep the original enum column valid when the desk label changes. */
export function legacyStatus(status: string): string {
  if (status === "under_review") return "verifying";
  if (status === "verified") return "approved";
  if (status === "published") return "posted";
  if (status === "rejected") return "rejected";
  return "new";
}
