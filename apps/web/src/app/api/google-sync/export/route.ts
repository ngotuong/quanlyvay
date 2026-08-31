import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GOOGLE_SYNC_SELECTS } from "@/lib/export/columns.mjs";
import { fetchAllRows } from "@/lib/export/pagination.mjs";

type ExportRow = Record<string, unknown>;

async function fetchSanitizedAuditRows(
  supabase: ReturnType<typeof createAdminClient>,
  from: number,
  to: number,
) {
  const result = await supabase
    .rpc("get_audit_logs_sanitized")
    .select(GOOGLE_SYNC_SELECTS.auditLogs)
    .order("id")
    .range(from, to);
  return {
    data: Array.isArray(result.data) ? result.data : result.data ? [result.data] : [],
    error: result.error,
  };
}

function timestampValues(rows: ExportRow[], field: string) {
  return rows
    .map((row) => row[field])
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

function authorized(request: NextRequest) {
  const expected = process.env.SYNC_SECRET?.trim();
  const provided = request.headers.get("x-sync-secret")?.trim();
  if (!expected || !provided || expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const datasetNames = [
    "counterparties", "loans", "transactions", "lifecycleEvents", "loanTermCorrections",
    "settlementReversals", "legacyLoanOnboardings", "interestPeriods", "expenses",
    "notifications", "auditLogs",
  ] as const;
  const queries = await Promise.all([
    fetchAllRows((from, to) => supabase.from("counterparties").select(GOOGLE_SYNC_SELECTS.counterparties).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("loans").select(GOOGLE_SYNC_SELECTS.loans).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("transactions").select(GOOGLE_SYNC_SELECTS.transactions).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("loan_lifecycle_events").select(GOOGLE_SYNC_SELECTS.lifecycleEvents).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("loan_term_corrections").select(GOOGLE_SYNC_SELECTS.loanTermCorrections).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("loan_settlement_reversals").select(GOOGLE_SYNC_SELECTS.settlementReversals).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("legacy_loan_onboardings").select(GOOGLE_SYNC_SELECTS.legacyLoanOnboardings).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("interest_periods").select(GOOGLE_SYNC_SELECTS.interestPeriods).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("expenses").select(GOOGLE_SYNC_SELECTS.expenses).order("transaction_id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("notifications").select(GOOGLE_SYNC_SELECTS.notifications).order("id").range(from, to)),
    fetchAllRows((from, to) => fetchSanitizedAuditRows(supabase, from, to)),
  ]);
  const failedIndex = queries.findIndex((query) => query.error);
  if (failedIndex >= 0) {
    const failed = queries[failedIndex];
    const errorCode = failed.error && typeof failed.error === "object" && "code" in failed.error
      ? String(failed.error.code)
      : "unknown";
    console.error("Google Sync export query failed", { dataset: datasetNames[failedIndex], errorCode });
    return NextResponse.json({ error: "Export query failed" }, { status: 500 });
  }

  const [counterpartiesQuery, loansQuery, transactionsQuery, lifecycleEventsQuery, loanTermCorrectionsQuery, settlementReversalsQuery, legacyLoanOnboardingsQuery, interestPeriodsQuery, expensesQuery, notificationsQuery, auditLogsQuery] = queries;
  const counterparties = counterpartiesQuery.data ?? [];
  const loans = loansQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const lifecycleEvents = lifecycleEventsQuery.data ?? [];
  const loanTermCorrections = loanTermCorrectionsQuery.data ?? [];
  const settlementReversals = settlementReversalsQuery.data ?? [];
  const legacyLoanOnboardings = legacyLoanOnboardingsQuery.data ?? [];
  const interestPeriods = interestPeriodsQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];
  const auditLogs = auditLogsQuery.data ?? [];
  const timestamps = [
    ...timestampValues(counterparties, "updated_at"), ...timestampValues(loans, "updated_at"),
    ...timestampValues(transactions, "created_at"), ...timestampValues(lifecycleEvents, "created_at"),
    ...timestampValues(loanTermCorrections, "created_at"), ...timestampValues(settlementReversals, "created_at"), ...timestampValues(legacyLoanOnboardings, "created_at"),
    ...timestampValues(interestPeriods, "calculated_at"),
    ...timestampValues(notifications, "created_at"), ...timestampValues(notifications, "read_at"),
    ...timestampValues(auditLogs, "changed_at"),
  ];
  const sourceVersion = timestamps.sort().at(-1) ?? "empty";
  if (request.nextUrl.searchParams.get("cursor") === sourceVersion) {
    return NextResponse.json({ schemaVersion: 3, sourceVersion, unchanged: true });
  }

  return NextResponse.json({
    schemaVersion: 3,
    generatedAt: new Date().toISOString(),
    sourceVersion,
    unchanged: false,
    tables: { counterparties, loans, transactions, lifecycleEvents, loanTermCorrections, settlementReversals, legacyLoanOnboardings, interestPeriods, expenses, notifications, auditLogs },
  }, { headers: { "cache-control": "no-store" } });
}
