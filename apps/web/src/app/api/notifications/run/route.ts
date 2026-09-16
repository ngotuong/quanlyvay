import webpush from "web-push";
import { drainPushQueue } from "@/lib/notifications/worker.mjs";
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
  notification_type: "INTEREST_DUE" | "LOAN_OVERDUE";
  unread_count: number;
};

export const maxDuration = 60;

function currentHourInVietnam() {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  return Number(hour);
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

  const startedAt = Date.now();
  const supabase = createAdminClient();
  const date = todayInVietnam();
  const deliveryHour = currentHourInVietnam();
  const { data: generated, error: generationError } = await supabase.rpc("generate_due_notifications", { p_notification_date: date });
  if (generationError) return NextResponse.json({ error: "Không thể tạo thông báo" }, { status: 500 });

  try {
    const result = await drainPushQueue({
      startedAt,
      claim: async (limit: number) => {
        const { data, error } = await supabase.rpc("claim_push_deliveries", { p_limit: limit, p_delivery_hour: deliveryHour });
        if (error) throw new Error("claim failed");
        return (data ?? []) as ClaimedDelivery[];
      },
      send: (delivery: ClaimedDelivery, options: { timeout: number }) => webpush.sendNotification(
        { endpoint: delivery.endpoint, keys: { p256dh: delivery.p256dh, auth: delivery.auth_secret } },
        JSON.stringify({ title: delivery.title, body: delivery.body, url: delivery.loan_id ? `/loans/${delivery.loan_id}?tab=overview${delivery.notification_type === "INTEREST_DUE" ? "&transaction=interest" : ""}` : "/notifications", tag: delivery.idempotency_key, badgeCount: delivery.unread_count }),
        options,
      ),
      complete: async (delivery: ClaimedDelivery, succeeded: boolean, errorMessage: string | null) => {
        const { error } = await supabase.rpc("complete_push_delivery", { p_delivery_id: delivery.delivery_id, p_succeeded: succeeded, p_error: errorMessage });
        return !error;
      },
      remove: async (delivery: ClaimedDelivery) => {
        const { error } = await supabase.from("push_subscriptions").delete().eq("id", delivery.subscription_id);
        if (error) throw new Error("cleanup failed");
      },
    });
    return NextResponse.json({ date, deliveryHour, generated: Number(generated ?? 0), ...result },
      { status: result.stateUpdateFailed > 0 || result.queueRemaining ? 500 : 200 });
  } catch {
    return NextResponse.json({ error: "Không thể nhận lượt gửi thông báo" }, { status: 500 });
  }
}

export const GET = runNotifications;
export const POST = runNotifications;
