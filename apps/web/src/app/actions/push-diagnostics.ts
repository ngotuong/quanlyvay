"use server";

import { after } from "next/server";
import { z } from "zod";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushAppOrigin } from "@/lib/notifications/origin";
import { configureWebPush, sendWebPush } from "@/lib/notifications/send";
import { buildPushPayload } from "@/lib/notifications/payload.mjs";
import { getUnreadNotificationCount } from "@/lib/business/queries";

export async function schedulePushDiagnosticAction(endpoint: string) {
  const profile = await requireAuthenticatedProfile();
  if (!z.string().url().max(2048).safeParse(endpoint).success) return { ok: false, message: "Thiết bị không hợp lệ." };
  const supabase = await createClient();
  const { data: subscription } = await supabase.from("push_subscriptions").select("id,endpoint,p256dh,auth_secret")
    .eq("user_id", profile.user_id).eq("endpoint", endpoint).maybeSingle();
  if (!subscription) return { ok: false, message: "Thiết bị này chưa đăng ký. Hãy bật thông báo trước." };
  let origin: string;
  try { origin = await pushAppOrigin(); configureWebPush(); }
  catch { return { ok: false, message: "Chưa thể kiểm tra thông báo tại địa chỉ này." }; }
  const admin = createAdminClient();
  // Persist only this browser's verified origin, never infer it from Apple/Google provider.
  const { error: originError } = await supabase.rpc("set_push_subscription_origin", { p_subscription_id: subscription.id, p_origin: origin });
  if (originError) return { ok: false, message: "Chưa thể kiểm tra thiết bị. Hãy thử lại." };
  const { data: receipt, error } = await admin.rpc("prepare_push_receipt", {
    p_delivery_id: null, p_subscription_id: subscription.id,
  });
  if (error || !receipt?.token) return { ok: false, message: "Chưa thể gửi lượt kiểm tra. Hãy chờ một phút rồi thử lại." };
  const count = await getUnreadNotificationCount();
  const payload = buildPushPayload({
    title: "Kiểm tra thông báo nền", body: "Đây là lượt kiểm tra trên thiết bị này. Không thay đổi khoản vay hoặc trạng thái đã đọc.",
    path: "/notifications", tag: `push-check:${receipt.id}`, unreadCount: count, origin, receiptToken: receipt.token,
    mutable: true,
  });
  after(async () => {
    await new Promise(resolve => setTimeout(resolve, 20000));
    let result = "FAILED";
    try { configureWebPush(); await sendWebPush(subscription, payload); result = "ACCEPTED"; }
    catch { /* Never log provider errors containing endpoints or keys. */ }
    await admin.rpc("complete_push_receipt_provider", { p_receipt_id: receipt.id, p_result: result });
  });
  return { ok: true, probeId: receipt.id as string,
    message: `Sẽ gửi sau 20 giây. Hãy về Màn hình chính và khóa màn hình. Số trên icon sẽ là ${count}, bằng số chưa đọc hiện tại. Mở lại app sau một phút để xem kết quả.` };
}

export async function getPushDiagnosticAction(id: string) {
  const profile = await requireAuthenticatedProfile();
  if (!z.string().uuid().safeParse(id).success) return null;
  const { data } = await createAdminClient().from("push_receipts")
    .select("provider_result,received_at,completed_at,notification_result,badge_result,push_subscriptions!inner(user_id)")
    .eq("id", id).eq("push_subscriptions.user_id", profile.user_id).is("delivery_id", null).maybeSingle();
  if (!data) return null;
  return {
    sent: data.provider_result, received: Boolean(data.received_at),
    notification: data.notification_result, badge: data.badge_result,
  };
}
