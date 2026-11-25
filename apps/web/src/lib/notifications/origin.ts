import "server-only";
import { headers } from "next/headers";

export async function pushAppOrigin() {
  const value = (await headers()).get("origin");
  if (!value) throw new Error("Missing app origin");
  const origin = new URL(value).origin;
  const allowed = new Set(["https://tindung.vercel.app", "https://tindung-preview.vercel.app",
    "https://quan-ly-vay-ca-nhan-ngotuong2105.vercel.app",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [])]);
  if (!allowed.has(origin) && !(process.env.VERCEL_ENV === undefined && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) {
    throw new Error("Unexpected app origin");
  }
  return origin;
}
