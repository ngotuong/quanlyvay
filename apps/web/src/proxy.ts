import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";
import { contentSecurityPolicy, createCspNonce } from "@/lib/security/csp.mjs";

export async function proxy(request: NextRequest) {
  const nonce = createCspNonce();
  const policy = contentSecurityPolicy({
    nonce,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    development: process.env.NODE_ENV === "development",
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = await updateSupabaseSession(request, requestHeaders);
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
