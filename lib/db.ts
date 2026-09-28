import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isDatabaseConfigured } from "./env";
import { fixtureDb, fixtureMode } from "./fixture-db";

let client: SupabaseClient | null = null;

export function getDb(): SupabaseClient | null {
  if (fixtureMode()) return fixtureDb() as unknown as SupabaseClient;
  if (!isDatabaseConfigured()) return null;
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
