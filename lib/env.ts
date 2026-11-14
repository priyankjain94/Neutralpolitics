export function isDatabaseConfigured(): boolean {
  if (process.env.NP_ADMIN_FIXTURE === "1" && process.env.NODE_ENV !== "production") return true;
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function storageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "submissions";
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isUploadConfigured(): boolean {
  if (process.env.NP_ADMIN_FIXTURE === "1") return false;
  return isR2Configured() || isSupabaseStorageConfigured();
}

export function uploadProvider(): "r2" | "supabase" | null {
  if (isSupabaseStorageConfigured()) return "supabase";
  if (isR2Configured()) return "r2";
  return null;
}

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

/** Static export bakes HTML before runtime secrets exist. The API still returns 503 when unset. */
export function publicDatabaseFormsEnabled(): boolean {
  return process.env.NP_STATIC === "1" || isDatabaseConfigured();
}

export function publicUploadsEnabled(): boolean {
  return process.env.NP_STATIC === "1" || isUploadConfigured();
}
