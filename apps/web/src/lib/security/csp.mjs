import { randomBytes } from "node:crypto";

export function createCspNonce() {
  return randomBytes(18).toString("base64");
}

function supabaseOrigin(rawUrl) {
  try {
    return rawUrl ? new URL(rawUrl).origin : "https://*.supabase.co";
  } catch {
    return "https://*.supabase.co";
  }
}

export function contentSecurityPolicy({ nonce, supabaseUrl, development = false }) {
  if (!/^[A-Za-z0-9+/_-]{20,}={0,2}$/.test(nonce)) throw new Error("Invalid CSP nonce");
  const scripts = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (development) scripts.push("'unsafe-eval'");
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    `script-src ${scripts.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin(supabaseUrl)} wss://*.supabase.co`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join("; ");
}
