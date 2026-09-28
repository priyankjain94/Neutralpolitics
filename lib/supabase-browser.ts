import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isOAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

let client: SupabaseClient | null | undefined;

export function browserSupabase(): SupabaseClient | null {
  if (!isOAuthConfigured()) return null;
  if (client !== undefined) return client;
  client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
    },
  });
  return client;
}
