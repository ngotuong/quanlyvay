import { createClient } from "@supabase/supabase-js";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";

export default async function globalSetup() {
  resetLocalDatabase();
  const local = localSupabaseEnvironment();
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email: "c6_owner_e2e@auth.local",
    password: "OwnerE2eTemp123",
    email_confirm: true,
    user_metadata: {
      provisioned_by_app: "true",
      username: "c6_owner_e2e",
      display_name: "C6 Owner E2E",
      app_role: "OWNER",
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("E2E owner was not created.");
  const { error: notificationError } = await admin.from("notifications").insert({
    user_id: data.user.id,
    type: "LOAN_OVERDUE",
    notification_date: "2026-08-01",
    title: "Khoản vay đã quá hạn",
    body: "Thông báo mẫu cho kiểm thử giao diện.",
    idempotency_key: `e2e-notification:${data.user.id}`,
  });
  if (notificationError) throw notificationError;
}
