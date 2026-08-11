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
  unread_count: number;
};

async function completeDelivery(
  supabase: ReturnType<typeof createAdminClient>,
  deliveryId: string,
  succeeded: boolean,
  errorMessage: string | null,
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await supabase.rpc("complete_push_delivery", {
      p_delivery_id: deliveryId,
      p_succeeded: succeeded,
      p_error: errorMessage,
    });
    if (!error) return true;
    lastError = error;
  }
  console.error("notifications.complete_delivery_failed", {
    deliveryId,
    succeeded,
    error: lastError instanceof Error ? lastError.message : "database_error",
  });
  return false;
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu biến môi trường ${name}.`);
  return value;
}

async function runNotifications(request: NextRequest) {
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
  if (generationError) return NextResponse.json({ error: "Không thể tạo thông báo" }, { status: 500 });
  const { data, error: claimError } = await supabase.rpc("claim_push_deliveries", { p_limit: 100 });
  if (claimError) return NextResponse.json({ error: "Không thể nhận lượt gửi thông báo" }, { status: 500 });

  let sent = 0;
  let failed = 0;
  let stateUpdateFailed = 0;
  for (const delivery of (data ?? []) as ClaimedDelivery[]) {
    try {
      await webpush.sendNotification(
        { endpoint: delivery.endpoint, keys: { p256dh: delivery.p256dh, auth: delivery.auth_secret } },
        JSON.stringify({ title: delivery.title, body: delivery.body, url: delivery.loan_id ? `/loans/${delivery.loan_id}` : "/notifications", tag: delivery.idempotency_key, badgeCount: delivery.unread_count }),
      );
      if (await completeDelivery(supabase, delivery.delivery_id, true, null)) sent += 1;
      else stateUpdateFailed += 1;
    } catch (pushError) {
      const statusCode = typeof pushError === "object" && pushError && "statusCode" in pushError ? Number(pushError.statusCode) : 0;
      const message = pushError instanceof Error ? pushError.message : "Lỗi gửi thông báo không xác định";
      const completed = await completeDelivery(supabase, delivery.delivery_id, false, message);
      if (statusCode === 404 || statusCode === 410) await supabase.from("push_subscriptions").delete().eq("id", delivery.subscription_id);
      if (completed) failed += 1;
      else stateUpdateFailed += 1;
    }
  }

  return NextResponse.json(
    { date, generated: Number(generated ?? 0), claimed: data?.length ?? 0, sent, failed, stateUpdateFailed },
    { status: stateUpdateFailed > 0 ? 500 : 200 },
  );
}

export const GET = runNotifications;
export const POST = runNotifications;
