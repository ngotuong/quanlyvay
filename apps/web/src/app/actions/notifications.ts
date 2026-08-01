"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  p256dh: z.string().min(1).max(1024),
  auth: z.string().min(1).max(1024),
});

export async function registerPushSubscriptionAction(input: unknown) {
  await requireAuthenticatedProfile();
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Thông tin đăng ký Push không hợp lệ." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("register_push_subscription", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.p256dh,
    p_auth_secret: parsed.data.auth,
  });
  if (error) return { ok: false, message: "Chưa thể lưu đăng ký Push. Hãy thử lại." };
  revalidatePath("/notifications");
  return { ok: true, message: "Đã bật thông báo trên thiết bị này." };
}

export async function removePushSubscriptionAction(endpoint: string) {
  await requireAuthenticatedProfile();
  const parsed = z.string().url().max(2048).safeParse(endpoint);
  if (!parsed.success) return { ok: false, message: "Đăng ký Push không hợp lệ." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_push_subscription", { p_endpoint: parsed.data });
  if (error) return { ok: false, message: "Chưa thể tắt thông báo trên thiết bị này." };
  revalidatePath("/notifications");
  return { ok: true, message: "Đã tắt thông báo trên thiết bị này." };
}

export async function markNotificationsReadAction(ids?: string[]) {
  await requireAuthenticatedProfile();
  const parsed = z.array(z.string().uuid()).max(100).optional().safeParse(ids);
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.rpc("mark_notifications_read", { p_notification_ids: parsed.data ?? null });
  revalidatePath("/notifications");
}
