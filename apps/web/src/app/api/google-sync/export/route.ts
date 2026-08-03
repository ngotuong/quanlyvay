import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GOOGLE_SYNC_SELECTS } from "@/lib/export/columns.mjs";
import { fetchAllRows } from "@/lib/export/pagination.mjs";

type ExportRow = Record<string, unknown>;

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
  const queries = await Promise.all([
    fetchAllRows((from, to) => supabase.from("counterparties").select(GOOGLE_SYNC_SELECTS.counterparties).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("loans").select(GOOGLE_SYNC_SELECTS.loans).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("transactions").select(GOOGLE_SYNC_SELECTS.transactions).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("loan_lifecycle_events").select(GOOGLE_SYNC_SELECTS.lifecycleEvents).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("interest_periods").select(GOOGLE_SYNC_SELECTS.interestPeriods).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("expenses").select(GOOGLE_SYNC_SELECTS.expenses).order("transaction_id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("notifications").select(GOOGLE_SYNC_SELECTS.notifications).order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("audit_logs").select(GOOGLE_SYNC_SELECTS.auditLogs).order("id").range(from, to)),
  ]);
  const failed = queries.find((query) => query.error);
  if (failed?.error) return NextResponse.json({ error: "Export query failed" }, { status: 500 });

  const [counterpartiesQuery, loansQuery, transactionsQuery, lifecycleEventsQuery, interestPeriodsQuery, expensesQuery, notificationsQuery, auditLogsQuery] = queries;
  const counterparties = counterpartiesQuery.data ?? [];
  const loans = loansQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const lifecycleEvents = lifecycleEventsQuery.data ?? [];
  const interestPeriods = interestPeriodsQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];
  const auditLogs = auditLogsQuery.data ?? [];
  const timestamps = [
    ...timestampValues(counterparties, "updated_at"), ...timestampValues(loans, "updated_at"),
    ...timestampValues(transactions, "created_at"), ...timestampValues(lifecycleEvents, "created_at"),
    ...timestampValues(interestPeriods, "calculated_at"), ...timestampValues(notifications, "created_at"),
    ...timestampValues(auditLogs, "changed_at"),
  ];
  const sourceVersion = timestamps.sort().at(-1) ?? "empty";
  if (request.nextUrl.searchParams.get("cursor") === sourceVersion) {
    return NextResponse.json({ schemaVersion: 1, sourceVersion, unchanged: true });
  }

  return NextResponse.json({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceVersion,
    unchanged: false,
    tables: { counterparties, loans, transactions, lifecycleEvents, interestPeriods, expenses, notifications, auditLogs },
  }, { headers: { "cache-control": "no-store" } });
}
