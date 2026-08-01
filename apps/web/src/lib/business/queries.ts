import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInVietnam } from "./format";
import type {
  AuditLog,
  CalculationSnapshot,
  Counterparty,
  DashboardData,
  InterestPeriod,
  LifecycleEvent,
  Loan,
  LoanTransaction,
} from "./types";

export async function getDashboard(months = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard", {
    p_as_of_date: todayInVietnam(),
    p_months: months,
  });
  if (error || !data) throw new Error("Không thể tải số liệu tổng quan.");
  return data as DashboardData;
}

export async function listCounterparties() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("counterparties")
    .select("id, name, notes, created_at, updated_at")
    .order("name");
  if (error) throw new Error("Không thể tải danh sách đối tác.");
  return data as Counterparty[];
}

export async function listLoans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loans")
    .select("id, counterparty_id, name, direction, status, original_principal_vnd, disbursement_date, term_days, maturity_date, interest_cycle_days, initial_daily_rate_percent, settled_on, notes, created_at, counterparties(name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Không thể tải danh sách khoản vay.");

  const asOfDate = todayInVietnam();
  return Promise.all(
    (data as unknown as Loan[]).map(async (loan) => {
      const { data: calculation } = await supabase.rpc("calculate_loan", {
        p_loan_id: loan.id,
        p_as_of_date: asOfDate,
      });
      return { ...loan, calculation: calculation as CalculationSnapshot | null };
    }),
  );
}

export async function getLoanWorkspace(id: string) {
  const supabase = await createClient();
  const [loanResult, transactionsResult, eventsResult, periodsResult] = await Promise.all([
    supabase
      .from("loans")
      .select("id, counterparty_id, name, direction, status, original_principal_vnd, disbursement_date, term_days, maturity_date, interest_cycle_days, initial_daily_rate_percent, settled_on, notes, created_at, counterparties(name)")
      .eq("id", id)
      .single(),
    supabase
      .from("transactions")
      .select("id, type, transaction_date, amount_vnd, note, reversal_of_id, created_at, expenses(category)")
      .eq("loan_id", id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("loan_lifecycle_events")
      .select("id, event_type, effective_date, daily_rate_percent, note, created_at")
      .eq("loan_id", id)
      .order("effective_date", { ascending: false }),
    supabase
      .from("interest_periods")
      .select("id, kind, start_date, end_date, day_count, opening_principal_vnd, closing_principal_vnd, accrued_interest_vnd, interest_payments_vnd, closing_interest_balance_vnd")
      .eq("loan_id", id)
      .order("start_date", { ascending: false }),
  ]);

  if (loanResult.error || !loanResult.data) notFound();
  const { data: calculation, error: calculationError } = await supabase.rpc("calculate_loan", {
    p_loan_id: id,
    p_as_of_date: todayInVietnam(),
  });
  if (calculationError) throw new Error("Không thể tính trạng thái khoản vay.");

  return {
    loan: { ...(loanResult.data as unknown as Loan), calculation: calculation as CalculationSnapshot },
    transactions: (transactionsResult.data ?? []) as unknown as LoanTransaction[],
    events: (eventsResult.data ?? []) as LifecycleEvent[],
    periods: (periodsResult.data ?? []) as InterestPeriod[],
  };
}

export async function listAuditLogs() {
  const supabase = await createClient();
  const [{ data, error }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase
    .from("audit_logs")
    .select("id, actor_user_id, table_name, record_id, action, changed_at, old_data, new_data")
    .order("changed_at", { ascending: false })
    .limit(100),
    supabase.from("profiles").select("user_id, display_name"),
  ]);
  if (error || profilesError) throw new Error("Không thể tải lịch sử chỉnh sửa.");
  const names = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name]));
  return (data ?? []).map((log) => ({
    ...log,
    profiles: log.actor_user_id ? { display_name: names.get(log.actor_user_id) ?? "Người dùng" } : null,
  })) as unknown as AuditLog[];
}
