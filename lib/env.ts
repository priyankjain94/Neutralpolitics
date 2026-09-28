export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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
  return isDatabaseConfigured() && Boolean(process.env.SUPABASE_STORAGE_BUCKET);
}

export function isUploadConfigured(): boolean {
  return isDatabaseConfigured() && (isR2Configured() || isSupabaseStorageConfigured());
}

export function uploadProvider(): "r2" | "supabase" | null {
  if (!isDatabaseConfigured()) return null;
  if (isR2Configured()) return "r2";
  if (isSupabaseStorageConfigured()) return "supabase";
  return null;
}

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}
