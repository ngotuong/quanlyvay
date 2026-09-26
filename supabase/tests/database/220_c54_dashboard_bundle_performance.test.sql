begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000054',
  'c54_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"c54_owner","display_name":"C54 fake owner","app_role":"OWNER"}'::jsonb
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000054', true);
set local role authenticated;

select public.create_counterparty('C54 dashboard benchmark', null);

select public.create_loan_v3(
  (select id from public.counterparties where name = 'C54 dashboard benchmark'),
  'C54 loan ' || number,
  case when number % 3 = 0 then 'BORROWING'::public.loan_direction else 'LENDING'::public.loan_direction end,
  (10000000 + number * 100000)::bigint,
  (date '2025-01-01' + number)::date,
  null,
  30::smallint,
  3::numeric,
  2::smallint,
  'c54-loan-' || number,
  null
)
from generate_series(1, 40) as number;

select public.record_financial_transaction(
  loan.id,
  'INTEREST_PAYMENT'::public.transaction_type,
  date '2026-08-10',
  10000::bigint,
  'c54-interest-' || loan.id,
  null,
  date '2026-09-25'
)
from public.loans as loan
where loan.name like 'C54 loan %'
  and loan.direction = 'LENDING';

create temporary table c54_previous as
select public.get_management_dashboard('2026-08-01', '2026-08-25') as value;

create temporary table c54_balance as
select public.get_management_dashboard('2026-08-31', '2026-08-31') as value;

create temporary table c54_bundle as
select public.get_management_dashboard_bundle_v3(
  '2026-09-01', '2026-09-25',
  '2026-08-01', '2026-08-25',
  '2026-08-31', '2026-08-31'
) as value;

select is(
  (select value #>> '{previousDashboard,cashProfitVnd}' from c54_bundle),
  (select value ->> 'cashProfitVnd' from c54_previous),
  'optimized comparison preserves cash profit'
);
select is(
  (select value #>> '{previousDashboard,accrualProfitVnd}' from c54_bundle),
  (select value ->> 'accrualProfitVnd' from c54_previous),
  'optimized comparison preserves accrued profit'
);
select is(
  (select value #>> '{previousDashboard,lendingAccruedVnd}' from c54_bundle),
  (select value ->> 'lendingAccruedVnd' from c54_previous),
  'optimized comparison preserves lending accrual'
);
select is(
  (select value #>> '{previousDashboard,borrowingAccruedVnd}' from c54_bundle),
  (select value ->> 'borrowingAccruedVnd' from c54_previous),
  'optimized comparison preserves borrowing accrual'
);
select is(
  (select value #>> '{previousBalanceDashboard,activeLendingOutstandingVnd}' from c54_bundle),
  (select value ->> 'activeLendingOutstandingVnd' from c54_balance),
  'optimized balance comparison preserves active lending'
);
select is(
  (select value #>> '{previousBalanceDashboard,badDebtLendingOutstandingVnd}' from c54_bundle),
  (select value ->> 'badDebtLendingOutstandingVnd' from c54_balance),
  'optimized balance comparison preserves bad-debt lending'
);
select is(
  (select value #>> '{previousBalanceDashboard,totalLendingExposureVnd}' from c54_bundle),
  (select value ->> 'totalLendingExposureVnd' from c54_balance),
  'optimized balance comparison preserves total lending exposure'
);
select is(
  (select value #>> '{previousBalanceDashboard,activeBorrowingOutstandingVnd}' from c54_bundle),
  (select value ->> 'activeBorrowingOutstandingVnd' from c54_balance),
  'optimized balance comparison preserves active borrowing'
);
select is(
  (select value #>> '{previousBalanceDashboard,badDebtBorrowingOutstandingVnd}' from c54_bundle),
  (select value ->> 'badDebtBorrowingOutstandingVnd' from c54_balance),
  'optimized balance comparison preserves bad-debt borrowing'
);
select is(
  (select value #>> '{previousBalanceDashboard,totalBorrowingExposureVnd}' from c54_bundle),
  (select value ->> 'totalBorrowingExposureVnd' from c54_balance),
  'optimized balance comparison preserves total borrowing exposure'
);

reset role;
select ok(
  not has_function_privilege('authenticated', 'private.get_management_flow_comparison(date,date)', 'EXECUTE'),
  'authenticated cannot call the private flow projection directly'
);
select ok(
  not has_function_privilege('authenticated', 'private.get_management_balance_comparison(date)', 'EXECUTE'),
  'authenticated cannot call the private balance projection directly'
);

set local role authenticated;
set local statement_timeout = '6s';
select lives_ok(
  $$select public.get_management_dashboard_bundle_v3(
    '2026-09-01', '2026-09-25',
    '2026-08-01', '2026-08-25',
    '2026-08-31', '2026-08-31'
  )$$,
  '40-loan dashboard bundle stays below a six-second regression budget'
);

select * from finish();
rollback;
