import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppProfile } from "@/lib/auth/types";
import { todayInVietnam } from "./format";
import type {
  AuditLog,
  CalculationSnapshot,
  Counterparty,
  DashboardData,
  GeneralExpense,
  InterestPeriod,
  LifecycleEvent,
  Loan,
  LoanScheduleSummary,
  LoanManagementSummary,
  LoanTermSummary,
  LoanTransaction,
  SettlementReversal,
  AppNotification,
  ManagementAnalytics,
} from "./types";

export async function listManagedProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,username,display_name,role,must_change_password,is_active,created_at")
    .order("created_at");
  if (error) throw new Error("Không thể tải danh sách tài khoản.");
  return (data ?? []) as AppProfile[];
}

export async function listGeneralExpenses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id,type,transaction_date,amount_vnd,note,reversal_of_id,created_at,expenses(category)")
    .in("type", ["EXPENSE", "REVERSAL"])
    .is("loan_id", null)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error("Không thể tải danh sách chi phí chung.");
  return (data ?? []) as unknown as GeneralExpense[];
}

export async function getNotificationCenter() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, loan_id, type, notification_date, title, body, read_at, created_at, loans(name)")
    .order("notification_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Không thể tải trung tâm thông báo.");
  return (data ?? []) as unknown as AppNotification[];
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

export async function getDashboard(periodStart: string, periodEnd: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_management_dashboard", {
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });
  if (error || !data) throw new Error("Không thể tải số liệu tổng quan.");
  return data as DashboardData;
}

export async function getManagementAnalytics(periodStart: string, periodEnd: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_management_analytics", {
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });
  if (error || !data) throw new Error("Không thể tải biểu đồ quản trị.");
  return data as ManagementAnalytics;
}

export async function getManagementDashboardBundle(periodStart: string, periodEnd: string, previousStart: string, previousEnd: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_management_dashboard_bundle_v2", {
    p_period_start: periodStart,
    p_period_end: periodEnd,
    p_previous_start: previousStart,
    p_previous_end: previousEnd,
  });
  if (error || !data) throw new Error("Không thể tải số liệu tổng quan.");
  return data as unknown as { dashboard: DashboardData; analytics: ManagementAnalytics; previousDashboard: DashboardData };
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

export type LoanListFilters = {
  query?: string;
  direction?: "LENDING" | "BORROWING";
  status?: "ACTIVE" | "OVERDUE" | "BAD_DEBT" | "SETTLED";
  disbursedFrom?: string;
  disbursedTo?: string;
  sort?: "newest" | "oldest" | "outstanding_desc" | "name";
};

export type LoanListCounts = { all: number; lending: number; borrowing: number; active: number; badDebt: number; settled: number };

export async function listLoans(filters: LoanListFilters = {}) {
  const supabase = await createClient();
  const asOfDate = todayInVietnam();
  const { data, error } = await supabase.rpc("list_loan_summaries", {
    p_as_of_date: asOfDate,
    p_query: filters.query?.trim() || null,
    p_direction: filters.direction ?? null,
    p_status: filters.status ?? null,
    p_disbursed_from: filters.disbursedFrom ?? null,
    p_disbursed_to: filters.disbursedTo ?? null,
    p_sort: filters.sort ?? "newest",
  });
  if (error || !data) throw new Error("Không thể tải danh sách khoản vay.");
  return data as unknown as {
    items: Array<Loan & { calculation: CalculationSnapshot; schedule: LoanScheduleSummary; interestRecordedVnd: string }>;
    counts: LoanListCounts;
  };
}

export type LoanWorkspaceSection = "overview" | "interest" | "history" | "settings";

function currentInterestPeriods(calculation: CalculationSnapshot, loanId: string): InterestPeriod[] {
  return calculation.periods
    .map((period) => ({
      id: `${loanId}-${period.kind}-${period.startDate}-${period.endDate}`,
      kind: period.kind,
      start_date: period.startDate,
      end_date: period.endDate,
      day_count: period.dayCount,
      opening_principal_vnd: period.openingPrincipalVnd,
      closing_principal_vnd: period.closingPrincipalVnd,
      accrued_interest_vnd: period.accruedInterestVnd,
      interest_payments_vnd: period.interestPaymentsVnd,
      closing_interest_balance_vnd: period.closingInterestBalanceVnd,
    }))
    .reverse();
}

export async function getLoanWorkspace(id: string, section: LoanWorkspaceSection = "overview") {
  const supabase = await createClient();
  const asOfDate = todayInVietnam();
  const loadTransactions = section === "history" || section === "settings";
  const loadEvents = section === "history" || section === "settings";
  const [loanResult, transactionsResult, eventsResult, settlementReversalsResult, onboardingResult, calculationResult, termSummaryResult, scheduleResult, managementSummaryResult] = await Promise.all([
    supabase
      .from("loans")
      .select("id, counterparty_id, name, direction, status, original_principal_vnd, disbursement_date, term_days, maturity_date, interest_cycle_days, interest_reminder_offset_days, initial_daily_rate_percent, settled_on, notes, created_at, counterparties(name)")
      .eq("id", id)
      .single(),
    loadTransactions ? supabase
      .from("transactions")
      .select("id, type, transaction_date, amount_vnd, note, reversal_of_id, idempotency_key, created_at, expenses(category)")
      .eq("loan_id", id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    loadEvents ? supabase
      .from("loan_lifecycle_events")
      .select("id, event_type, effective_date, daily_rate_percent, note, idempotency_key, created_at")
      .eq("loan_id", id)
      .order("effective_date", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    section === "history" ? supabase
      .from("loan_settlement_reversals")
      .select("id, settlement_event_id, reversal_date, reason, created_at")
      .eq("loan_id", id)
      .order("reversal_date", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    (section === "history" || section === "settings") ? supabase
      .from("legacy_loan_onboardings")
      .select("id, as_of_date, principal_outstanding_vnd, interest_collected_vnd, bad_debt_since, note, idempotency_key, created_at")
      .eq("loan_id", id)
      .maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabase.rpc("calculate_loan", {
      p_loan_id: id,
      p_as_of_date: asOfDate,
    }),
    section === "settings" ? supabase.rpc("get_loan_term_summary", { p_loan_id: id }) : Promise.resolve({ data: null, error: null }),
    section === "overview" ? supabase.rpc("get_loan_schedule_summary", { p_loan_id: id, p_as_of_date: asOfDate }) : Promise.resolve({ data: null, error: null }),
    section === "overview" ? supabase.rpc("get_loan_management_summary", { p_loan_id: id, p_as_of_date: asOfDate }) : Promise.resolve({ data: null, error: null }),
  ]);

  if (loanResult.error || !loanResult.data) notFound();
  if (transactionsResult.error || eventsResult.error || settlementReversalsResult.error || onboardingResult.error) {
    throw new Error("Không thể tải đầy đủ lịch sử khoản vay.");
  }
  if (calculationResult.error || termSummaryResult.error || scheduleResult.error || managementSummaryResult.error) throw new Error("Không thể tính trạng thái khoản vay.");

  const calculation = calculationResult.data as CalculationSnapshot;

  return {
    loan: { ...(loanResult.data as unknown as Loan), calculation },
    transactions: (transactionsResult.data ?? []) as unknown as LoanTransaction[],
    events: (eventsResult.data ?? []) as LifecycleEvent[],
    settlementReversals: (settlementReversalsResult.data ?? []) as SettlementReversal[],
    periods: section === "interest" ? currentInterestPeriods(calculation, id) : [],
    onboarding: onboardingResult.data,
    termSummary: termSummaryResult.data as LoanTermSummary | null,
    schedule: scheduleResult.data as LoanScheduleSummary | null,
    managementSummary: managementSummaryResult.data as LoanManagementSummary | null,
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
