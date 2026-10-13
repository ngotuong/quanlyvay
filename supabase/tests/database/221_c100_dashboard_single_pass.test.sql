begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000100', 'c100-owner@example.test'),
  ('10000000-0000-0000-0000-000000000101', 'c100-viewer@example.test');

insert into public.profiles (user_id, username, display_name, role, is_active)
values
  ('10000000-0000-0000-0000-000000000100', 'c100_owner', 'C100 Owner', 'OWNER', true),
  ('10000000-0000-0000-0000-000000000101', 'c100_viewer', 'C100 Viewer', 'VIEWER', true);

insert into public.counterparties (id, name)
values ('20000000-0000-0000-0000-000000000100', 'C100 synthetic counterparty');

insert into public.loans (
  id, counterparty_id, name, direction, original_principal_vnd,
  disbursement_date, term_days, interest_cycle_days,
  interest_reminder_offset_days, initial_daily_rate_percent
) values
  ('30000000-0000-0000-0000-000000000100', '20000000-0000-0000-0000-000000000100', 'C100 payments', 'LENDING', 100000000, date '2026-01-01', 180, 30, 2, 0.08),
  ('30000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000100', 'C100 stop resume', 'LENDING', 60000000, date '2026-01-01', 180, 30, 2, 0.10),
  ('30000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000100', 'C100 restructure', 'BORROWING', 80000000, date '2026-01-01', 180, 30, 2, 0.07),
  ('30000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000100', 'C100 settled', 'LENDING', 40000000, date '2026-01-01', 180, 30, 2, 0.06),
  ('30000000-0000-0000-0000-000000000104', '20000000-0000-0000-0000-000000000100', 'C100 overdue', 'BORROWING', 20000000, date '2026-01-01', 30, 15, 1, 0.05),
  ('30000000-0000-0000-0000-000000000105', '20000000-0000-0000-0000-000000000100', 'C100 legacy', 'LENDING', 70000000, date '2025-12-01', 180, 30, 2, 0.09);

insert into public.transactions (loan_id, type, transaction_date, amount_vnd, note, idempotency_key)
select loan.id, 'DISBURSEMENT', loan.disbursement_date, loan.original_principal_vnd, 'Synthetic C100 fixture', 'c100-disbursement-' || loan.id
from public.loans as loan
where loan.id between '30000000-0000-0000-0000-000000000100' and '30000000-0000-0000-0000-000000000105';

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000100', true);
set local role authenticated;

select public.onboard_legacy_loan(
  '30000000-0000-0000-0000-000000000105', date '2026-01-30',
  50000000, 1000000, date '2026-01-20',
  'Synthetic legacy cutover', 'c100-legacy-onboarding'
);

select public.record_financial_transaction(
  '30000000-0000-0000-0000-000000000100', 'PRINCIPAL_PAYMENT', date '2026-02-10',
  15000000, 'c100-principal', null, date '2026-04-30'
);
select public.record_financial_transaction(
  '30000000-0000-0000-0000-000000000100', 'INTEREST_PAYMENT', date '2026-03-01',
  3000000, 'c100-interest', null, date '2026-04-30'
);
select public.reverse_transaction(
  (select id from public.transactions where idempotency_key = 'c100-principal'),
  date '2026-04-10', 'Synthetic reversal', 'c100-principal-reversal', date '2026-04-30'
);

select public.record_lifecycle_event_v2(
  '30000000-0000-0000-0000-000000000101', 'BAD_DEBT_START', date '2026-03-10',
  'c100-stop', null, 'Synthetic interest stop', date '2026-04-30'
);
select public.record_lifecycle_event_v2(
  '30000000-0000-0000-0000-000000000101', 'INTEREST_RESUME', date '2026-04-05',
  'c100-resume', 0.05, 'Synthetic interest resume', date '2026-04-30'
);

do $restructure$
declare
  preview jsonb;
begin
  preview := public.preview_principal_restructure(
    '30000000-0000-0000-0000-000000000102', date '2026-03-20', 20000000
  );
  perform public.restructure_loan_principal(
    '30000000-0000-0000-0000-000000000102', date '2026-03-20', 20000000,
    (preview ->> 'principalBeforeVnd')::bigint,
    (preview ->> 'interestToSettleVnd')::bigint,
    'c100-restructure', 'Synthetic restructure', date '2026-04-30'
  );
end;
$restructure$;

select public.settle_loan(
  '30000000-0000-0000-0000-000000000103', date '2026-04-15',
  'c100-settlement', 'Synthetic settlement'
);

create temporary table c100_standard as
select
  public.get_management_dashboard_bundle_v3(
    date '2026-04-01', date '2026-04-30',
    date '2026-03-01', date '2026-03-31',
    date '2026-03-31', date '2026-03-31'
  ) as v3,
  public.get_management_dashboard_bundle_v4(
    date '2026-04-01', date '2026-04-30',
    date '2026-03-01', date '2026-03-31',
    date '2026-03-31', date '2026-03-31'
  ) as v4;

select is((select v4 from c100_standard), (select v3 from c100_standard),
  'v4 preserves the complete v3 JSON contract across payments, reversal, interest stop/resume, legacy onboarding, restructure, settlement and overdue loans');

select is(
  public.get_management_dashboard_bundle_v4(
    date '2026-02-01', date '2026-02-28',
    date '2026-04-01', date '2026-04-30',
    date '2026-03-31', date '2026-03-31'
  ),
  public.get_management_dashboard_bundle_v3(
    date '2026-02-01', date '2026-02-28',
    date '2026-04-01', date '2026-04-30',
    date '2026-03-31', date '2026-03-31'
  ),
  'v4 remains exact when the comparison period is later than the current period'
);

reset role;

create temporary table c100_resume_calculation as
select private.calculate_loan_json(
  '30000000-0000-0000-0000-000000000101', date '2026-04-30'
) as value;

select is(
  private.dashboard_accrued_through((select value from c100_resume_calculation), date '2026-03-31'),
  (select coalesce(sum((period ->> 'accruedInterestVnd')::bigint), 0)::bigint
   from jsonb_array_elements(private.calculate_loan_json(
     '30000000-0000-0000-0000-000000000101', date '2026-03-31'
   ) -> 'periods') as period),
  'cutoff extraction preserves rounded accrual through a stopped-interest period'
);

select is(
  private.dashboard_interest_balance_at(
    '30000000-0000-0000-0000-000000000100',
    private.calculate_loan_json('30000000-0000-0000-0000-000000000100', date '2026-04-30'),
    date '2026-03-15'
  ),
  (private.calculate_loan_json(
    '30000000-0000-0000-0000-000000000100', date '2026-03-15'
  ) ->> 'interestBalanceVnd')::bigint,
  'cutoff extraction preserves interest balance with an effective reversal'
);

select is(
  (select state.calculated_status::text || ':' || state.principal_outstanding_vnd::text
   from private.dashboard_loan_state_at(
     '30000000-0000-0000-0000-000000000103', date '2026-04-30'
   ) as state),
  (select (calculation ->> 'status') || ':' || (calculation ->> 'principalOutstandingVnd')
   from (select private.calculate_loan_json(
     '30000000-0000-0000-0000-000000000103', date '2026-04-30'
   ) as calculation) as source),
  'single-pass state projection preserves settlement status and principal'
);

select ok(
  has_function_privilege('authenticated', 'public.get_management_dashboard_bundle_v4(date,date,date,date,date,date)', 'EXECUTE'),
  'authenticated can execute v4'
);
select ok(
  not has_function_privilege('anon', 'public.get_management_dashboard_bundle_v4(date,date,date,date,date,date)', 'EXECUTE'),
  'anon cannot execute v4'
);
select ok(
  not has_function_privilege('authenticated', 'private.dashboard_accrued_through(jsonb,date)', 'EXECUTE'),
  'authenticated cannot execute the private accrual helper directly'
);
select ok(
  not has_function_privilege('authenticated', 'private.dashboard_loan_state_at(uuid,date)', 'EXECUTE'),
  'authenticated cannot execute the private state helper directly'
);
select ok(
  not has_function_privilege('authenticated', 'private.dashboard_interest_balance_at(uuid,jsonb,date)', 'EXECUTE'),
  'authenticated cannot execute the private balance helper directly'
);

select throws_ok(
  $$select public.get_management_dashboard_bundle_v4(
    date '2026-04-30', date '2026-04-01',
    date '2026-03-01', date '2026-03-31',
    date '2026-03-31', date '2026-03-31'
  )$$,
  '22007', null,
  'v4 rejects a reversed current period'
);

select throws_ok(
  $$select public.get_management_dashboard_bundle_v4(
    date '2020-01-01', date '2026-04-30',
    date '2026-03-01', date '2026-03-31',
    date '2026-03-31', date '2026-03-31'
  )$$,
  '22023', null,
  'v4 keeps the five-year dashboard range guard'
);

select is(
  (select provolatile::text from pg_proc where oid = 'public.get_management_dashboard_bundle_v4(date,date,date,date,date,date)'::regprocedure),
  's',
  'v4 is stable and stores no cross-request or cross-user cache state'
);

select * from finish();
rollback;
