"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { parseAllowedPushEndpoint } from "@/lib/notifications/push-endpoint.mjs";
import { createClient } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  p256dh: z.string().min(1).max(1024),
  auth: z.string().min(1).max(1024),
});

export async function registerPushSubscriptionAction(input: unknown) {
  await requireAuthenticatedProfile();
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success || !parseAllowedPushEndpoint(parsed.data.endpoint)) {
    return { ok: false, message: "Thông tin đăng ký nhận thông báo không hợp lệ." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("register_push_subscription", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.p256dh,
    p_auth_secret: parsed.data.auth,
  });
  if (error) return { ok: false, message: "Chưa thể lưu đăng ký nhận thông báo. Hãy thử lại." };
  revalidatePath("/notifications");
  return { ok: true, message: "Đã bật thông báo trên thiết bị này." };
}

export async function removePushSubscriptionAction(endpoint: string) {
  await requireAuthenticatedProfile();
  const parsed = z.string().url().max(2048).safeParse(endpoint);
  if (!parsed.success) return { ok: false, message: "Đăng ký nhận thông báo không hợp lệ." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_push_subscription", { p_endpoint: parsed.data });
  if (error) return { ok: false, message: "Chưa thể tắt thông báo trên thiết bị này." };
  revalidatePath("/notifications");
  return { ok: true, message: "Đã tắt thông báo trên thiết bị này." };
}

export async function updateNotificationDeliveryHourAction(hour: number) {
  await requireAuthenticatedProfile();
  const parsed = z.number().int().min(0).max(23).safeParse(hour);
  if (!parsed.success) return { ok: false, message: "Giờ nhận thông báo không hợp lệ." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_notification_delivery_hour", { p_hour: parsed.data });
  if (error) return { ok: false, message: "Chưa thể lưu giờ nhận thông báo. Hãy thử lại." };
  revalidatePath("/notifications");
  return { ok: true, message: `Đã đặt giờ nhận thông báo là ${String(parsed.data).padStart(2, "0")}:00.` };
}

export async function markNotificationsReadAction(ids?: string[]) {
  await requireAuthenticatedProfile();
  const parsed = z.array(z.string().uuid()).max(100).optional().safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Danh sách thông báo không hợp lệ." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notifications_read", { p_notification_ids: parsed.data ?? null });
  if (error) return { ok: false, message: "Chưa thể đánh dấu đã đọc. Hãy thử lại." };
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true, message: "Đã đánh dấu thông báo đã đọc." };
}

export async function openNotificationAction(notificationId: string) {
  await requireAuthenticatedProfile();
  const parsed = z.string().uuid().safeParse(notificationId);
  if (!parsed.success) return { ok: false, message: "Thông báo không hợp lệ." };

  const supabase = await createClient();
  const { data: notification, error } = await supabase.from("notifications").select("loan_id,type,superseded_at").eq("id", parsed.data).maybeSingle();
  if (error || !notification?.loan_id) return { ok: false, message: "Chưa thể mở thông báo. Hãy thử lại." };
  const marked = await supabase.rpc("mark_notifications_read", { p_notification_ids: [parsed.data] });
  if (marked.error) return { ok: false, message: "Chưa thể đánh dấu đã đọc. Hãy thử lại." };
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  const query = notification.type === "INTEREST_DUE" && !notification.superseded_at
    ? "?tab=overview&transaction=interest"
    : "?tab=overview";
  redirect(`/loans/${notification.loan_id}${query}`);
}
