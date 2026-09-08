import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicSupabaseEnvironment } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = publicSupabaseEnvironment();

  return createServerClient(url, publishableKey, {
    // Financial reads must bypass Next's fetch cache, including post-mutation RSC renders.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. src/proxy.ts refreshes them.
        }
      },
    },
  });
}
