import "server-only";

import { createClient } from "@supabase/supabase-js";
import { secretSupabaseEnvironment } from "./env";

export function createAdminClient() {
  const { url, secretKey } = secretSupabaseEnvironment();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
