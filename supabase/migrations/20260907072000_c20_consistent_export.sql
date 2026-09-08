begin;
-- One stable SQL statement shares one MVCC snapshot across all reconciliation datasets.
create function public.get_google_sync_snapshot()
returns jsonb language sql stable security definer set search_path = '' as $$
  with snapshot as (
    select jsonb_build_object(
    'counterparties', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, name, notes, created_at, updated_at from public.counterparties) row),
    'loans', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, counterparty_id, name, direction, status, original_principal_vnd::text as original_principal_vnd, disbursement_date, term_days, maturity_date, interest_cycle_days, interest_reminder_offset_days, initial_daily_rate_percent::text as initial_daily_rate_percent, settled_on, notes, created_at, updated_at from public.loans) row),
    'transactions', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, loan_id, type, transaction_date, amount_vnd::text as amount_vnd, note, reversal_of_id, idempotency_key, created_at from public.transactions) row),
    'lifecycleEvents', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, loan_id, event_type, effective_date, daily_rate_percent::text as daily_rate_percent, note, created_at from public.loan_lifecycle_events) row),
    'loanTermCorrections', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, loan_id, direction, original_principal_vnd::text as original_principal_vnd, disbursement_date, term_days, interest_cycle_days, initial_period_rate_percent::text as initial_period_rate_percent, reason, idempotency_key, created_at from public.loan_term_corrections) row),
    'settlementReversals', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, loan_id, settlement_event_id, reversal_date, reason, idempotency_key, created_at from public.loan_settlement_reversals) row),
    'legacyLoanOnboardings', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, loan_id, as_of_date, principal_outstanding_vnd::text as principal_outstanding_vnd, interest_collected_vnd::text as interest_collected_vnd, bad_debt_since, note, idempotency_key, created_at from public.legacy_loan_onboardings) row),
    'interestPeriods', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, loan_id, kind, start_date, end_date, day_count, opening_principal_vnd::text as opening_principal_vnd, closing_principal_vnd::text as closing_principal_vnd, accrued_interest_vnd::text as accrued_interest_vnd, interest_payments_vnd::text as interest_payments_vnd, closing_interest_balance_vnd::text as closing_interest_balance_vnd, calculated_at from public.interest_periods) row),
    'expenses', (select coalesce(jsonb_agg(to_jsonb(row) order by row.transaction_id), '[]'::jsonb) from (select transaction_id, category from public.expenses) row),
    'notifications', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, user_id, loan_id, type, notification_date, title, body, read_at, created_at from public.notifications) row),
    'auditLogs', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, actor_user_id, table_name, record_id, action, changed_at, request_id from public.get_audit_logs_sanitized()) row)
    ) as tables
  )
  select jsonb_build_object('schemaVersion', 3, 'sourceVersion', md5(tables::text),
    'generatedAt', statement_timestamp(), 'unchanged', false, 'tables', tables)
  from snapshot;
$$;
revoke all on function public.get_google_sync_snapshot() from public, anon, authenticated;
grant execute on function public.get_google_sync_snapshot() to service_role;
commit;
