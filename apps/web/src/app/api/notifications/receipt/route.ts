import { createAdminClient } from "@/lib/supabase/admin";
import { parseReceiptRequest } from "@/lib/notifications/receipt-request.mjs";

export const dynamic = "force-dynamic";
export const maxDuration = 10;
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const origin = request.headers.get("origin");
  // Next's Node adapter can use its bind hostname in request.url. Match the actual Host too.
  const url = new URL(request.url);
  const hostOrigin = `${url.protocol}//${request.headers.get("host") || url.host}`;
  if (origin && origin !== url.origin && origin !== hostOrigin) return new Response(null, { status: 403, headers });
  const data = await parseReceiptRequest(request);
  if (!data) return new Response(null, { status: 400, headers });
  const { error } = await createAdminClient().rpc("record_push_receipt", {
    p_token: data.token, p_stage: data.stage,
    p_notification_result: data.notificationResult ?? null, p_badge_result: data.badgeResult ?? null,
  });
  // Do not expose whether a token exists, expired or was already used.
  return new Response(null, { status: error ? 503 : 204, headers });
}
