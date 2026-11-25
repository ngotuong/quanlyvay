import webpush from "web-push";
import { drainPushQueue } from "@/lib/notifications/worker.mjs";
import { createPinnedPushAgent } from "@/lib/notifications/push-endpoint.mjs";
import { NextResponse, type NextRequest } from "next/server";
import { todayInVietnam } from "@/lib/business/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPushPayload, deliveryPath } from "@/lib/notifications/payload.mjs";

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
  try { await supabase.rpc("prune_push_receipts").abortSignal(AbortSignal.timeout(1000)); } catch { /* Diagnostic maintenance cannot block reminders. */ }
  const date = todayInVietnam();
  const deliveryHour = currentHourInVietnam();
  const { data: generated, error: generationError } = await supabase.rpc("generate_due_notifications", { p_notification_date: date });
  if (generationError) return NextResponse.json({ error: "Không thể tạo thông báo" }, { status: 500 });
  const { error: cleanupError } = await supabase.rpc("close_resolved_notification_deliveries", { p_notification_date: date });
  if (cleanupError) return NextResponse.json({ error: "Không thể đồng bộ trạng thái thông báo" }, { status: 500 });

  try {
    const result = await drainPushQueue({
      startedAt,
      claim: async (limit: number) => {
        const { data, error } = await supabase.rpc("claim_push_deliveries", { p_limit: limit, p_delivery_hour: deliveryHour });
        if (error) throw new Error("claim failed");
        return (data ?? []) as ClaimedDelivery[];
      },
      send: async (delivery: ClaimedDelivery, options: { timeout: number }) => {
        let receiptData: { id: string; token: string; origin?: string } | undefined;
        try {
          const receipt = await supabase.rpc("prepare_push_receipt", { p_delivery_id: delivery.delivery_id }).abortSignal(AbortSignal.timeout(1000));
          if (!receipt.error) receiptData = receipt.data;
        } catch { /* Send the reminder even if optional diagnostics are unavailable. */ }
        const providerResult = async (result: string) => {
          try {
            if (receiptData?.id) await supabase.rpc("complete_push_receipt_provider", { p_receipt_id: receiptData.id, p_result: result }).abortSignal(AbortSignal.timeout(1000));
          } catch { /* A diagnostic write must not turn an accepted Push into a retry. */ }
        };
        // Missing diagnostics must not suppress the reminder (e.g. during a rolling deployment).
        const receiptToken = receiptData?.token;
        const payload = buildPushPayload({
          title: delivery.title, body: delivery.body, path: deliveryPath(delivery),
          tag: delivery.idempotency_key, unreadCount: delivery.unread_count,
          origin: receiptData?.origin || (process.env.VERCEL_ENV === "production" ? "https://tindung.vercel.app" : request.nextUrl.origin),
          receiptToken,
        });
        let agent: Awaited<ReturnType<typeof createPinnedPushAgent>>["agent"] | undefined;
        try {
          ({ agent } = await createPinnedPushAgent(delivery.endpoint, { timeoutMs: options.timeout }));
          const result = await webpush.sendNotification(
            { endpoint: delivery.endpoint, keys: { p256dh: delivery.p256dh, auth: delivery.auth_secret } },
            JSON.stringify(payload),
            { ...options, agent, TTL: 86400, urgency: "high" },
          );
          await providerResult("ACCEPTED");
          return result;
        } catch (error) {
          await providerResult("FAILED");
          throw error;
        } finally {
          agent?.destroy();
        }
      },
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
      { status: result.stateUpdateFailed > 0 || result.queueRemaining || result.failed > 0 ? 500 : 200 });
  } catch {
    return NextResponse.json({ error: "Không thể nhận lượt gửi thông báo" }, { status: 500 });
  }
}

export const GET = runNotifications;
export const POST = runNotifications;
