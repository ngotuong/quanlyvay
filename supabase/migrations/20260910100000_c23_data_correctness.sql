begin;

alter table public.counterparties
  add column if not exists is_test_data boolean not null default false;
alter table public.loans
  add column if not exists is_test_data boolean not null default false;

comment on column public.counterparties.is_test_data is
  'Service-managed classification. Test fixtures stay auditable but are excluded from operational views and exports.';
comment on column public.loans.is_test_data is
  'Service-managed classification. Test fixtures stay auditable but are excluded from operational views and exports.';

update public.counterparties
set is_test_data = true
where name like 'C21 TEST ONLY %'
  and notes = 'Synthetic Preview QA record; never real financial data.';

update public.loans
set is_test_data = true
where name like 'C21 TEST ONLY %'
  and notes = 'Synthetic Preview QA loan.'
  and original_principal_vnd = 9007199254740993
  and disbursement_date = date '2026-09-08';

create or replace function private.protect_test_data_classification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_test_data is distinct from old.is_test_data
     and current_user not in ('postgres', 'service_role')
     and coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'test-data classification is service-managed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger counterparties_protect_test_data
before update on public.counterparties
for each row execute function private.protect_test_data_classification();

create trigger loans_protect_test_data
before update on public.loans
for each row execute function private.protect_test_data_classification();

do $migration$
declare
  definition text;
  patched text;
begin
  select pg_get_functiondef('public.get_management_dashboard(date,date)'::regprocedure)
  into definition;

  patched := replace(
    definition,
    E'    where loan.disbursement_date <= p_period_end',
    E'    where not loan.is_test_data\n      and loan.disbursement_date <= p_period_end'
  );
  patched := replace(
    patched,
    E'    left join public.loans as loan on loan.id = transaction.loan_id\n    where transaction.type <> ''REVERSAL''',
    E'    left join public.loans as loan on loan.id = transaction.loan_id\n    where (loan.id is null or not loan.is_test_data)\n      and transaction.type <> ''REVERSAL'''
  );

  if patched = definition
     or (length(patched) - length(replace(patched, 'not loan.is_test_data', ''))) /
        length('not loan.is_test_data') <> 3 then
    raise exception 'C23 could not isolate test loans from management dashboard';
  end if;

  execute patched;
end;
$migration$;

do $migration$
declare
  definition text;
  patched text;
begin
  select pg_get_functiondef('private.loan_listing_facts(date,text,date,date)'::regprocedure)
  into definition;

  patched := replace(
    definition,
    E'        where reversal.settlement_event_id = event.id\n      )',
    E'        where reversal.settlement_event_id = event.id\n          and reversal.reversal_date <= p_as_of_date\n      )'
  );
  patched := replace(
    patched,
    E'        where reversal.type = ''REVERSAL'' and reversal.reversal_of_id = transaction.id\n      )',
    E'        where reversal.type = ''REVERSAL'' and reversal.reversal_of_id = transaction.id\n          and reversal.transaction_date <= p_as_of_date\n      )'
  );
  patched := replace(
    patched,
    E'  where (nullif(btrim(p_query), '''') is null',
    E'  where not loan.is_test_data\n    and (nullif(btrim(p_query), '''') is null'
  );

  if patched = definition
     or position('where not loan.is_test_data' in patched) = 0
     or position('reversal.reversal_date <= p_as_of_date' in patched) = 0
     or position('reversal.transaction_date <= p_as_of_date' in patched) = 0 then
    raise exception 'C23 could not harden loan listing facts';
  end if;

  execute patched;
end;
$migration$;

create or replace function public.get_management_dashboard_bundle_v3(
  p_period_start date,
  p_period_end date,
  p_previous_start date,
  p_previous_end date,
  p_balance_start date,
  p_balance_end date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  dashboard jsonb;
  previous_dashboard jsonb;
  previous_balance_dashboard jsonb;
begin
  dashboard := public.get_management_dashboard(p_period_start, p_period_end);
  previous_dashboard := public.get_management_dashboard(p_previous_start, p_previous_end);
  previous_balance_dashboard := public.get_management_dashboard(p_balance_start, p_balance_end);

  return jsonb_build_object(
    'dashboard', dashboard,
    'analytics', jsonb_build_object(
      'lendingAccruedVnd', dashboard ->> 'lendingAccruedVnd',
      'borrowingAccruedVnd', dashboard ->> 'borrowingAccruedVnd',
      'counterpartyExposure', dashboard -> 'counterpartyExposure'
    ),
    'previousDashboard', previous_dashboard,
    'previousBalanceDashboard', previous_balance_dashboard
  );
end;
$$;

revoke all on function public.get_management_dashboard_bundle_v3(date,date,date,date,date,date) from public, anon;
grant execute on function public.get_management_dashboard_bundle_v3(date,date,date,date,date,date) to authenticated, service_role;

comment on function public.get_management_dashboard_bundle_v3(date,date,date,date,date,date) is
  'Returns current KPIs, a like-for-like flow comparison, and an opening balance comparison.';

create or replace function public.get_google_sync_snapshot()
returns jsonb language sql stable security definer set search_path = '' as $$
  with snapshot as (
    select jsonb_build_object(
    'counterparties', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, name, notes, created_at, updated_at from public.counterparties where not is_test_data) row),
    'loans', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, counterparty_id, name, direction, status, original_principal_vnd::text as original_principal_vnd, disbursement_date, term_days, maturity_date, interest_cycle_days, interest_reminder_offset_days, initial_daily_rate_percent::text as initial_daily_rate_percent, settled_on, notes, created_at, updated_at from public.loans where not is_test_data) row),
    'transactions', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select transaction.id, transaction.loan_id, transaction.type, transaction.transaction_date, transaction.amount_vnd::text as amount_vnd, transaction.note, transaction.reversal_of_id, transaction.idempotency_key, transaction.created_at from public.transactions as transaction left join public.loans as loan on loan.id = transaction.loan_id where loan.id is null or not loan.is_test_data) row),
    'lifecycleEvents', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select event.id, event.loan_id, event.event_type, event.effective_date, event.daily_rate_percent::text as daily_rate_percent, event.note, event.created_at from public.loan_lifecycle_events as event join public.loans as loan on loan.id = event.loan_id where not loan.is_test_data) row),
    'loanTermCorrections', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select correction.id, correction.loan_id, correction.direction, correction.original_principal_vnd::text as original_principal_vnd, correction.disbursement_date, correction.term_days, correction.interest_cycle_days, correction.initial_period_rate_percent::text as initial_period_rate_percent, correction.reason, correction.idempotency_key, correction.created_at from public.loan_term_corrections as correction join public.loans as loan on loan.id = correction.loan_id where not loan.is_test_data) row),
    'settlementReversals', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select reversal.id, reversal.loan_id, reversal.settlement_event_id, reversal.reversal_date, reversal.reason, reversal.idempotency_key, reversal.created_at from public.loan_settlement_reversals as reversal join public.loans as loan on loan.id = reversal.loan_id where not loan.is_test_data) row),
    'legacyLoanOnboardings', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select onboarding.id, onboarding.loan_id, onboarding.as_of_date, onboarding.principal_outstanding_vnd::text as principal_outstanding_vnd, onboarding.interest_collected_vnd::text as interest_collected_vnd, onboarding.bad_debt_since, onboarding.note, onboarding.idempotency_key, onboarding.created_at from public.legacy_loan_onboardings as onboarding join public.loans as loan on loan.id = onboarding.loan_id where not loan.is_test_data) row),
    'interestPeriods', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select period.id, period.loan_id, period.kind, period.start_date, period.end_date, period.day_count, period.opening_principal_vnd::text as opening_principal_vnd, period.closing_principal_vnd::text as closing_principal_vnd, period.accrued_interest_vnd::text as accrued_interest_vnd, period.interest_payments_vnd::text as interest_payments_vnd, period.closing_interest_balance_vnd::text as closing_interest_balance_vnd, period.calculated_at from public.interest_periods as period join public.loans as loan on loan.id = period.loan_id where not loan.is_test_data) row),
    'expenses', (select coalesce(jsonb_agg(to_jsonb(row) order by row.transaction_id), '[]'::jsonb) from (select expense.transaction_id, expense.category from public.expenses as expense join public.transactions as transaction on transaction.id = expense.transaction_id left join public.loans as loan on loan.id = transaction.loan_id where loan.id is null or not loan.is_test_data) row),
    'notifications', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select notification.id, notification.user_id, notification.loan_id, notification.type, notification.notification_date, notification.title, notification.body, notification.read_at, notification.created_at from public.notifications as notification left join public.loans as loan on loan.id = notification.loan_id where loan.id is null or not loan.is_test_data) row),
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
