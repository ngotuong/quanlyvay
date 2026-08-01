import webpush from "web-push";
import { NextResponse, type NextRequest } from "next/server";
import { todayInVietnam } from "@/lib/business/format";
import { createAdminClient } from "@/lib/supabase/admin";

type ClaimedDelivery = {
  delivery_id: string;
  subscription_id: string;
  endpoint: string;
  p256dh: string;
  auth_secret: string;
  title: string;
  body: string;
  loan_id: string | null;
  idempotency_key: string;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu biến môi trường ${name}.`);
  return value;
}

export async function POST(request: NextRequest) {
  const cronSecret = required("CRON_SECRET");
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicKey = required("NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY");
  const privateKey = required("WEB_PUSH_PRIVATE_KEY");
  webpush.setVapidDetails(process.env.WEB_PUSH_SUBJECT?.trim() || "mailto:admin@example.invalid", publicKey, privateKey);

  const supabase = createAdminClient();
  const date = todayInVietnam();
  const { data: generated, error: generationError } = await supabase.rpc("generate_due_notifications", { p_notification_date: date });
  if (generationError) return NextResponse.json({ error: "Notification generation failed" }, { status: 500 });
  const { data, error: claimError } = await supabase.rpc("claim_push_deliveries", { p_limit: 100 });
  if (claimError) return NextResponse.json({ error: "Delivery claim failed" }, { status: 500 });

  let sent = 0;
  let failed = 0;
  for (const delivery of (data ?? []) as ClaimedDelivery[]) {
    try {
      await webpush.sendNotification(
        { endpoint: delivery.endpoint, keys: { p256dh: delivery.p256dh, auth: delivery.auth_secret } },
        JSON.stringify({ title: delivery.title, body: delivery.body, url: delivery.loan_id ? `/loans/${delivery.loan_id}` : "/notifications", tag: delivery.idempotency_key }),
      );
      await supabase.rpc("complete_push_delivery", { p_delivery_id: delivery.delivery_id, p_succeeded: true, p_error: null });
      sent += 1;
    } catch (pushError) {
      const statusCode = typeof pushError === "object" && pushError && "statusCode" in pushError ? Number(pushError.statusCode) : 0;
      const message = pushError instanceof Error ? pushError.message : "Unknown Web Push error";
      await supabase.rpc("complete_push_delivery", { p_delivery_id: delivery.delivery_id, p_succeeded: false, p_error: message });
      if (statusCode === 404 || statusCode === 410) await supabase.from("push_subscriptions").delete().eq("id", delivery.subscription_id);
      failed += 1;
    }
  }

  return NextResponse.json({ date, generated: Number(generated ?? 0), claimed: data?.length ?? 0, sent, failed });
}
