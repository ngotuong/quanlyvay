import "server-only";
import { readWithTiming } from "@/lib/app/read-timing.mjs";

import { fetchAllRows } from "@/lib/export/pagination.mjs";
import { buildLegacyGeneralExpensesPage } from "./expense-list-pagination.mjs";
import { paginateLegacyLoanSummaries } from "./loan-list-pagination.mjs";
import { readFailureDiagnostic } from "./read-failure-diagnostics.mjs";
import { readRpcWithGatewayRetry } from "./read-rpc-retry.mjs";
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
  PrincipalRestructure,
  SettlementReversal,
  AppNotification,
  ManagementAnalytics,
} from "./types";

export async function listManagedProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,username,display_name,role,must_change_password,password_reset_generation,is_active,notification_delivery_hour,created_at")
    .order("created_at");
  if (error) throw new Error("Không thể tải danh sách tài khoản.");
  return (data ?? []) as AppProfile[];
}

export async function listGeneralExpenses(page = 1) {
  const supabase = await createClient();
  const pageResult = await supabase.rpc("get_general_expenses_page", { p_page: page, p_size: 25 });
  let data: unknown = pageResult.data;
  if (pageResult.error?.code === "PGRST202") {
    console.warn("expense.list_page_rpc_missing", { fallback: "rls_protected_rows" });
    const legacyResult = await fetchAllRows((from, to) => supabase
      .from("transactions")
      .select("id, type, transaction_date, amount_vnd::text, note, reversal_of_id, created_at, expenses(category)")
      .is("loan_id", null)
      .in("type", ["EXPENSE", "REVERSAL"])
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to));
    if (legacyResult.error) throw new Error("Không thể tải chi phí.");
    data = buildLegacyGeneralExpensesPage(legacyResult.data ?? [], page, 25);
  } else if (pageResult.error || !data) {
    throw new Error("Không thể tải chi phí.");
  }
  return data as { items: Array<GeneralExpense & { reversed: boolean }>; totalCount: number; totalVnd: string; categories: Array<{ category: string; amountVnd: string }> };
}

export async function getNotificationCenter(page = 1, unreadOnly = false) {
  const supabase = await createClient();
  const filteredQuery = () => {
    let query = supabase.from("notifications").select("id, loan_id, type, notification_date, title, body, read_at, created_at");
    query = query.is("superseded_at", null);
    return unreadOnly ? query.is("read_at", null) : query;
  };
  // PostgREST rejects an out-of-range request before returning its exact count.
  // Read the RLS-filtered count first so the route can redirect to a valid page.
  let countQuery = supabase.from("notifications").select("id", { count: "exact", head: true }).is("superseded_at", null);
  if (unreadOnly) countQuery = countQuery.is("read_at", null);
  const { count, error: countError } = await countQuery;
  if (countError) throw new Error("Không thể tải trung tâm thông báo.");
  const totalCount = count ?? 0;
  if ((page - 1) * 25 >= totalCount) return { items: [] as AppNotification[], totalCount };
  const { data, error } = await filteredQuery().order("notification_date", { ascending: false })
    .order("created_at", { ascending: false }).order("id").range((page-1)*25, page*25-1);
  if (error?.code === "PGRST103") {
    // Another session may mark the last unread row between count and range.
    const fresh = await countQuery;
    if (!fresh.error && (page - 1) * 25 >= (fresh.count ?? 0)) {
      return { items: [] as AppNotification[], totalCount: fresh.count ?? 0 };
    }
  }
  if (error) throw new Error("Không thể tải trung tâm thông báo.");
  return { items: (data ?? []) as unknown as AppNotification[], totalCount };
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();
  const { count, error } = await readWithTiming("notifications.count", () => supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("superseded_at", null)
    .is("read_at", null));
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

export async function getManagementDashboardBundle(periodStart: string, periodEnd: string, previousStart: string, previousEnd: string, balanceStart: string, balanceEnd: string) {
  const supabase = await createClient();
  const args = {
    p_period_start: periodStart,
    p_period_end: periodEnd,
    p_previous_start: previousStart,
    p_previous_end: previousEnd,
    p_balance_start: balanceStart,
    p_balance_end: balanceEnd,
  };
  const [result, metadataResult] = await Promise.all([
    readWithTiming("dashboard.bundle", () => readRpcWithGatewayRetry("get_management_dashboard_bundle_v4", () => supabase.rpc("get_management_dashboard_bundle_v4", args))),
    readWithTiming("dashboard.attention-metadata", () => fetchAllRows((from, to) => supabase
      .from("loans")
      .select("id,disbursement_date,counterparties(name)")
      .eq("is_test_data", false)
      .lte("disbursement_date", periodEnd)
      .order("id")
      .range(from, to))),
  ]);
  let diagnosticResult = result;
  let data = result.data as Record<string, unknown> | null;
  let error = result.error;
  if (error?.code === "PGRST202") {
    const fallback = await readRpcWithGatewayRetry("get_management_dashboard_bundle_v2", () => supabase.rpc("get_management_dashboard_bundle_v2", {
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_previous_start: previousStart,
      p_previous_end: previousEnd,
    }));
    diagnosticResult = fallback;
    data = fallback.data ? {
      ...fallback.data as Record<string, unknown>,
      previousBalanceDashboard: (fallback.data as Record<string, unknown>).previousDashboard,
    } : null;
    error = fallback.error;
  }
  if (error || !data || metadataResult.error) {
    console.error("dashboard.read_failed", readFailureDiagnostic(diagnosticResult));
    throw new Error("Không thể tải số liệu tổng quan.");
  }
  const bundle = data as unknown as { dashboard: DashboardData; analytics: ManagementAnalytics; previousDashboard: DashboardData; previousBalanceDashboard: DashboardData };
  const metadataById = new Map((metadataResult.data ?? []).map((row) => {
    const relation = row.counterparties as unknown as { name: string } | { name: string }[] | null;
    const counterparty = Array.isArray(relation) ? relation[0] : relation;
    return [row.id, { counterpartyName: counterparty?.name ?? "", disbursementDate: row.disbursement_date }];
  }));
  const enrichAttention = (items: DashboardData["upcoming"]) => items.map((item) => ({
    ...item,
    counterpartyName: metadataById.get(item.id)?.counterpartyName || item.name,
    disbursementDate: metadataById.get(item.id)?.disbursementDate ?? "",
  }));
  bundle.dashboard = {
    ...bundle.dashboard,
    upcoming: enrichAttention(bundle.dashboard.upcoming),
    overdue: enrichAttention(bundle.dashboard.overdue),
  };
  return bundle;
}

export async function listCounterparties() {
  const supabase = await createClient();
  const { data, error } = await readWithTiming("counterparties.list", () => fetchAllRows((from, to) => supabase
    .from("counterparties")
    .select("id, name, notes, created_at, updated_at")
    .eq("is_test_data", false)
    .order("name").order("id").range(from, to)));
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

export async function listLoans(filters: LoanListFilters = {}, page = 1) {
  const supabase = await createClient();
  const asOfDate = todayInVietnam();
  const args = {
    p_as_of_date: asOfDate,
    p_query: filters.query?.trim() || null,
    p_direction: filters.direction ?? null,
    p_status: filters.status ?? null,
    p_disbursed_from: filters.disbursedFrom ?? null,
    p_disbursed_to: filters.disbursedTo ?? null,
    p_sort: filters.sort ?? "newest",
    p_page: page,
    p_size: 25,
  };
  const pageResult = await readWithTiming("loans.page", () => readRpcWithGatewayRetry("list_loan_summaries_page", () => supabase.rpc("list_loan_summaries_page", args)));
  let data: unknown = pageResult.data;

  if (pageResult.error?.code === "PGRST202") {
    console.warn("loan.list_page_rpc_missing", { fallback: "list_loan_summaries" });
    const legacyResult = await readRpcWithGatewayRetry("list_loan_summaries", () => supabase.rpc("list_loan_summaries", {
      p_as_of_date: args.p_as_of_date,
      p_query: args.p_query,
      p_direction: args.p_direction,
      p_status: args.p_status,
      p_disbursed_from: args.p_disbursed_from,
      p_disbursed_to: args.p_disbursed_to,
      p_sort: args.p_sort,
    }));
    if (legacyResult.error || !legacyResult.data) {
      console.error("loan.list_read_failed", readFailureDiagnostic(legacyResult));
      throw new Error("Không thể tải danh sách khoản vay.");
    }
    data = paginateLegacyLoanSummaries(legacyResult.data, page, args.p_size);
  } else if (pageResult.error || !data) {
    console.error("loan.list_read_failed", readFailureDiagnostic(pageResult));
    throw new Error("Không thể tải danh sách khoản vay.");
  }

  return data as {
    items: Array<Loan & { calculation: CalculationSnapshot; schedule: LoanScheduleSummary; interestRecordedVnd: string }>;
    counts: LoanListCounts;
    totalCount: number;
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
  const [loanResult, transactionsResult, eventsResult, settlementReversalsResult, principalRestructuresResult, onboardingResult, calculationResult, termSummaryResult, scheduleResult, managementSummaryResult] = await Promise.all([
    supabase
      .from("loans")
      .select("id, counterparty_id, name, direction, status, original_principal_vnd::text, disbursement_date, term_days, maturity_date, interest_cycle_days, interest_reminder_offset_days, initial_daily_rate_percent::text, settled_on, notes, created_at, counterparties(name)")
      .eq("id", id)
      .maybeSingle(),
    loadTransactions ? fetchAllRows((from, to) => supabase
      .from("transactions")
      .select("id, type, transaction_date, amount_vnd::text, note, reversal_of_id, idempotency_key, created_at, expenses(category)")
      .eq("loan_id", id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }).order("id").range(from, to)) : Promise.resolve({ data: [], error: null }),
    loadEvents ? fetchAllRows((from, to) => supabase
      .from("loan_lifecycle_events")
      .select("id, event_type, effective_date, daily_rate_percent::text, note, idempotency_key, created_at")
      .eq("loan_id", id)
      .order("effective_date", { ascending: false }).order("id").range(from, to)) : Promise.resolve({ data: [], error: null }),
    section === "history" ? fetchAllRows((from, to) => supabase
      .from("loan_settlement_reversals")
      .select("id, settlement_event_id, reversal_date, reason, created_at")
      .eq("loan_id", id)
      .order("reversal_date", { ascending: false }).order("id").range(from, to)) : Promise.resolve({ data: [], error: null }),
    section === "history" ? fetchAllRows((from, to) => supabase
      .from("loan_principal_restructures")
      .select("id, effective_date, principal_before_vnd::text, principal_payment_vnd::text, principal_after_vnd::text, interest_settled_vnd::text, principal_transaction_id, interest_transaction_id, note, idempotency_key, created_at")
      .eq("loan_id", id)
      .order("effective_date", { ascending: false }).order("id").range(from, to)) : Promise.resolve({ data: [], error: null }),
    (section === "history" || section === "settings") ? supabase
      .from("legacy_loan_onboardings")
      .select("id, as_of_date, principal_outstanding_vnd::text, interest_collected_vnd::text, bad_debt_since, note, idempotency_key, created_at")
      .eq("loan_id", id)
      .maybeSingle() : Promise.resolve({ data: null, error: null }),
    readRpcWithGatewayRetry("calculate_loan", () => supabase.rpc("calculate_loan", {
      p_loan_id: id,
      p_as_of_date: asOfDate,
    })),
    section === "settings" ? readRpcWithGatewayRetry("get_loan_term_summary", () => supabase.rpc("get_loan_term_summary", { p_loan_id: id })) : Promise.resolve({ data: null, error: null }),
    section === "overview" ? readRpcWithGatewayRetry("get_loan_schedule_summary", () => supabase.rpc("get_loan_schedule_summary", { p_loan_id: id, p_as_of_date: asOfDate })) : Promise.resolve({ data: null, error: null }),
    section === "overview" ? readRpcWithGatewayRetry("get_loan_management_summary", () => supabase.rpc("get_loan_management_summary", { p_loan_id: id, p_as_of_date: asOfDate })) : Promise.resolve({ data: null, error: null }),
  ]);

  if (loanResult.error) throw new Error("Không thể tải khoản vay. Hãy thử lại.");
  if (!loanResult.data) notFound();
  if (transactionsResult.error || eventsResult.error || settlementReversalsResult.error || principalRestructuresResult.error || onboardingResult.error) {
    throw new Error("Không thể tải đầy đủ lịch sử khoản vay.");
  }
  if (calculationResult.error || termSummaryResult.error || scheduleResult.error || managementSummaryResult.error) {
    console.error("loan.summary_failed", {
      calculation: calculationResult.error ? readFailureDiagnostic(calculationResult) : undefined,
      terms: termSummaryResult.error ? readFailureDiagnostic(termSummaryResult) : undefined,
      schedule: scheduleResult.error ? readFailureDiagnostic(scheduleResult) : undefined,
      management: managementSummaryResult.error ? readFailureDiagnostic(managementSummaryResult) : undefined,
    });
    throw new Error("Không thể tính trạng thái khoản vay.");
  }

  const calculation = calculationResult.data as CalculationSnapshot;

  return {
    loan: { ...(loanResult.data as unknown as Loan), calculation },
    transactions: (transactionsResult.data ?? []) as unknown as LoanTransaction[],
    events: (eventsResult.data ?? []) as LifecycleEvent[],
    settlementReversals: (settlementReversalsResult.data ?? []) as SettlementReversal[],
    principalRestructures: (principalRestructuresResult.data ?? []) as PrincipalRestructure[],
    periods: section === "interest" ? currentInterestPeriods(calculation, id) : [],
    onboarding: onboardingResult.data,
    termSummary: termSummaryResult.data as LoanTermSummary | null,
    schedule: scheduleResult.data as LoanScheduleSummary | null,
    managementSummary: managementSummaryResult.data as LoanManagementSummary | null,
  };
}

export async function listAuditLogs(page = 1, pageSize = 25) {
  const supabase = await createClient();
  const safePage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const safePageSize = Number.isSafeInteger(pageSize) && pageSize > 0 && pageSize <= 100 ? pageSize : 25;
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const [{ data, error, count }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase
      .rpc("get_audit_logs_sanitized", undefined, { count: "exact" })
      .order("changed_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to),
    supabase.from("profiles").select("user_id, display_name"),
  ]);
  if (error || profilesError) throw new Error("Không thể tải lịch sử chỉnh sửa.");
  const names = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name]));
  const sanitizedLogs = Array.isArray(data) ? data as Array<Omit<AuditLog, "profiles"> & { actor_user_id: string | null }> : [];
  const logs = sanitizedLogs.map((log) => ({
    ...log,
    profiles: log.actor_user_id ? { display_name: names.get(log.actor_user_id) ?? "Người dùng" } : null,
  })) as unknown as AuditLog[];
  const totalCount = count ?? 0;
  return {
    logs,
    page: safePage,
    pageSize: safePageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / safePageSize)),
  };
}
