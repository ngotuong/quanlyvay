"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseEnvironment } from "./env";

export function createClient() {
  const { url, publishableKey } = publicSupabaseEnvironment();
  return createBrowserClient(url, publishableKey);
}
