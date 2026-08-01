import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    supabase.from("counterparties").select("id,name,notes,created_at,updated_at").order("id"),
    supabase.from("loans").select("id,counterparty_id,name,direction,status,original_principal_vnd,disbursement_date,term_days,maturity_date,interest_cycle_days,initial_daily_rate_percent,settled_on,notes,created_at,updated_at").order("id"),
    supabase.from("transactions").select("id,loan_id,type,transaction_date,amount_vnd,note,reversal_of_id,idempotency_key,created_at").order("id"),
    supabase.from("loan_lifecycle_events").select("id,loan_id,event_type,effective_date,daily_rate_percent,note,created_at").order("id"),
    supabase.from("interest_periods").select("id,loan_id,kind,start_date,end_date,day_count,opening_principal_vnd,closing_principal_vnd,accrued_interest_vnd,interest_payments_vnd,closing_interest_balance_vnd,calculated_at").order("id"),
    supabase.from("expenses").select("transaction_id,category").order("transaction_id"),
    supabase.from("notifications").select("id,user_id,loan_id,type,notification_date,title,body,read_at,created_at").order("id"),
    supabase.from("audit_logs").select("id,actor_user_id,table_name,record_id,action,changed_at,request_id").order("id"),
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
    ...counterparties.map((row) => row.updated_at), ...loans.map((row) => row.updated_at),
    ...transactions.map((row) => row.created_at), ...lifecycleEvents.map((row) => row.created_at),
    ...interestPeriods.map((row) => row.calculated_at), ...notifications.map((row) => row.created_at),
    ...auditLogs.map((row) => row.changed_at),
  ].filter(Boolean) as string[];
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
