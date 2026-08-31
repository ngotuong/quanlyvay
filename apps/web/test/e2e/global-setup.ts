import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
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
  const { error: editorError } = await admin.auth.admin.createUser({
    email: "c13_editor_e2e@auth.local",
    password: "EditorE2eTemp123",
    email_confirm: true,
    user_metadata: {
      provisioned_by_app: "true",
      username: "c13_editor_e2e",
      display_name: "C13 Editor E2E",
      app_role: "EDITOR",
    },
  });
  if (editorError) throw editorError;
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { error: signInError } = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password: "OwnerE2eTemp123" });
  if (signInError) throw signInError;
  const { data: counterpartyId, error: counterpartyError } = await owner.rpc("create_counterparty", {
    p_name: "Đối tác thông báo E2E",
    p_notes: null,
  });
  if (counterpartyError) throw counterpartyError;
  const { data: loanId, error: loanError } = await owner.rpc("create_loan_v3", {
    p_counterparty_id: counterpartyId,
    p_name: "Khoản thông báo E2E",
    p_direction: "LENDING",
    p_original_principal_vnd: 1_000_000,
    p_disbursement_date: "2026-08-01",
    p_term_days: null,
    p_interest_cycle_days: 30,
    p_initial_period_rate_percent: 3,
    p_interest_reminder_offset_days: 0,
    p_idempotency_key: "e2e-notification-loan",
    p_notes: null,
  });
  if (loanError) throw loanError;
  const { error: notificationError } = await admin.from("notifications").insert({
    user_id: data.user.id,
    loan_id: loanId,
    type: "LOAN_OVERDUE",
    notification_date: "2026-08-01",
    title: "Khoản vay đã quá hạn",
    body: "Thông báo mẫu cho kiểm thử giao diện.",
    idempotency_key: `e2e-notification:${data.user.id}`,
  });
  if (notificationError) throw notificationError;
  const { error: auditFixtureError } = await admin.from("audit_logs").insert(
    Array.from({ length: 30 }, (_, index) => ({
      actor_user_id: data.user.id,
      table_name: "counterparties",
      record_id: randomUUID(),
      action: "INSERT",
      new_data: { name: `Đối tác phân trang ${index + 1}` },
      request_id: `e2e-audit-pagination-${index + 1}`,
    })),
  );
  if (auditFixtureError) throw auditFixtureError;
}
